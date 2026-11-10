/* Nakupko demo admin: client-side product editor.
   The password gate is cosmetic: this is a static site and everything runs
   in the browser. Custom products live in localStorage only. */
(function () {
  const NK = window.NK;
  const ART = window.NKArt;
  const $ = (selector, root) => (root || document).querySelector(selector);

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

  function renderPanel() {
    editingId = "";
    const items = adminCatalog();
    const defaultCategory = NK.categories[0] ? NK.categories[0].slug : "";

    root.innerHTML =
      '<div class="admin-top">' +
      '<p class="admin-note">Osnovne izdelke lahko odstranite in jih pozneje vrnete, svoje pa trajno izbrišete. Novi izdelki so shranjeni v <code>localStorage</code> tega brskalnika.</p>' +
      '<div class="admin-top__actions">' +
      '<a class="btn btn--soft" href="index.html">Odpri trgovino</a>' +
      '<button class="btn btn--ghost" type="button" id="admin-logout">Odjava</button>' +
      "</div></div>" +
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
      "</section></div>";

    renderList();
    renderHidden();
    bindSearch();
    bindForm();

    const logout = $("#admin-logout");
    if (logout) {
      logout.addEventListener("click", () => {
        setLoggedIn(false);
        renderLogin();
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
