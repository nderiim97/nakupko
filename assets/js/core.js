/* Nakupko storefront core: state, cart, wishlist, shared UI. */
(function () {
  const NK = (window.NK = window.NK || {});
  const ART = window.NKArt;
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const KEYS = {
    cart: "nakupko.cart.v1",
    wishlist: "nakupko.wishlist.v1",
    coupon: "nakupko.coupon.v1",
    recent: "nakupko.recent.v1",
    orders: "nakupko.orders.v1",
    lastOrder: "nakupko.last-order.v1"
  };

  const moneyFormatter = new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR"
  });
  const dateFormatter = new Intl.DateTimeFormat("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* Private mode or file:// restrictions: the demo still works in memory. */
    }
  }

  function money(value) {
    return moneyFormatter.format(Number(value) || 0);
  }

  function longDate(value) {
    const date = value ? new Date(value) : new Date();
    return dateFormatter.format(date);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function norm(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Light stemming for Slovenian inflections: kava/kavo, stroj/stroji. */
  function forms(token) {
    const list = [token];
    if (token.length >= 4) {
      if (token.length >= 5 && /(ih|ah|om|em|ov|ev|je|ja|ju)$/.test(token)) {
        list.push(token.slice(0, -2));
      }
      if (/[aeiou]$/.test(token)) list.push(token.slice(0, -1));
    }
    return list;
  }

  const products = Array.isArray(NK.products) ? NK.products : [];
  const categories = Array.isArray(NK.categories) ? NK.categories : [];
  const byId = new Map(products.map((product) => [product.id, product]));

  const state = {
    cart: read(KEYS.cart, []).filter((item) => item && byId.has(item.id)),
    wishlist: read(KEYS.wishlist, []).filter((id) => byId.has(id)),
    coupon: read(KEYS.coupon, ""),
    recent: read(KEYS.recent, []).filter((id) => byId.has(id))
  };

  function saveCart() {
    write(KEYS.cart, state.cart);
    updateBadges();
    renderCartDrawer();
    document.dispatchEvent(new CustomEvent("nk:cart-change"));
  }

  function saveWishlist() {
    write(KEYS.wishlist, state.wishlist);
    updateBadges();
    document.dispatchEvent(new CustomEvent("nk:wishlist-change"));
  }

  function getProduct(id) {
    return byId.get(id) || null;
  }

  function categoryBySlug(slug) {
    return categories.find((category) => category.slug === slug) || null;
  }

  function productUrl(product) {
    return "product.html?id=" + encodeURIComponent(product.id);
  }

  function categoryUrl(slug) {
    return "category.html?cat=" + encodeURIComponent(slug);
  }

  function matchesAny(text, list) {
    return list.some((form) => form && text.includes(form));
  }

  function searchProducts(query) {
    const q = norm(query);
    if (!q) return [];
    const tokens = q.split(" ").filter(Boolean);
    const scored = [];

    products.forEach((product) => {
      const category = categoryBySlug(product.category);
      const name = norm(product.name);
      const brand = norm(product.brand);
      const cat = norm(category ? category.name : "");
      const description = norm(product.description);
      const sku = norm(product.sku);
      const tagText = (product.tags || []).map(norm).join(" ");
      let score = 0;

      if (name.includes(q)) score += 14;
      if (brand.includes(q)) score += 6;
      if (cat.includes(q)) score += 5;
      if (sku.includes(q)) score += 4;

      tokens.forEach((token) => {
        const tokenForms = forms(token);
        if (matchesAny(name, tokenForms)) score += 4;
        if (matchesAny(brand, tokenForms)) score += 2;
        if (matchesAny(cat, tokenForms)) score += 2;
        if (matchesAny(description, tokenForms)) score += 1;
        if (matchesAny(tagText, tokenForms)) score += 1;
      });

      if (score > 0) scored.push({ product, score });
    });

    return scored
      .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
      .map((entry) => entry.product);
  }

  function stars(rating, reviews) {
    const rounded = Math.round(Number(rating) || 0);
    let html = '<span class="rating" aria-label="Ocena ' + String(rating).replace(".", ",") + ' od 5">';
    html += '<span class="rating__stars" aria-hidden="true">';
    for (let index = 1; index <= 5; index += 1) {
      html += '<span class="rating__star ' + (index <= rounded ? "is-on" : "is-off") + '">' + ART.icon("star", 15) + "</span>";
    }
    html += "</span>";
    html += '<span class="rating__value">' + String(rating).replace(".", ",") + "</span>";
    if (reviews != null) html += '<span class="rating__count">(' + reviews + ")</span>";
    html += "</span>";
    return html;
  }

  function badgeFor(product) {
    if (product.badge) return product.badge;
    if (product.oldPrice) return "Akcija";
    if ((product.tags || []).includes("new")) return "Novo";
    return "";
  }

  function productCard(product, options) {
    const opts = options || {};
    const badge = badgeFor(product);
    const wished = state.wishlist.includes(product.id);
    const badgeClass = badge === "Akcija" ? "badge--sale" : badge === "Novo" ? "badge--new" : "badge--soft";
    let html = '<article class="product-card' + (opts.className ? " " + opts.className : "") + '">';
    html += '<div class="product-card__media">';
    if (badge) html += '<span class="badge ' + badgeClass + '">' + escapeHtml(badge) + "</span>";
    html +=
      '<button class="wish-btn' +
      (wished ? " is-active" : "") +
      '" type="button" data-wishlist="' +
      product.id +
      '" aria-label="' +
      (wished ? "Odstrani s seznama želja" : "Dodaj na seznam želja") +
      '" aria-pressed="' +
      (wished ? "true" : "false") +
      '">' +
      ART.icon("heart", 19) +
      "</button>";
    html +=
      '<a class="product-card__art" href="' +
      productUrl(product) +
      '" aria-label="' +
      escapeHtml(product.name) +
      '">' +
      ART.product(product.art, product.palette, product.name) +
      "</a>";
    html += "</div>";
    html += '<div class="product-card__body">';
    html += '<p class="product-card__brand">' + escapeHtml(product.brand) + "</p>";
    html +=
      '<h3 class="product-card__title"><a href="' + productUrl(product) + '">' + escapeHtml(product.name) + "</a></h3>";
    html += stars(product.rating, product.reviews);
    html += '<div class="product-card__price">';
    html += "<strong>" + money(product.price) + "</strong>";
    if (product.oldPrice) html += "<s>" + money(product.oldPrice) + "</s>";
    html += "</div>";
    html +=
      '<button class="btn btn--soft btn--block product-card__add" type="button" data-add="' +
      product.id +
      '">' +
      ART.icon("cart", 18) +
      "Dodaj v košarico</button>";
    html += "</div></article>";
    return html;
  }

  function cartKey(id, color) {
    return id + "::" + (color || "");
  }

  function addToCart(id, qty, color) {
    const product = getProduct(id);
    if (!product) return;
    const amount = Math.max(1, Math.min(99, Number(qty) || 1));
    const chosen = color || (product.colors && product.colors[0] ? product.colors[0].name : "");
    const key = cartKey(id, chosen);
    const existing = state.cart.find((item) => item.key === key);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + amount);
    } else {
      state.cart.push({ key: key, id: id, qty: amount, color: chosen });
    }
    saveCart();
    toast(product.name + " je v košarici.", "success");
    openDrawer($("#cart-drawer"));
  }

  function setCartQty(key, qty) {
    const item = state.cart.find((entry) => entry.key === key);
    if (!item) return;
    const next = Math.max(0, Math.min(99, Number(qty) || 0));
    if (next === 0) {
      state.cart = state.cart.filter((entry) => entry.key !== key);
    } else {
      item.qty = next;
    }
    saveCart();
  }

  function removeCartItem(key) {
    state.cart = state.cart.filter((item) => item.key !== key);
    saveCart();
  }

  function cartItems() {
    return state.cart
      .map((item) => {
        const product = getProduct(item.id);
        if (!product) return null;
        return {
          key: item.key,
          id: item.id,
          qty: item.qty,
          color: item.color,
          product: product,
          lineTotal: product.price * item.qty
        };
      })
      .filter(Boolean);
  }

  function cartCount() {
    return state.cart.reduce((total, item) => total + Number(item.qty || 0), 0);
  }

  function cartSubtotal() {
    return cartItems().reduce((total, item) => total + item.lineTotal, 0);
  }

  function couponInfo() {
    const code = String(state.coupon || "").toUpperCase();
    if (!code) return null;
    const info = (NK.coupons || {})[code];
    if (!info) return null;
    return { code: code, info: info };
  }

  function cartTotals(options) {
    const opts = options || {};
    const subtotal = cartSubtotal();
    const coupon = couponInfo();
    let discount = 0;
    if (coupon) {
      discount =
        coupon.info.type === "percent"
          ? (subtotal * coupon.info.value) / 100
          : Math.min(coupon.info.value, subtotal);
    }
    const delivery = opts.delivery || "standard";
    let shipping = 0;
    if (delivery === "express") shipping = 6.99;
    else if (delivery === "pickup") shipping = 0;
    else shipping = subtotal >= 50 || subtotal === 0 ? 0 : 3.99;
    const payment = opts.payment || "card";
    const fee = payment === "cod" ? 1.5 : 0;
    const total = Math.max(0, subtotal - discount + shipping + fee);
    return {
      subtotal: subtotal,
      discount: discount,
      shipping: shipping,
      fee: fee,
      total: total,
      freeShippingRemaining: Math.max(0, 50 - subtotal),
      coupon: coupon
    };
  }

  function applyCoupon(code) {
    const clean = String(code || "").trim().toUpperCase();
    const info = (NK.coupons || {})[clean];
    if (!info) {
      return { ok: false, message: "Koda ni veljavna. Poskusite NAKUP10." };
    }
    state.coupon = clean;
    write(KEYS.coupon, state.coupon);
    document.dispatchEvent(new CustomEvent("nk:cart-change"));
    return { ok: true, message: "Koda je uporabljena: " + info.label + "." };
  }

  function clearCoupon() {
    state.coupon = "";
    write(KEYS.coupon, "");
    document.dispatchEvent(new CustomEvent("nk:cart-change"));
  }

  function isWishlisted(id) {
    return state.wishlist.includes(id);
  }

  function toggleWishlist(id) {
    const product = getProduct(id);
    if (!product) return;
    if (state.wishlist.includes(id)) {
      state.wishlist = state.wishlist.filter((entry) => entry !== id);
      toast("Odstranjeno s seznama želja.", "info");
    } else {
      state.wishlist.push(id);
      toast("Dodano na seznam želja.", "success");
    }
    saveWishlist();
  }

  function addRecent(id) {
    if (!getProduct(id)) return;
    state.recent = [id].concat(state.recent.filter((entry) => entry !== id)).slice(0, 8);
    write(KEYS.recent, state.recent);
  }

  function recentProducts(limit) {
    return state.recent
      .map((id) => getProduct(id))
      .filter(Boolean)
      .slice(0, limit || 4);
  }

  function updateBadges() {
    const count = cartCount();
    const wished = state.wishlist.length;
    $$("[data-cart-count]").forEach((node) => {
      node.textContent = count;
      node.classList.toggle("is-empty", count === 0);
    });
    $$("[data-wishlist-count]").forEach((node) => {
      node.textContent = wished;
      node.classList.toggle("is-empty", wished === 0);
    });
  }

  function toast(message, type) {
    let stack = $("#nk-toasts");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "nk-toasts";
      stack.className = "toasts";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const node = document.createElement("div");
    node.className = "toast toast--" + (type || "info");
    node.innerHTML = '<span class="toast__dot" aria-hidden="true"></span><span></span>';
    node.lastElementChild.textContent = message;
    stack.appendChild(node);
    window.setTimeout(() => {
      node.classList.add("is-leaving");
      window.setTimeout(() => node.remove(), 250);
    }, 3600);
  }

  function brandMark() {
    return (
      '<span class="brand__mark" aria-hidden="true">' +
      '<svg viewBox="0 0 48 48" focusable="false">' +
      '<rect width="48" height="48" rx="14" fill="currentColor"/>' +
      '<path d="M14 18h20l-2.2 18H16.2Z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M19 18a5 5 0 0 1 10 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M19 26h10" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' +
      "</svg></span>"
    );
  }

  function brandBlock() {
    return (
      '<a class="brand" href="index.html" aria-label="Nakupko – domov">' +
      brandMark() +
      '<span class="brand__text"><strong>Nakupko</strong><small>dobro izbrano</small></span>' +
      "</a>"
    );
  }

  function renderHeader() {
    const host = $("#site-header");
    if (!host) return;

    const navCats = categories.slice(0, 6);
    let navHtml = "";
    navCats.forEach((category) => {
      navHtml += '<li><a href="' + categoryUrl(category.slug) + '">' + escapeHtml(category.name) + "</a></li>";
    });

    let megaCats = "";
    categories.forEach((category) => {
      const count = products.filter((product) => product.category === category.slug).length;
      megaCats +=
        '<li><a href="' +
        categoryUrl(category.slug) +
        '"><span class="mega__icon" style="--tint:' +
        category.tint +
        '">' +
        ART.icon(category.icon, 22) +
        '</span><span><strong>' +
        escapeHtml(category.name) +
        "</strong><small>" +
        count +
        " izdelkov</small></span></a></li>";
    });

    host.innerHTML =
      '<div class="topbar"><div class="container topbar__inner">' +
      '<p class="topbar__note">' +
      ART.icon("truck", 17) +
      " Brezplačna dostava nad 50 € · Vračilo v 30 dneh</p>" +
      '<div class="topbar__links">' +
      '<a href="info.html#dostava">Dostava</a>' +
      '<a href="info.html#vracila">Vračila</a>' +
      '<a href="info.html#kontakt">Pomoč</a>' +
      '<a class="topbar__phone" href="tel:+38612345678">' +
      ART.icon("phone", 15) +
      " +386 1 234 56 78</a>" +
      "</div></div></div>" +
      '<header class="site-header">' +
      '<div class="container header-main">' +
      '<button class="icon-btn header-menu" type="button" data-open-menu aria-label="Odpri meni" aria-controls="menu-drawer">' +
      ART.icon("menu", 24) +
      "</button>" +
      brandBlock() +
      '<form class="header-search" role="search" action="search.html" method="get" autocomplete="off">' +
      '<label class="sr-only" for="site-search">Iskanje</label>' +
      '<span class="header-search__icon" aria-hidden="true">' +
      ART.icon("search", 20) +
      "</span>" +
      '<input id="site-search" name="q" type="search" placeholder="Poišči izdelek, znamko ali kategorijo" autocomplete="off" aria-autocomplete="list" aria-controls="search-suggest">' +
      '<button class="btn btn--primary header-search__submit" type="submit">Iskanje</button>' +
      '<div class="search-suggest" id="search-suggest" hidden></div>' +
      "</form>" +
      '<div class="header-actions">' +
      '<a class="header-action" href="wishlist.html">' +
      ART.icon("heart", 22) +
      '<span class="header-action__label">Seznam želja</span>' +
      '<span class="count is-empty" data-wishlist-count>0</span></a>' +
      '<button class="header-action" type="button" data-open-cart>' +
      ART.icon("cart", 22) +
      '<span class="header-action__label">Košarica</span>' +
      '<span class="count is-empty" data-cart-count>0</span></button>' +
      "</div></div>" +
      '<nav class="main-nav" aria-label="Glavna navigacija">' +
      '<div class="container nav-inner">' +
      '<button class="nav-all" type="button" data-toggle-mega aria-expanded="false" aria-controls="mega-menu">' +
      ART.icon("menu", 19) +
      "<span>Vse kategorije</span>" +
      ART.icon("chevron-down", 17) +
      "</button>" +
      '<ul class="nav-list">' +
      navHtml +
      "</ul>" +
      '<a class="nav-deal" href="category.html?sale=1">Akcije</a>' +
      '<a class="nav-new" href="category.html?new=1">Novo</a>' +
      "</div>" +
      '<div class="mega" id="mega-menu" hidden>' +
      '<div class="container mega__inner">' +
      '<div class="mega__cats"><p class="eyebrow">Nakupujte po kategorijah</p><ul>' +
      megaCats +
      "</ul></div>" +
      '<div class="mega__promo">' +
      '<span class="badge badge--soft">Jesen 2026</span>' +
      "<h3>Dom, ki diha z vami.</h3>" +
      "<p>Mehka svetloba, naravni materiali in mirni odtenki za počasnejše dneve.</p>" +
      '<a class="btn btn--primary" href="category.html?cat=dom">Razišči dom ' +
      ART.icon("arrow-right", 17) +
      "</a>" +
      '<div class="mega__promo-art">' +
      ART.product("lamp", ["#e6f6ef", "#0f766e", "#123c36"], "Namizna svetilka") +
      "</div></div></div></div>" +
      "</nav></header>";
  }

  function renderFooter() {
    const host = $("#site-footer");
    if (!host) return;
    host.innerHTML =
      '<footer class="site-footer">' +
      '<div class="footer-news"><div class="container footer-news__inner">' +
      '<div><p class="eyebrow">Nakupko novice</p><h2>Majhen navdih, vsak teden.</h2>' +
      "<p>Posebne ponudbe, sezonske ideje in nasveti za dom — brez vsakodnevnega e-poštnega hrupa.</p></div>" +
      '<form class="newsletter" data-newsletter novalidate>' +
      '<label class="sr-only" for="newsletter-email">E-poštni naslov</label>' +
      '<input id="newsletter-email" name="email" type="email" placeholder="Vaš e-poštni naslov" required>' +
      '<button class="btn btn--primary" type="submit">Prijava</button>' +
      '<p class="newsletter__note" data-newsletter-note role="status"></p>' +
      "</form></div></div>" +
      '<div class="container footer-grid">' +
      '<div class="footer-brand">' +
      brandBlock() +
      "<p>Preprosto nakupovanje za dom, delo in prosti čas. Izbrano z mislijo na vsakdan.</p>" +
      '<div class="footer-social"><a href="info.html#kontakt">Facebook</a><a href="info.html#kontakt">Instagram</a><a href="info.html#kontakt">YouTube</a></div>' +
      "</div>" +
      '<div class="footer-col"><h3>Pomoč</h3><ul>' +
      '<li><a href="info.html#dostava">Dostava</a></li>' +
      '<li><a href="info.html#vracila">Vračila in reklamacije</a></li>' +
      '<li><a href="info.html#placilo">Načini plačila</a></li>' +
      '<li><a href="info.html#faq">Pogosta vprašanja</a></li>' +
      '<li><a href="info.html#kontakt">Kontakt</a></li></ul></div>' +
      '<div class="footer-col"><h3>Nakupovanje</h3><ul>' +
      '<li><a href="category.html">Vsi izdelki</a></li>' +
      '<li><a href="category.html?sale=1">Akcije</a></li>' +
      '<li><a href="category.html?new=1">Novo v ponudbi</a></li>' +
      '<li><a href="wishlist.html">Seznam želja</a></li>' +
      '<li><a href="cart.html">Košarica</a></li></ul></div>' +
      '<div class="footer-col"><h3>Kontakt</h3><ul class="footer-contact">' +
      '<li>' + ART.icon("pin", 17) + " Tržaška cesta 12, 1000 Ljubljana</li>" +
      '<li>' + ART.icon("phone", 17) + ' <a href="tel:+38612345678">+386 1 234 56 78</a></li>' +
      '<li>' + ART.icon("mail", 17) + ' <a href="mailto:pozdrav@nakupko.si">pozdrav@nakupko.si</a></li>' +
      '<li>' + ART.icon("lock", 17) + " Pon–pet: 8–18, sob: 9–13</li></ul></div>" +
      "</div>" +
      '<div class="container footer-bottom">' +
      '<p>© 2026 Nakupko d.o.o. Vse pravice pridržane.</p>' +
      '<p class="footer-demo">Demo trgovina — vsi izdelki, cene in podatki so izmišljeni.</p>' +
      '<div class="pay-badges" aria-label="Načini plačila">' +
      "<span>Visa</span><span>Mastercard</span><span>Maestro</span><span>Po povzetju</span><span>Bančno nakazilo</span>" +
      "</div></div>" +
      "</footer>";
  }

  function renderOverlays() {
    if ($("#cart-drawer")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML =
      '<div class="scrim" data-close-drawers hidden></div>' +
      '<aside class="drawer drawer--cart" id="cart-drawer" aria-hidden="true" aria-labelledby="cart-drawer-title">' +
      '<header class="drawer__head"><div><p class="eyebrow">Vaš izbor</p><h2 id="cart-drawer-title">Košarica</h2></div>' +
      '<button class="icon-btn" type="button" data-close-drawers aria-label="Zapri košarico">' +
      ART.icon("close", 22) +
      "</button></header>" +
      '<div class="drawer__body" data-cart-drawer-body></div>' +
      '<footer class="drawer__foot" data-cart-drawer-foot></footer>' +
      "</aside>" +
      '<aside class="drawer drawer--menu" id="menu-drawer" aria-hidden="true" aria-labelledby="menu-drawer-title">' +
      '<header class="drawer__head"><div><p class="eyebrow">Nakupko</p><h2 id="menu-drawer-title">Meni</h2></div>' +
      '<button class="icon-btn" type="button" data-close-drawers aria-label="Zapri meni">' +
      ART.icon("close", 22) +
      "</button></header>" +
      '<div class="drawer__body drawer__body--menu" data-menu-drawer-body></div>' +
      "</aside>" +
      '<div id="nk-toasts" class="toasts" aria-live="polite"></div>';
    document.body.appendChild(wrapper);
    renderMenuDrawer();
  }

  function renderMenuDrawer() {
    const body = $("[data-menu-drawer-body]");
    if (!body) return;
    let cats = "";
    categories.forEach((category) => {
      cats +=
        '<li><a href="' +
        categoryUrl(category.slug) +
        '"><span class="mega__icon" style="--tint:' +
        category.tint +
        '">' +
        ART.icon(category.icon, 20) +
        "</span>" +
        escapeHtml(category.name) +
        "</a></li>";
    });
    body.innerHTML =
      '<nav class="mobile-nav" aria-label="Mobilna navigacija">' +
      '<ul class="mobile-nav__primary">' +
      '<li><a href="index.html">Domov</a></li>' +
      '<li><a href="category.html">Vsi izdelki</a></li>' +
      '<li><a href="category.html?sale=1">Akcije</a></li>' +
      '<li><a href="category.html?new=1">Novo</a></li>' +
      '<li><a href="wishlist.html">Seznam želja</a></li>' +
      '<li><a href="cart.html">Košarica</a></li></ul>' +
      '<p class="eyebrow">Kategorije</p><ul class="mobile-nav__cats">' +
      cats +
      "</ul>" +
      '<p class="eyebrow">Pomoč</p><ul class="mobile-nav__primary">' +
      '<li><a href="info.html#dostava">Dostava</a></li>' +
      '<li><a href="info.html#vracila">Vračila</a></li>' +
      '<li><a href="info.html#faq">Pogosta vprašanja</a></li>' +
      '<li><a href="info.html#kontakt">Kontakt</a></li></ul>' +
      '<div class="mobile-nav__contact"><a class="btn btn--soft btn--block" href="tel:+38612345678">' +
      ART.icon("phone", 18) +
      " +386 1 234 56 78</a></div></nav>";
  }

  function miniCartLine(item) {
    return (
      '<li class="mini-cart__item">' +
      '<a class="mini-cart__art" href="' +
      productUrl(item.product) +
      '">' +
      ART.product(item.product.art, item.product.palette, item.product.name) +
      "</a>" +
      '<div class="mini-cart__info"><a class="mini-cart__name" href="' +
      productUrl(item.product) +
      '">' +
      escapeHtml(item.product.name) +
      "</a>" +
      (item.color ? '<p class="mini-cart__meta">' + escapeHtml(item.color) + "</p>" : "") +
      '<div class="qty qty--sm"><button type="button" data-cart-qty="' +
      item.key +
      '" data-delta="-1" aria-label="Zmanjšaj količino">' +
      ART.icon("minus", 14) +
      '</button><span aria-live="polite">' +
      item.qty +
      '</span><button type="button" data-cart-qty="' +
      item.key +
      '" data-delta="1" aria-label="Povečaj količino">' +
      ART.icon("plus", 14) +
      "</button></div></div>" +
      '<div class="mini-cart__price"><strong>' +
      money(item.lineTotal) +
      "</strong>" +
      '<button class="link-btn" type="button" data-remove-cart="' +
      item.key +
      '">Odstrani</button></div></li>'
    );
  }

  function renderCartDrawer() {
    const body = $("[data-cart-drawer-body]");
    const foot = $("[data-cart-drawer-foot]");
    if (!body || !foot) return;
    const items = cartItems();
    if (!items.length) {
      body.innerHTML =
        '<div class="drawer-empty">' +
        '<span class="drawer-empty__icon">' +
        ART.icon("cart", 34) +
        "</span>" +
        "<h3>Košarica je prazna</h3>" +
        "<p>Dodajte izdelek in se vrnite sem, ko boste pripravljeni.</p>" +
        '<a class="btn btn--primary" href="category.html" data-close-drawers>Začni nakupovati</a>' +
        "</div>";
      foot.innerHTML = "";
      return;
    }
    const totals = cartTotals();
    body.innerHTML =
      '<ul class="mini-cart">' +
      items.map(miniCartLine).join("") +
      "</ul>";
    foot.innerHTML =
      '<div class="shipping-meter' +
      (totals.freeShippingRemaining === 0 ? " is-complete" : "") +
      '">' +
      (totals.freeShippingRemaining === 0
        ? ART.icon("check", 16) + " Brezplačna dostava je zagotovljena."
        : ART.icon("truck", 16) + " Do brezplačne dostave še " + money(totals.freeShippingRemaining) + ".") +
      "</div>" +
      '<div class="summary-row"><span>Vmesni seštevek</span><strong>' +
      money(totals.subtotal) +
      "</strong></div>" +
      '<div class="drawer__actions"><a class="btn btn--soft" href="cart.html">Poglej košarico</a>' +
      '<a class="btn btn--primary" href="checkout.html">Na blagajno</a></div>';
  }

  let lastFocus = null;
  let openDrawerNode = null;

  function openDrawer(node) {
    if (!node) return;
    if (openDrawerNode && openDrawerNode !== node) closeDrawers(false);
    lastFocus = document.activeElement;
    openDrawerNode = node;
    node.classList.add("is-open");
    node.setAttribute("aria-hidden", "false");
    const scrim = $(".scrim");
    if (scrim) {
      scrim.hidden = false;
      window.requestAnimationFrame(() => scrim.classList.add("is-visible"));
    }
    document.body.classList.add("no-scroll");
    const focusTarget = node.querySelector("button, a, input, select, textarea");
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }

  function closeDrawers(restoreFocus) {
    $$(".drawer.is-open").forEach((node) => {
      node.classList.remove("is-open");
      node.setAttribute("aria-hidden", "true");
    });
    const scrim = $(".scrim");
    if (scrim) {
      scrim.classList.remove("is-visible");
      window.setTimeout(() => {
        if (!scrim.classList.contains("is-visible")) scrim.hidden = true;
      }, 220);
    }
    document.body.classList.remove("no-scroll");
    openDrawerNode = null;
    if (restoreFocus !== false && lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function toggleMega(force) {
    const panel = $("#mega-menu");
    const button = $("[data-toggle-mega]");
    if (!panel || !button) return;
    const next = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !next;
    button.setAttribute("aria-expanded", next ? "true" : "false");
    button.classList.toggle("is-open", next);
  }

  function renderSuggestions() {
    const input = $("#site-search");
    const panel = $("#search-suggest");
    if (!input || !panel) return;
    const query = input.value.trim();
    if (query.length < 2) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    const matches = searchProducts(query).slice(0, 5);
    if (!matches.length) {
      panel.innerHTML =
        '<p class="suggest__empty">Ni zadetkov za „' +
        escapeHtml(query) +
        '“.</p><a class="suggest__all" href="search.html?q=' +
        encodeURIComponent(query) +
        '">Poglej vse rezultate</a>';
      panel.hidden = false;
      return;
    }
    panel.innerHTML =
      '<ul class="suggest__list">' +
      matches
        .map(
          (product) =>
            '<li><a href="' +
            productUrl(product) +
            '"><span class="suggest__art">' +
            ART.product(product.art, product.palette, product.name) +
            '</span><span class="suggest__text"><strong>' +
            escapeHtml(product.name) +
            "</strong><small>" +
            escapeHtml(product.brand) +
            " · " +
            money(product.price) +
            "</small></span></a></li>"
        )
        .join("") +
      "</ul>" +
      '<a class="suggest__all" href="search.html?q=' +
      encodeURIComponent(query) +
      '">Vsi rezultati za „' +
      escapeHtml(query) +
      "“</a>";
    panel.hidden = false;
  }

  function bindGlobalEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target;

      const add = target.closest("[data-add]");
      if (add) {
        event.preventDefault();
        addToCart(add.getAttribute("data-add"), add.getAttribute("data-qty"), add.getAttribute("data-color"));
        return;
      }

      const wish = target.closest("[data-wishlist]");
      if (wish) {
        event.preventDefault();
        toggleWishlist(wish.getAttribute("data-wishlist"));
        return;
      }

      const qty = target.closest("[data-cart-qty]");
      if (qty) {
        event.preventDefault();
        const key = qty.getAttribute("data-cart-qty");
        const delta = Number(qty.getAttribute("data-delta")) || 0;
        const item = state.cart.find((entry) => entry.key === key);
        if (item) setCartQty(key, item.qty + delta);
        return;
      }

      const remove = target.closest("[data-remove-cart]");
      if (remove) {
        event.preventDefault();
        removeCartItem(remove.getAttribute("data-remove-cart"));
        return;
      }

      if (target.closest("[data-open-cart]")) {
        event.preventDefault();
        openDrawer($("#cart-drawer"));
        return;
      }

      if (target.closest("[data-open-menu]")) {
        event.preventDefault();
        openDrawer($("#menu-drawer"));
        return;
      }

      const closer = target.closest("[data-close-drawers]");
      if (closer) {
        /* Links may both close the drawer and navigate. */
        if (closer.tagName !== "A") event.preventDefault();
        closeDrawers(true);
        return;
      }

      const megaButton = target.closest("[data-toggle-mega]");
      if (megaButton) {
        event.preventDefault();
        toggleMega();
        return;
      }

      const mega = $("#mega-menu");
      const megaToggle = $("[data-toggle-mega]");
      if (mega && !mega.hidden && !mega.contains(target) && !(megaToggle && megaToggle.contains(target))) {
        toggleMega(false);
      }

      if (!target.closest(".header-search")) {
        const panel = $("#search-suggest");
        if (panel) panel.hidden = true;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawers(true);
        toggleMega(false);
        const panel = $("#search-suggest");
        if (panel) panel.hidden = true;
      }
    });

    const input = $("#site-search");
    if (input) {
      input.addEventListener("input", renderSuggestions);
      input.addEventListener("focus", renderSuggestions);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          const panel = $("#search-suggest");
          if (panel) panel.hidden = true;
        }
      });
    }

    const newsletter = $("[data-newsletter]");
    if (newsletter) {
      newsletter.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = newsletter.querySelector('input[type="email"]');
        const note = newsletter.querySelector("[data-newsletter-note]");
        const value = email ? email.value.trim() : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          if (note) note.textContent = "Vnesite veljaven e-poštni naslov.";
          if (email) email.setAttribute("aria-invalid", "true");
          return;
        }
        if (email) email.removeAttribute("aria-invalid");
        if (note) note.textContent = "Hvala! Prijava je zabeležena (demo).";
        newsletter.reset();
      });
    }
  }

  function initGlobal() {
    if (NK._initialized) return;
    NK._initialized = true;
    renderHeader();
    renderFooter();
    renderOverlays();
    renderCartDrawer();
    updateBadges();
    bindGlobalEvents();
    document.body.classList.add("js-ready");
  }

  function saveOrder(order) {
    const orders = read(KEYS.orders, []);
    orders.push(order);
    write(KEYS.orders, orders.slice(-20));
    write(KEYS.lastOrder, order);
    state.cart = [];
    state.coupon = "";
    write(KEYS.cart, state.cart);
    write(KEYS.coupon, state.coupon);
    updateBadges();
    renderCartDrawer();
  }

  function getLastOrder() {
    return read(KEYS.lastOrder, null);
  }

  Object.assign(NK, {
    money: money,
    longDate: longDate,
    escapeHtml: escapeHtml,
    norm: norm,
    getProduct: getProduct,
    categoryBySlug: categoryBySlug,
    productUrl: productUrl,
    categoryUrl: categoryUrl,
    searchProducts: searchProducts,
    stars: stars,
    productCard: productCard,
    addToCart: addToCart,
    setCartQty: setCartQty,
    removeCartItem: removeCartItem,
    cartItems: cartItems,
    cartCount: cartCount,
    cartSubtotal: cartSubtotal,
    cartTotals: cartTotals,
    applyCoupon: applyCoupon,
    clearCoupon: clearCoupon,
    couponInfo: couponInfo,
    isWishlisted: isWishlisted,
    toggleWishlist: toggleWishlist,
    addRecent: addRecent,
    recentProducts: recentProducts,
    toast: toast,
    openDrawer: openDrawer,
    closeDrawers: closeDrawers,
    saveOrder: saveOrder,
    getLastOrder: getLastOrder,
    initGlobal: initGlobal
  });
})();
