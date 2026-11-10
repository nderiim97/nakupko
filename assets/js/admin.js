/* Nakupko demo admin: client-side product editor.
   The password gate is cosmetic: this is a static site and everything runs
   in the browser. Custom products live in localStorage only. */
(function () {
  const NK = window.NK;
  const ART = window.NKArt;
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const PASSWORD = "12345678";
  const SESSION_KEY = "nakupko.admin.session";
  const root = $("#admin-root");
  if (!root) return;

  const ART_OPTIONS = [
    ["generic", "Splošno"],
    ["washer", "Pralni stroj"],
    ["fridge", "Hladilnik"],
    ["dishwasher", "Pomivalni stroj"],
    ["laptop", "Prenosnik"],
    ["monitor", "Monitor"],
    ["headphones", "Slušalke"],
    ["tv", "Televizor"],
    ["speaker", "Zvočnik"],
    ["espresso", "Espresso aparat"],
    ["blender", "Mešalnik"],
    ["kettle", "Kuhalnik"],
    ["lamp", "Svetilka"],
    ["rug", "Preproga"],
    ["organizer", "Organizator"],
    ["yoga", "Podloga za jogo"],
    ["thermos", "Termovka"],
    ["diffuser", "Difuzor"],
    ["skincare", "Nega kože"],
    ["blocks", "Kocke"],
    ["bear", "Medvedek"]
  ];

  let editingId = "";
  let activeTab = "overview";
  const DAY_MS = 86400000;
  const PAGE_LABELS = {
    home: "Domov",
    category: "Kategorija",
    search: "Iskanje",
    product: "Izdelek",
    cart: "Košarica",
    checkout: "Blagajna",
    wishlist: "Seznam želja",
    order: "Naročilo",
    info: "Informacije",
    other: "Drugo"
  };
  const EVENT_LABELS = {
    pageview: "Ogled strani",
    "product-click": "Klik na izdelek",
    "product-view": "Ogled izdelka",
    "add-to-cart": "Dodano v košarico",
    search: "Iskanje",
    checkout: "Začetek blagajne",
    order: "Naročilo"
  };
  const ORDER_STATUS_LABELS = {
    new: "Novo",
    approved: "Odobreno",
    shipped: "Poslano"
  };

  function isLoggedIn() {
    try {
      return window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function setLoggedIn(value) {
    try {
      if (value) window.sessionStorage.setItem(SESSION_KEY, "1");
      else window.sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      /* Storage may be blocked; the current view still works. */
    }
  }

  function option(value, label, selected) {
    return (
      '<option value="' + NK.escapeHtml(value) + '"' + (selected ? " selected" : "") + ">" + NK.escapeHtml(label) + "</option>"
    );
  }

  function categoryOptions(selected) {
    return NK.categories.map((category) => option(category.slug, category.name, category.slug === selected)).join("");
  }

  function artOptions(selected) {
    return ART_OPTIONS.map((entry) => option(entry[0], entry[1], entry[0] === selected)).join("");
  }

  function showFormError(message) {
    const error = $("#admin-form-error");
    if (!error) return;
    error.textContent = message || "";
    error.classList.toggle("is-visible", Boolean(message));
  }

  /* -------------------------------------------------------------- login */
  function renderLogin(message) {
    root.innerHTML =
      '<div class="admin-login"><div class="admin-card">' +
      '<p class="eyebrow">Skrbništvo</p>' +
      "<h2>Prijava</h2>" +
      '<p class="admin-note">Demo zaščita: geslo je del javne kode strani, zato ni primerno za pravo zaščito. Izdelki se shranjujejo samo v tem brskalniku.</p>' +
      '<form id="admin-login-form" class="admin-login__form" novalidate>' +
      '<div class="field"><label for="admin-password">Geslo</label>' +
      '<input id="admin-password" name="password" type="password" autocomplete="current-password" required></div>' +
      '<p class="admin-error' + (message ? " is-visible" : "") + '" id="admin-login-error" role="alert">' +
      NK.escapeHtml(message || "") +
      "</p>" +
      '<button class="btn btn--primary btn--block" type="submit">Prijava</button>' +
      "</form>" +
      '<p class="admin-hint">Geslo je določeno v datoteki <code>assets/js/admin.js</code>.</p>' +
      "</div></div>";

    const form = $("#admin-login-form");
    const input = $("#admin-password");
    if (input) input.focus();

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = input ? input.value : "";
        if (value === PASSWORD) {
          setLoggedIn(true);
          renderPanel();
          return;
        }
        const error = $("#admin-login-error");
        if (error) {
          error.textContent = "Napačno geslo. Poskusite znova.";
          error.classList.add("is-visible");
        }
        if (input) {
          input.value = "";
          input.focus();
        }
      });
    }
  }

  /* -------------------------------------------------------------- panel */
  function adminCatalog() {
    const custom = NK.getCustomProducts();
    const customIds = new Set(custom.map((product) => product.id));
    return custom.concat(NK.products.filter((product) => !customIds.has(product.id)));
  }

  function adminItem(product, hidden) {
    const category = NK.categoryBySlug(product.category);
    const id = NK.escapeHtml(product.id);
    const thumb =
      '<span class="admin-thumb">' + ART.product(product.art, product.palette, product.name) + "</span>";
    const open = hidden
      ? thumb
      : '<a class="admin-thumb" href="' + NK.productUrl(product) + '">' +
        ART.product(product.art, product.palette, product.name) +
        "</a>";
    const actions = hidden
      ? '<button class="btn btn--soft" type="button" data-restore="' + id + '">Vrni v trgovino</button>'
      : '<a class="btn btn--soft" href="' + NK.productUrl(product) + '">Poglej</a>' +
        (product.custom
          ? '<button class="btn btn--soft" type="button" data-edit="' + id + '">Uredi</button>'
          : "") +
        '<button class="btn btn--ghost admin-danger" type="button" data-delete="' + id + '">' +
        (product.custom ? "Izbriši" : "Odstrani") +
        "</button>";

    return (
      '<article class="admin-item' + (hidden ? " admin-item--hidden" : "") + '">' +
      open +
      '<div class="admin-item__body">' +
      "<strong>" + NK.escapeHtml(product.name) + "</strong>" +
      "<span>" + NK.escapeHtml(category ? category.name : product.category) + " · " + NK.money(product.price) + "</span>" +
      '<span class="admin-sku">' + NK.escapeHtml(product.sku || "") + "</span>" +
      '<span class="admin-type">' + (hidden ? "Odstranjen" : product.custom ? "Vaš izdelek" : "Osnovna ponudba") + "</span>" +
      "</div>" +
      '<div class="admin-item__actions">' + actions + "</div></article>"
    );
  }

  function tabButton(name, label, icon) {
    return (
      '<button class="admin-tab" type="button" role="tab" aria-selected="false" data-admin-tab="' +
      name +
      '">' +
      ART.icon(icon, 17) +
      "<span>" +
      label +
      "</span></button>"
    );
  }

  function renderPanel() {
    editingId = "";
    const items = adminCatalog();
    const defaultCategory = NK.categories[0] ? NK.categories[0].slug : "";

    root.innerHTML =
      '<div class="admin-top">' +
      '<p class="admin-note">Pregled obiska, naročila strank, urejanje izdelkov in povezava Stripe plačil. Vsi podatki ostanejo samo v <code>localStorage</code> tega brskalnika.</p>' +
      '<div class="admin-top__actions">' +
      '<a class="btn btn--soft" href="index.html">Odpri trgovino</a>' +
      '<button class="btn btn--ghost" type="button" id="admin-logout">Odjava</button>' +
      "</div></div>" +
      '<div class="admin-tabs" role="tablist" aria-label="Skrbniški razdelki">' +
      tabButton("overview", "Pregled", "spark") +
      tabButton("orders", "Naročila", "truck") +
      tabButton("products", "Izdelki", "cart") +
      tabButton("payments", "Plačila", "lock") +
      "</div>" +
      '<section class="admin-view" data-admin-view="overview">' +
      '<div id="admin-dashboard"></div>' +
      "</section>" +
      '<section class="admin-view" data-admin-view="orders" hidden>' +
      '<div id="admin-orders"></div>' +
      "</section>" +
      '<section class="admin-view" data-admin-view="products" hidden>' +
      '<div class="admin-layout">' +
      '<section class="admin-card admin-form-card">' +
      '<div class="admin-card__head"><div><h2 id="admin-form-title">Dodaj izdelek</h2><p>Izberite rubriko, nastavite ceno in shranite.</p></div></div>' +
      '<form id="admin-form" class="admin-form" novalidate>' +
      '<div class="form-grid">' +
      '<div class="field"><label for="admin-name">Naziv izdelka</label>' +
      '<input id="admin-name" name="name" type="text" maxlength="90" required placeholder="npr. Kuhalnik vode Vita Rapid"></div>' +
      '<div class="field"><label for="admin-category">Rubrika</label><select id="admin-category" name="category">' +
      categoryOptions(defaultCategory) +
      "</select></div>" +
      "</div>" +
      '<div class="form-grid">' +
      '<div class="field"><label for="admin-price">Cena (€)</label>' +
      '<input id="admin-price" name="price" type="number" min="0.01" step="0.01" required placeholder="49.90"></div>' +
      '<div class="field"><label for="admin-old-price">Stara cena <span>(neobvezno)</span></label>' +
      '<input id="admin-old-price" name="oldPrice" type="number" min="0" step="0.01" placeholder="npr. 59.90"></div>' +
      "</div>" +
      '<div class="form-grid">' +
      '<div class="field"><label for="admin-brand">Blagovna znamka <span>(neobvezno)</span></label>' +
      '<input id="admin-brand" name="brand" type="text" maxlength="40" placeholder="Nakupko"></div>' +
      '<div class="field"><label for="admin-art">Ilustracija</label><select id="admin-art" name="art">' +
      artOptions(NK.categoryArt(defaultCategory)) +
      "</select></div>" +
      "</div>" +
      '<div class="form-grid">' +
      '<div class="field"><label for="admin-color-name">Barva <span>(neobvezno)</span></label>' +
      '<input id="admin-color-name" name="colorName" type="text" maxlength="30" placeholder="npr. Mint"></div>' +
      '<div class="field"><label for="admin-color-hex">Odtenek</label>' +
      '<input id="admin-color-hex" name="colorHex" type="color" value="#0f766e"></div>' +
      "</div>" +
      '<div class="field"><label for="admin-description">Kratek opis <span>(neobvezno)</span></label>' +
      '<textarea id="admin-description" name="description" maxlength="400" placeholder="Nekaj stavkov o izdelku."></textarea></div>' +
      '<div class="admin-preview" id="admin-preview" aria-hidden="true"></div>' +
      '<p class="admin-error" id="admin-form-error" role="alert"></p>' +
      '<div class="admin-form__actions">' +
      '<button class="btn btn--primary" type="submit" id="admin-submit">Dodaj izdelek</button>' +
      '<button class="btn btn--ghost" type="button" id="admin-cancel" hidden>Prekliči urejanje</button>' +
      "</div></form></section>" +
      '<section class="admin-card">' +
      '<div class="admin-card__head"><div><h2>Izdelki v trgovini</h2><p>Odstranite ali izbrišite izdelke in dodajte nove.</p></div>' +
      '<span class="admin-count" id="admin-count">' +
      items.length +
      "</span></div>" +
      '<div class="admin-tools"><label class="sr-only" for="admin-search">Iskanje izdelkov</label>' +
      '<input id="admin-search" type="search" placeholder="Iskanje po nazivu, rubriki ali šifri" autocomplete="off"></div>' +
      '<div class="admin-list admin-list--scroll" id="admin-list"></div>' +
      '<div id="admin-hidden-wrap"></div>' +
      "</section></div></section>" +
      '<section class="admin-view" data-admin-view="payments" hidden>' +
      stripePanelHtml() +
      "</section>";

    renderList();
    renderHidden();
    renderOrders();
    bindSearch();
    bindForm();
    bindTabs();
    bindStripeForm();

    const logout = $("#admin-logout");
    if (logout) {
      logout.addEventListener("click", () => {
        setLoggedIn(false);
        renderLogin();
      });
    }
  }

  /* ------------------------------------------------------------ dashboard */
  function localDayKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  function dayShort(date) {
    return ["ned", "pon", "tor", "sre", "čet", "pet", "sob"][date.getDay()];
  }

  function slPlural(count, forms) {
    const value = Math.abs(Number(count) || 0);
    const mod100 = value % 100;
    const mod10 = value % 10;
    if (mod100 === 1) return forms[0];
    if (mod100 === 2) return forms[1];
    if (mod100 === 3 || mod100 === 4) return forms[2];
    return forms[3];
  }

  function pageLabel(page) {
    return PAGE_LABELS[page] || page || "Drugo";
  }

  function eventTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const today = localDayKey(Date.now());
    const time = date.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" });
    return localDayKey(date) === today ? time : NK.longDate(date) + " · " + time;
  }

  function eventDetail(event) {
    if (!event) return "";
    if (event.type === "pageview") return pageLabel(event.page);
    if (event.type === "search") return "„" + String(event.query || "") + "“";
    if (event.type === "checkout") {
      return (event.items || 0) + " " + slPlural(event.items || 0, ["izdelek", "izdelka", "izdelki", "izdelkov"]);
    }
    if (event.type === "order") {
      return (event.orderId || "") + " · " + NK.money(event.total || 0);
    }
    return event.name || event.id || "";
  }

  function dashboardData() {
    const events = NK.getAnalyticsEvents();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * DAY_MS;
    const week = events.filter((event) => Number(event.t) >= weekStart);
    const pageviews = events.filter((event) => event.type === "pageview");
    const weekPageviews = week.filter((event) => event.type === "pageview");
    const clicks = events.filter((event) => event.type === "product-click");
    const views = events.filter((event) => event.type === "product-view");
    const adds = events.filter((event) => event.type === "add-to-cart");
    const orders = events.filter((event) => event.type === "order");
    const visitors = new Set(
      week
        .map((event) => event.visitor)
        .filter((value) => Boolean(value))
    );

    const byProduct = new Map();
    events.forEach((event) => {
      if (!["product-click", "product-view", "add-to-cart"].includes(event.type)) return;
      const key = event.id || event.name || "neznano";
      const entry =
        byProduct.get(key) || {
          id: event.id || "",
          name: event.name || event.id || "Neznan izdelek",
          clicks: 0,
          views: 0,
          adds: 0
        };
      if (event.type === "product-click") entry.clicks += 1;
      else if (event.type === "product-view") entry.views += 1;
      else entry.adds += 1;
      byProduct.set(key, entry);
    });
    const topProducts = Array.from(byProduct.values())
      .sort((a, b) => b.clicks - a.clicks || b.views - a.views || b.adds - a.adds)
      .slice(0, 6);

    const byPage = new Map();
    pageviews.forEach((event) => {
      const key = event.page || "other";
      byPage.set(key, (byPage.get(key) || 0) + 1);
    });
    const topPages = Array.from(byPage.entries())
      .map(([page, count]) => ({ page: page, count: count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const byCountry = new Map();
    pageviews.forEach((event) => {
      const name = event.countryName || NK.countryName(event.country);
      byCountry.set(name, (byCountry.get(name) || 0) + 1);
    });
    const countries = Array.from(byCountry.entries())
      .map(([name, count]) => ({ name: name, count: count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      const key = localDayKey(date);
      days.push({
        key: key,
        label: dayShort(date),
        count: weekPageviews.filter((event) => localDayKey(event.t) === key).length
      });
    }

    return {
      events: events,
      pageviews: pageviews.length,
      weekPageviews: weekPageviews.length,
      visitors: visitors.size,
      clicks: clicks.length,
      views: views.length,
      adds: adds.length,
      orders: orders.length,
      revenue: orders.reduce((total, event) => total + (Number(event.total) || 0), 0),
      topProducts: topProducts,
      topPages: topPages,
      countries: countries,
      days: days,
      pendingOrders: NK.getOrders().filter((order) => orderStatus(order) === "new").length,
      recent: events.slice(-9).reverse()
    };
  }

  function kpiCard(label, value, note, accent) {
    return (
      '<article class="kpi-card' +
      (accent ? " kpi-card--accent" : "") +
      '"><span class="kpi-card__label">' +
      NK.escapeHtml(label) +
      '</span><strong>' +
      NK.escapeHtml(value) +
      "</strong><small>" +
      NK.escapeHtml(note) +
      "</small></article>"
    );
  }

  function chartHtml(days) {
    const max = Math.max.apply(
      null,
      days.map((day) => day.count).concat([1])
    );
    return (
      '<div class="dash-chart" role="img" aria-label="Ogledi strani v zadnjih sedmih dneh">' +
      days
        .map((day) => {
          const height = day.count ? Math.max(8, Math.round((day.count / max) * 100)) : 3;
          return (
            '<div class="dash-chart__col">' +
            '<span class="dash-chart__count">' +
            day.count +
            "</span>" +
            '<span class="dash-chart__track"><span class="dash-chart__bar" style="height:' +
            height +
            '%"></span></span>' +
            '<span class="dash-chart__day">' +
            day.label +
            "</span></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function productsHtml(products) {
    if (!products.length) {
      return '<p class="dash-empty">Ni še klikov na izdelke. Odprite trgovino in kliknite izdelek.</p>';
    }
    return (
      '<ol class="rank-list">' +
      products
        .map((product, index) => {
          const parts = [
            product.clicks + " " + slPlural(product.clicks, ["klik", "klika", "kliki", "klikov"]),
            product.views + " " + slPlural(product.views, ["ogled", "ogleda", "ogledi", "ogledov"]),
            product.adds + " v košarici"
          ];
          return (
            '<li class="rank-row">' +
            '<span class="rank-row__num">' +
            (index + 1) +
            "</span>" +
            '<span class="rank-row__main"><strong>' +
            NK.escapeHtml(product.name) +
            "</strong><small>" +
            NK.escapeHtml(parts.join(" · ")) +
            "</small></span>" +
            '<span class="rank-row__value"><strong>' +
            product.clicks +
            '</strong><small>klikov</small></span></li>'
          );
        })
        .join("") +
      "</ol>"
    );
  }

  function pagesHtml(pages, total) {
    if (!pages.length) {
      return '<p class="dash-empty">Ni še ogledov strani.</p>';
    }
    return (
      '<ul class="page-list">' +
      pages
        .map((item) => {
          const share = total ? Math.round((item.count / total) * 100) : 0;
          return (
            '<li class="page-row"><div class="page-row__head"><strong>' +
            NK.escapeHtml(pageLabel(item.page)) +
            "</strong><span>" +
            item.count +
            " · " +
            share +
            '%</span></div><span class="page-row__bar"><span style="width:' +
            Math.max(3, share) +
            '%"></span></span></li>'
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function countriesHtml(countries, total) {
    if (!countries.length) {
      return '<p class="dash-empty">Država bo prikazana, ko bo zabeležen vsaj en obisk.</p>';
    }
    return (
      '<ul class="country-list">' +
      countries
        .map((item) => {
          const share = total ? Math.round((item.count / total) * 100) : 0;
          return (
            '<li class="country-row"><div class="country-row__head"><strong>' +
            NK.escapeHtml(item.name) +
            "</strong><span>" +
            item.count +
            " · " +
            share +
            '%</span></div><span class="country-row__bar"><span style="width:' +
            Math.max(3, share) +
            '%"></span></span></li>'
          );
        })
        .join("") +
      "</ul>" +
      '<p class="dash-footnote">Država je približna in izhaja iz jezika brskalnika ter časovnega pasu.</p>'
    );
  }

  function activityHtml(events) {
    if (!events.length) {
      return '<p class="dash-empty">Ni še zabeležene aktivnosti.</p>';
    }
    return (
      '<ul class="activity-list">' +
      events
        .map(
          (event) =>
            '<li class="activity-row"><span class="activity-row__dot" aria-hidden="true"></span><span class="activity-row__main"><strong>' +
            NK.escapeHtml(EVENT_LABELS[event.type] || event.type) +
            "</strong><small>" +
            NK.escapeHtml(eventDetail(event)) +
            '</small></span><time datetime="' +
            new Date(event.t).toISOString() +
            '">' +
            NK.escapeHtml(eventTime(event.t)) +
            "</time></li>"
        )
        .join("") +
      "</ul>"
    );
  }

  function dashboardHtml() {
    const data = dashboardData();
    return (
      '<div class="admin-dash">' +
      '<div class="dash-head"><div><h2>Pregled obiska</h2><p>Lokalna statistika tega brskalnika. Podatki se ne pošiljajo nikamor.</p></div>' +
      '<div class="dash-actions">' +
      '<button class="btn btn--soft" type="button" data-dash-orders>Naročila' +
      (data.pendingOrders ? " (" + data.pendingOrders + ")" : "") +
      "</button>" +
      '<button class="btn btn--soft" type="button" data-dash-refresh>Osveži</button>' +
      '<button class="btn btn--soft" type="button" data-dash-seed>Demo podatki</button>' +
      '<button class="btn btn--ghost admin-danger" type="button" data-dash-clear>Počisti</button>' +
      "</div></div>" +
      '<div class="kpi-grid">' +
      kpiCard("Ogledi strani", data.pageviews, data.weekPageviews + " v zadnjih 7 dneh", false) +
      kpiCard("Obiskovalci", data.visitors, "edinstveni v zadnjih 7 dneh", true) +
      kpiCard("Kliki na izdelke", data.clicks, data.views + " ogledov izdelkov", false) +
      kpiCard("Naročila", data.orders, NK.money(data.revenue) + " skupaj", false) +
      "</div>" +
      '<div class="dash-grid">' +
      '<section class="dash-card"><div class="dash-card__head"><div><h2>Promet v 7 dneh</h2><p>Ogledi strani po dnevih</p></div><span class="dash-pill">' +
      data.weekPageviews +
      " ogledov</span></div>" +
      chartHtml(data.days) +
      "</section>" +
      '<section class="dash-card"><div class="dash-card__head"><div><h2>Države obiskovalcev</h2><p>Približno glede na brskalnik</p></div></div>' +
      countriesHtml(data.countries, data.pageviews) +
      "</section></div>" +
      '<div class="dash-grid">' +
      '<section class="dash-card"><div class="dash-card__head"><div><h2>Najbolj klikani izdelki</h2><p>Klik na izdelek, ogled in košarica</p></div></div>' +
      productsHtml(data.topProducts) +
      "</section>" +
      '<section class="dash-card"><div class="dash-card__head"><div><h2>Najbolj obiskane strani</h2><p>Delež vseh ogledov strani</p></div></div>' +
      pagesHtml(data.topPages, data.pageviews) +
      "</section></div>" +
      '<section class="dash-card"><div class="dash-card__head"><div><h2>Zadnja aktivnost</h2><p>Najnovejši dogodki v tem brskalniku</p></div><button class="btn btn--soft" type="button" data-dash-seed>Vstavi demo podatke</button></div>' +
      activityHtml(data.recent) +
      "</section>" +
      '<p class="dash-footnote">Demo statistika: vsi dogodki so shranjeni lokalno pod ključem <code>nakupko.analytics.v1</code>. Za pravo analitiko bi potrebovali strežnik in soglasje obiskovalcev.</p>' +
      "</div>"
    );
  }

  function renderDashboard() {
    const host = $("#admin-dashboard");
    if (!host) return;
    host.innerHTML = dashboardHtml();
    bindDashboard();
  }

  function seedDemoAnalytics() {
    const products = NK.products.slice(0, 10);
    if (!products.length) {
      NK.toast("Najprej dodajte vsaj en izdelek.", "info");
      return;
    }
    const countries = [
      ["SI", "Slovenija"],
      ["SI", "Slovenija"],
      ["SI", "Slovenija"],
      ["HR", "Hrvaška"],
      ["HR", "Hrvaška"],
      ["RS", "Srbija"],
      ["BA", "Bosna in Hercegovina"],
      ["AT", "Avstrija"],
      ["IT", "Italija"],
      ["DE", "Nemčija"]
    ];
    const pages = ["home", "home", "home", "category", "category", "product", "search", "cart", "checkout", "wishlist"];
    const now = Date.now();
    const events = [];

    for (let day = 6; day >= 0; day -= 1) {
      const dayStart = now - day * DAY_MS;
      const visits = 10 + Math.floor(Math.random() * 16);
      for (let index = 0; index < visits; index += 1) {
        const t = dayStart - Math.floor(Math.random() * 9 * 3600000);
        const country = countries[Math.floor(Math.random() * countries.length)];
        const visitor = "demo-v" + Math.floor(Math.random() * 22);
        const page = pages[Math.floor(Math.random() * pages.length)];
        const base = {
          t: t,
          country: country[0],
          countryName: country[1],
          visitor: visitor,
          demo: true
        };
        events.push(Object.assign({ type: "pageview", page: page }, base));
        if (Math.random() < 0.6) {
          const product = products[Math.floor(Math.random() * products.length)];
          events.push(
            Object.assign(
              {
                type: "product-click",
                page: page,
                id: product.id,
                name: product.name,
                source: page
              },
              base
            )
          );
          if (Math.random() < 0.55) {
            events.push(
              Object.assign(
                { type: "product-view", page: "product", id: product.id, name: product.name, category: product.category },
                base
              )
            );
          }
          if (Math.random() < 0.3) {
            events.push(
              Object.assign(
                { type: "add-to-cart", page: "product", id: product.id, name: product.name, qty: 1, price: product.price },
                base
              )
            );
          }
        }
        if (Math.random() < 0.12) {
          events.push(Object.assign({ type: "order", page: "order", orderId: "DEMO-" + Math.floor(1000 + Math.random() * 9000), total: 20 + Math.random() * 180, items: 1 + Math.floor(Math.random() * 3) }, base));
        }
      }
    }

    events.sort((a, b) => a.t - b.t);
    NK.appendAnalyticsEvents(events);
    renderDashboard();
    NK.toast("Dodanih je " + events.length + " demo dogodkov.", "success");
  }

  function bindDashboard() {
    const host = $("#admin-dashboard");
    if (!host) return;
    const refresh = host.querySelector("[data-dash-refresh]");
    if (refresh) refresh.addEventListener("click", renderDashboard);
    const ordersButton = host.querySelector("[data-dash-orders]");
    if (ordersButton) ordersButton.addEventListener("click", () => setAdminTab("orders"));
    host.querySelectorAll("[data-dash-seed]").forEach((button) => {
      button.addEventListener("click", seedDemoAnalytics);
    });
    const clear = host.querySelector("[data-dash-clear]");
    if (clear) {
      clear.addEventListener("click", () => {
        if (!window.confirm("Počistim vso lokalno statistiko obiska? Tega dejanja ni mogoče razveljaviti.")) return;
        NK.clearAnalytics();
        renderDashboard();
        NK.toast("Statistika je počiščena.", "success");
      });
    }
  }

  /* --------------------------------------------------------------- orders */
  function orderStatus(order) {
    const status = order && order.status;
    return ORDER_STATUS_LABELS[status] ? status : "new";
  }

  function orderDateText(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const time = date.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" });
    return NK.longDate(date) + " · " + time;
  }

  function detailRow(label, value) {
    if (!value) return "";
    return (
      "<div><dt>" +
      NK.escapeHtml(label) +
      "</dt><dd>" +
      NK.escapeHtml(value) +
      "</dd></div>"
    );
  }

  function orderCardHtml(order) {
    const status = orderStatus(order);
    const customer = order.customer || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const totals = order.totals || {};
    const count = items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
    const address = [customer.address, [customer.postal, customer.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");
    const deliveryLabel = order.delivery && order.delivery.label ? order.delivery.label : "Standardna dostava";
    const paymentLabel = order.payment && order.payment.label ? order.payment.label : "Kartica";
    const id = NK.escapeHtml(order.id);
    let actions = "";
    if (status === "new") {
      actions =
        '<button class="btn btn--primary" type="button" data-order-approve="' +
        id +
        '">Odobri pošiljko</button>';
    } else if (status === "approved") {
      actions =
        '<button class="btn btn--primary" type="button" data-order-ship="' +
        id +
        '">Označi kot poslano</button>' +
        '<button class="btn btn--ghost" type="button" data-order-reset="' +
        id +
        '">Razveljavi</button>';
    } else {
      actions =
        '<span class="order-shipped-note">' +
        ART.icon("check", 15) +
        " Pošiljka je poslana</span>" +
        '<button class="btn btn--ghost" type="button" data-order-reset="' +
        id +
        '">Razveljavi</button>';
    }

    return (
      '<article class="order-admin">' +
      '<div class="order-admin__head">' +
      '<div class="order-admin__title">' +
      '<p class="order-admin__id">' +
      NK.escapeHtml(order.id) +
      (order.demo ? ' <span class="order-demo-tag">demo</span>' : "") +
      "</p>" +
      "<h3>" +
      NK.escapeHtml(customer.name || "Neznana stranka") +
      "</h3>" +
      "<p>" +
      NK.escapeHtml(orderDateText(order.createdAt)) +
      " · " +
      count +
      " " +
      slPlural(count, ["izdelek", "izdelka", "izdelki", "izdelkov"]) +
      "</p></div>" +
      '<span class="order-badge order-badge--' +
      status +
      '">' +
      ORDER_STATUS_LABELS[status] +
      "</span></div>" +
      '<div class="order-admin__grid">' +
      '<section class="order-admin__box">' +
      '<h4>' +
      ART.icon("user", 15) +
      " Podatki stranke</h4>" +
      '<dl class="order-customer">' +
      detailRow("Ime in priimek", customer.name) +
      detailRow("E-pošta", customer.email) +
      detailRow("Telefon", customer.phone) +
      detailRow("Naslov", address) +
      detailRow("Opomba", customer.note) +
      "</dl></section>" +
      '<section class="order-admin__box">' +
      '<h4>' +
      ART.icon("cart", 15) +
      " Izdelki</h4>" +
      '<ul class="order-lines">' +
      items
        .map(
          (item) =>
            "<li><span><strong>" +
            NK.escapeHtml(item.name || item.id || "Izdelek") +
            "</strong><small>" +
            (Number(item.qty) || 1) +
            " × " +
            NK.money(item.price || 0) +
            (item.color ? " · " + NK.escapeHtml(item.color) : "") +
            "</small></span><strong>" +
            NK.money(item.lineTotal || (Number(item.price) || 0) * (Number(item.qty) || 1)) +
            "</strong></li>"
        )
        .join("") +
      "</ul>" +
      '<div class="order-admin__totals">' +
      '<div class="summary-row"><span>Vmesni seštevek</span><strong>' +
      NK.money(totals.subtotal || 0) +
      "</strong></div>" +
      (totals.discount
        ? '<div class="summary-row summary-row--discount"><span>Popust</span><strong>−' +
          NK.money(totals.discount) +
          "</strong></div>"
        : "") +
      '<div class="summary-row"><span>Dostava</span><strong>' +
      (totals.shipping ? NK.money(totals.shipping) : "Brezplačno") +
      "</strong></div>" +
      (totals.fee
        ? '<div class="summary-row"><span>Doplačilo za plačilo</span><strong>' +
          NK.money(totals.fee) +
          "</strong></div>"
        : "") +
      '<div class="summary-total"><span>Skupaj</span><strong>' +
      NK.money(totals.total || 0) +
      "</strong></div></div></section></div>" +
      '<div class="order-admin__foot">' +
      '<div class="order-admin__meta"><span>' +
      ART.icon("truck", 15) +
      NK.escapeHtml(deliveryLabel) +
      "</span><span>" +
      ART.icon("shield", 15) +
      NK.escapeHtml(paymentLabel) +
      "</span></div>" +
      '<div class="order-admin__actions">' +
      actions +
      "</div></div></article>"
    );
  }

  function orderStat(label, value, status) {
    return (
      '<div class="order-stat order-stat--' +
      status +
      '"><span>' +
      NK.escapeHtml(label) +
      "</span><strong>" +
      value +
      "</strong></div>"
    );
  }

  function ordersHtml() {
    const orders = NK.getOrders().slice().reverse();
    const counts = { new: 0, approved: 0, shipped: 0 };
    orders.forEach((order) => {
      counts[orderStatus(order)] += 1;
    });
    return (
      '<div class="admin-orders">' +
      '<div class="dash-head"><div><h2>Naročila strank</h2><p>Preglejte podatke strank in odobrite pošiljanje izdelkov.</p></div>' +
      '<div class="dash-actions">' +
      '<button class="btn btn--soft" type="button" data-order-refresh>Osveži</button>' +
      '<button class="btn btn--soft" type="button" data-order-demo>Demo naročilo</button>' +
      "</div></div>" +
      '<div class="order-stats">' +
      orderStat("Nova naročila", counts.new, "new") +
      orderStat("Odobrena", counts.approved, "approved") +
      orderStat("Poslana", counts.shipped, "shipped") +
      "</div>" +
      (orders.length
        ? '<div class="orders-list">' + orders.map(orderCardHtml).join("") + "</div>"
        : '<div class="dash-empty">Ni še naročil. Dokončajte nakup v trgovini ali dodajte demo naročilo.</div>') +
      '<p class="dash-footnote">Naročila so shranjena samo v tem brskalniku pod ključem <code>nakupko.orders.v1</code>. Odobritev pošiljke je demo oznaka; pravo obvestilo stranki bi poslal strežnik.</p>' +
      "</div>"
    );
  }

  function renderOrders() {
    const host = $("#admin-orders");
    if (!host) return;
    host.innerHTML = ordersHtml();
    bindOrders();
  }

  function changeOrderStatus(orderId, status) {
    const result = NK.updateOrderStatus(orderId, status);
    if (!result.ok) {
      NK.toast(result.message || "Statusa ni bilo mogoče spremeniti.", "info");
      return;
    }
    renderOrders();
    const messages = {
      approved: "Pošiljka je odobrena.",
      shipped: "Naročilo je označeno kot poslano.",
      new: "Odobritev je razveljavljena."
    };
    NK.toast(messages[status] || "Status je posodobljen.", "success");
  }

  function addDemoOrder() {
    const products = NK.products.filter((product) => product && product.price);
    if (!products.length) {
      NK.toast("Ni izdelkov za demo naročilo.", "info");
      return;
    }
    const chosen = [];
    const wanted = 1 + Math.floor(Math.random() * 2);
    while (chosen.length < wanted && chosen.length < products.length) {
      const product = products[Math.floor(Math.random() * products.length)];
      if (!chosen.some((item) => item.id === product.id)) chosen.push(product);
    }
    const customers = [
      {
        name: "Maja Kovač",
        email: "maja.kovac@example.com",
        phone: "+386 41 555 120",
        address: "Cvetna ulica 12",
        postal: "1000",
        city: "Ljubljana",
        note: ""
      },
      {
        name: "Luka Novak",
        email: "luka.novak@example.com",
        phone: "+386 51 442 908",
        address: "Trg svobode 4",
        postal: "2000",
        city: "Maribor",
        note: "Prosim za dostavo po 16. uri."
      },
      {
        name: "Ana Horvat",
        email: "ana.horvat@example.com",
        phone: "+386 31 778 204",
        address: "Obala 8",
        postal: "6000",
        city: "Koper",
        note: ""
      }
    ];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const items = chosen.map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      qty: 1,
      color: product.colors && product.colors[0] ? product.colors[0].name : "",
      price: product.price,
      lineTotal: product.price
    }));
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = subtotal >= 60 ? 0 : 4.9;
    const now = new Date();
    const order = {
      id:
        "DEMO-" +
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "-" +
        String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: now.toISOString(),
      estimated: new Date(now.getTime() + 3 * 86400000).toISOString(),
      status: "new",
      demo: true,
      customer: customer,
      delivery: { method: "standard", label: "Standardna dostava", price: shipping },
      payment: { method: "card", label: "Kartica", fee: 0 },
      items: items,
      totals: {
        subtotal: subtotal,
        discount: 0,
        shipping: shipping,
        fee: 0,
        total: subtotal + shipping,
        coupon: ""
      }
    };
    const result = NK.appendOrder(order);
    if (!result.ok) {
      NK.toast("Demo naročila ni bilo mogoče dodati.", "info");
      return;
    }
    renderOrders();
    NK.toast("Dodano demo naročilo.", "success");
  }

  function bindOrders() {
    const host = $("#admin-orders");
    if (!host) return;
    const refresh = host.querySelector("[data-order-refresh]");
    if (refresh) refresh.addEventListener("click", renderOrders);
    const demo = host.querySelector("[data-order-demo]");
    if (demo) demo.addEventListener("click", addDemoOrder);
    host.querySelectorAll("[data-order-approve]").forEach((button) => {
      button.addEventListener("click", () =>
        changeOrderStatus(button.getAttribute("data-order-approve"), "approved")
      );
    });
    host.querySelectorAll("[data-order-ship]").forEach((button) => {
      button.addEventListener("click", () =>
        changeOrderStatus(button.getAttribute("data-order-ship"), "shipped")
      );
    });
    host.querySelectorAll("[data-order-reset]").forEach((button) => {
      button.addEventListener("click", () =>
        changeOrderStatus(button.getAttribute("data-order-reset"), "new")
      );
    });
  }

  function bindTabs() {
    $$("[data-admin-tab]").forEach((button) => {
      button.addEventListener("click", () => setAdminTab(button.getAttribute("data-admin-tab")));
    });
    setAdminTab(activeTab);
  }

  function setAdminTab(name) {
    activeTab = name || "overview";
    $$("[data-admin-tab]").forEach((button) => {
      const active = button.getAttribute("data-admin-tab") === activeTab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    $$("[data-admin-view]").forEach((view) => {
      view.hidden = view.getAttribute("data-admin-view") !== activeTab;
    });
    if (activeTab === "overview") {
      renderDashboard();
    } else if (activeTab === "orders") {
      renderOrders();
    }
  }

  /* -------------------------------------------------------------- Stripe */
  function stripeStatus(settings) {
    if (settings.enabled && NK.isValidStripeLink(settings.paymentLink)) {
      return { label: "Povezano", className: "is-on" };
    }
    if (settings.enabled) return { label: "Neveljavna povezava", className: "is-warn" };
    return { label: "Ni povezano", className: "is-off" };
  }

  function stripePanelHtml() {
    const settings = NK.getStripeSettings();
    const status = stripeStatus(settings);
    const openHidden = NK.isValidStripeLink(settings.paymentLink) ? "" : " hidden";
    return (
      '<div class="admin-layout admin-layout--payments">' +
      '<section class="admin-card">' +
      '<div class="admin-card__head"><div><h2>Stripe plačila</h2><p>Povežite Payment Link in na blagajni omogočite plačilo s kartico.</p></div>' +
      '<span class="admin-status ' +
      status.className +
      '" id="stripe-status">' +
      status.label +
      "</span></div>" +
      '<form id="stripe-form" class="admin-form" novalidate>' +
      '<label class="admin-toggle"><input id="stripe-enabled" name="enabled" type="checkbox"' +
      (settings.enabled ? " checked" : "") +
      '><span class="admin-toggle__track" aria-hidden="true"></span><span class="admin-toggle__text"><strong>Omogoči Stripe plačilo</strong><small>Na blagajni se prikaže dodatna možnost plačila s kartico.</small></span></label>' +
      '<div class="field"><label for="stripe-link">Stripe Payment Link</label>' +
      '<input id="stripe-link" name="paymentLink" type="url" value="' +
      NK.escapeHtml(settings.paymentLink) +
      '" placeholder="https://buy.stripe.com/..." autocomplete="off">' +
      '<p class="admin-field-hint">Povezavo ustvarite v Stripe nadzorni plošči pod <strong>Payment Links</strong>.</p></div>' +
      '<div class="field"><label for="stripe-key">Publishable key <span>(neobvezno)</span></label>' +
      '<input id="stripe-key" name="publishableKey" type="text" value="' +
      NK.escapeHtml(settings.publishableKey) +
      '" placeholder="pk_test_..." autocomplete="off">' +
      '<p class="admin-field-hint">Za Payment Link ni potreben. Nikoli ne vnašajte skrivnega ključa <code>sk_...</code>.</p></div>' +
      '<p class="admin-error" id="stripe-error" role="alert"></p>' +
      '<div class="admin-form__actions">' +
      '<button class="btn btn--primary" type="submit">Shrani nastavitve</button>' +
      '<a class="btn btn--soft" id="stripe-open" href="' +
      NK.escapeHtml(settings.paymentLink) +
      '" target="_blank" rel="noopener"' +
      openHidden +
      ">Odpri Payment Link</a></div></form></section>" +
      '<aside class="admin-card admin-stripe-help">' +
      '<div class="admin-card__head"><div><h2>Kako povezati</h2><p>Trije koraki brez strežnika.</p></div></div>' +
      '<ol class="admin-steps">' +
      '<li><span>1</span><div><strong>Ustvarite Stripe račun</strong><p>Prijavite se v Stripe in odprite razdelek Payment Links.</p></div></li>' +
      '<li><span>2</span><div><strong>Ustvarite plačilno povezavo</strong><p>Dodajte izdelek ali znesek ter kopirajte javno povezavo, ki se začne z <code>https://buy.stripe.com/</code>.</p></div></li>' +
      '<li><span>3</span><div><strong>Prilepite in omogočite</strong><p>Povezavo prilepite levo, vklopite stikalo in shranite. Na blagajni se prikaže Stripe.</p></div></li>' +
      "</ol>" +
      '<div class="admin-note admin-note--warn"><strong>Demo omejitev:</strong> stran je statična. Payment Link ima vnaprej določen znesek, zato se vrednost košarice ne prenese samodejno. Naročilo se najprej shrani lokalno, nato sledi preusmeritev na Stripe. Nikoli ne shranjujte skrivnih ključev v brskalnik.</div>' +
      "</aside></div>"
    );
  }

  function showStripeError(message) {
    const error = $("#stripe-error");
    if (!error) return;
    error.textContent = message || "";
    error.classList.toggle("is-visible", Boolean(message));
  }

  function syncStripeStatus() {
    const settings = NK.getStripeSettings();
    const status = stripeStatus(settings);
    const badge = $("#stripe-status");
    if (badge) {
      badge.textContent = status.label;
      badge.className = "admin-status " + status.className;
    }
    const open = $("#stripe-open");
    if (open) {
      if (NK.isValidStripeLink(settings.paymentLink)) {
        open.href = settings.paymentLink;
        open.hidden = false;
      } else {
        open.hidden = true;
      }
    }
  }

  function bindStripeForm() {
    const form = $("#stripe-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showStripeError("");
      const result = NK.saveStripeSettings({
        enabled: form.elements.enabled.checked,
        paymentLink: form.elements.paymentLink.value,
        publishableKey: form.elements.publishableKey.value
      });
      if (!result.ok) {
        showStripeError(result.message);
        return;
      }
      syncStripeStatus();
      NK.toast(
        result.settings.enabled
          ? "Stripe je povezan. Možnost plačila je dodana na blagajno."
          : "Stripe nastavitve so shranjene.",
        "success"
      );
    });

    const link = $("#stripe-link");
    if (link) {
      link.addEventListener("input", () => {
        const open = $("#stripe-open");
        if (!open) return;
        if (NK.isValidStripeLink(link.value)) {
          open.href = link.value.trim();
          open.hidden = false;
        } else {
          open.hidden = true;
        }
      });
    }
  }

  function bindListActions(host) {
    host.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => startEdit(button.getAttribute("data-edit")));
    });
    host.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => removeProduct(button.getAttribute("data-delete")));
    });
  }

  function renderList() {
    const host = $("#admin-list");
    if (!host) return;
    const items = adminCatalog();

    if (!items.length) {
      host.innerHTML =
        '<div class="admin-empty">V trgovini ni izdelkov. Vrnite odstranjene izdelke spodaj ali dodajte novega.</div>';
      return;
    }

    host.innerHTML = items.map((product) => adminItem(product, false)).join("");
    bindListActions(host);
  }

  function renderHidden() {
    const host = $("#admin-hidden-wrap");
    if (!host) return;
    const items = NK.getHiddenProducts();

    if (!items.length) {
      host.innerHTML = "";
      return;
    }

    host.innerHTML =
      '<div class="admin-hidden">' +
      '<div class="admin-card__head"><div><h3>Odstranjeni izdelki</h3><p>Vrnite jih v trgovino, ko jih spet želite prikazati.</p></div>' +
      '<span class="admin-count">' + items.length + "</span></div>" +
      '<div class="admin-list">' + items.map((product) => adminItem(product, true)).join("") + "</div></div>";

    host.querySelectorAll("[data-restore]").forEach((button) => {
      button.addEventListener("click", () => restoreHiddenProduct(button.getAttribute("data-restore")));
    });
  }

  function refreshLists() {
    renderList();
    renderHidden();
    const count = $("#admin-count");
    if (count) count.textContent = adminCatalog().length;
  }

  function bindSearch() {
    const input = $("#admin-search");
    if (!input) return;
    input.addEventListener("input", () => {
      const query = NK.norm(input.value);
      const host = $("#admin-list");
      if (!host) return;
      host.querySelectorAll(".admin-item").forEach((item) => {
        item.hidden = Boolean(query) && !NK.norm(item.textContent).includes(query);
      });
    });
  }

  function updatePreview() {
    const form = $("#admin-form");
    const host = $("#admin-preview");
    if (!form || !host) return;
    const category = form.elements.category.value;
    const art = form.elements.art.value || NK.categoryArt(category);
    const name = form.elements.name.value.trim() || "Predogled izdelka";
    host.innerHTML = ART.product(art, NK.customPalette(category), name);
  }

  function bindForm() {
    const form = $("#admin-form");
    if (!form) return;

    form.elements.category.addEventListener("change", () => {
      form.elements.art.value = NK.categoryArt(form.elements.category.value);
      updatePreview();
    });
    form.addEventListener("input", updatePreview);
    form.addEventListener("change", updatePreview);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showFormError("");
      const result = NK.saveCustomProduct({
        id: editingId || undefined,
        name: form.elements.name.value,
        category: form.elements.category.value,
        price: form.elements.price.value,
        oldPrice: form.elements.oldPrice.value,
        brand: form.elements.brand.value,
        art: form.elements.art.value,
        colorName: form.elements.colorName.value,
        colorHex: form.elements.colorHex.value,
        description: form.elements.description.value
      });

      if (!result.ok) {
        showFormError(result.message);
        return;
      }

      activeTab = "products";
      NK.toast(result.updated ? "Izdelek je posodobljen." : "Izdelek je dodan v trgovino.", "success");
      renderPanel();
    });

    const cancel = $("#admin-cancel");
    if (cancel) cancel.addEventListener("click", resetForm);

    updatePreview();
  }

  function resetForm() {
    editingId = "";
    const form = $("#admin-form");
    if (!form) return;
    form.reset();
    form.elements.colorHex.value = "#0f766e";
    form.elements.art.value = NK.categoryArt(form.elements.category.value);
    const title = $("#admin-form-title");
    if (title) title.textContent = "Dodaj izdelek";
    const submit = $("#admin-submit");
    if (submit) submit.textContent = "Dodaj izdelek";
    const cancel = $("#admin-cancel");
    if (cancel) cancel.hidden = true;
    showFormError("");
    updatePreview();
  }

  function startEdit(id) {
    const product = NK.getCustomProducts().find((item) => item.id === id);
    const form = $("#admin-form");
    if (!product || !form) return;

    activeTab = "products";
    setAdminTab("products");
    editingId = product.id;
    form.elements.name.value = product.name;
    form.elements.category.value = product.category;
    form.elements.price.value = product.price;
    form.elements.oldPrice.value = product.oldPrice || "";
    form.elements.brand.value = product.brand === "Nakupko" ? "" : product.brand;
    form.elements.art.value = product.art || NK.categoryArt(product.category);
    const color = product.colors && product.colors[0];
    form.elements.colorName.value = color ? color.name : "";
    form.elements.colorHex.value = color ? color.hex : "#0f766e";
    form.elements.description.value = product.description || "";

    const title = $("#admin-form-title");
    if (title) title.textContent = "Uredi izdelek";
    const submit = $("#admin-submit");
    if (submit) submit.textContent = "Shrani spremembe";
    const cancel = $("#admin-cancel");
    if (cancel) cancel.hidden = false;

    showFormError("");
    updatePreview();
    const card = $(".admin-form-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeProduct(id) {
    const product =
      NK.getProduct(id) || NK.getHiddenProducts().find((item) => item.id === id);
    if (!product) return;

    const isCustom = product.custom === true;
    const message = isCustom
      ? 'Izbrišem izdelek "' + product.name + '"? Tega dejanja ni mogoče razveljaviti.'
      : 'Odstranim izdelek "' + product.name + '" iz trgovine? Pozneje ga lahko vrnete.';
    if (!window.confirm(message)) return;

    const done = isCustom ? NK.deleteCustomProduct(id) : NK.hideProduct(id);
    if (!done) return;

    NK.toast(
      isCustom
        ? "Izdelek je izbrisan."
        : "Izdelek je odstranjen iz trgovine. Vrnete ga lahko spodaj.",
      "success"
    );

    if (editingId === id) {
      renderPanel();
      return;
    }
    refreshLists();
  }

  function restoreHiddenProduct(id) {
    if (!NK.restoreProduct(id)) return;
    NK.toast("Izdelek je vrnjen v trgovino.", "success");
    refreshLists();
  }

  function boot() {
    NK.initGlobal();
    if (isLoggedIn()) renderPanel();
    else renderLogin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
