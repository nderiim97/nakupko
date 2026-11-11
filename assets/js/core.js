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
    lastOrder: "nakupko.last-order.v1",
    customProducts: "nakupko.custom-products.v1",
    hiddenProducts: "nakupko.hidden-products.v1",
    analytics: "nakupko.analytics.v1",
    analyticsVisitor: "nakupko.analytics.visitor.v1",
    stripe: "nakupko.stripe.v1",
    consent: "nakupko.cookie-consent.v1"
  };

  const ANALYTICS_LIMIT = 1200;

  const LIVE_MODE = window.NK_MODE === "live";
  const API_BASE = window.NK_API || "/api";
  document.documentElement.setAttribute("data-nk-mode", LIVE_MODE ? "live" : "demo");
  let resolveReady;
  const ready = LIVE_MODE
    ? new Promise((resolve) => {
        resolveReady = resolve;
      })
    : Promise.resolve();

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

  /* ------------------------------------------------------- local analytics
     Demo-only: events stay in this browser. No cookies, no network calls. */
  const COUNTRY_NAMES = {
    SI: "Slovenija",
    HR: "Hrvaška",
    RS: "Srbija",
    BA: "Bosna in Hercegovina",
    ME: "Črna gora",
    MK: "Severna Makedonija",
    AL: "Albanija",
    XK: "Kosovo",
    AT: "Avstrija",
    IT: "Italija",
    DE: "Nemčija",
    FR: "Francija",
    HU: "Madžarska",
    SK: "Slovaška",
    CZ: "Češka",
    PL: "Poljska",
    NL: "Nizozemska",
    BE: "Belgija",
    LU: "Luksemburg",
    ES: "Španija",
    PT: "Portugalska",
    GB: "Združeno kraljestvo",
    IE: "Irska",
    SE: "Švedska",
    NO: "Norveška",
    DK: "Danska",
    FI: "Finska",
    IS: "Islandija",
    CH: "Švica",
    GR: "Grčija",
    BG: "Bolgarija",
    RO: "Romunija",
    MD: "Moldavija",
    UA: "Ukrajina",
    RU: "Rusija",
    TR: "Turčija",
    US: "ZDA",
    CA: "Kanada",
    MX: "Mehika",
    BR: "Brazilija",
    AR: "Argentina",
    AU: "Avstralija",
    NZ: "Nova Zelandija",
    JP: "Japonska",
    KR: "Južna Koreja",
    CN: "Kitajska",
    IN: "Indija",
    SG: "Singapur",
    AE: "Združeni arabski emirati",
    IL: "Izrael",
    EG: "Egipt",
    ZA: "Južna Afrika"
  };

  const TIMEZONE_COUNTRIES = {
    "Europe/Ljubljana": "SI",
    "Europe/Zagreb": "HR",
    "Europe/Belgrade": "RS",
    "Europe/Sarajevo": "BA",
    "Europe/Podgorica": "ME",
    "Europe/Skopje": "MK",
    "Europe/Tirane": "AL",
    "Europe/Pristina": "XK",
    "Europe/Vienna": "AT",
    "Europe/Rome": "IT",
    "Europe/Berlin": "DE",
    "Europe/Paris": "FR",
    "Europe/Budapest": "HU",
    "Europe/Bratislava": "SK",
    "Europe/Prague": "CZ",
    "Europe/Warsaw": "PL",
    "Europe/Amsterdam": "NL",
    "Europe/Brussels": "BE",
    "Europe/Luxembourg": "LU",
    "Europe/Madrid": "ES",
    "Europe/Lisbon": "PT",
    "Europe/London": "GB",
    "Europe/Dublin": "IE",
    "Europe/Stockholm": "SE",
    "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK",
    "Europe/Helsinki": "FI",
    "Atlantic/Reykjavik": "IS",
    "Europe/Zurich": "CH",
    "Europe/Athens": "GR",
    "Europe/Sofia": "BG",
    "Europe/Bucharest": "RO",
    "Europe/Chisinau": "MD",
    "Europe/Kyiv": "UA",
    "Europe/Moscow": "RU",
    "Europe/Istanbul": "TR",
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Los_Angeles": "US",
    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "America/Mexico_City": "MX",
    "America/Sao_Paulo": "BR",
    "America/Argentina/Buenos_Aires": "AR",
    "Australia/Sydney": "AU",
    "Australia/Melbourne": "AU",
    "Pacific/Auckland": "NZ",
    "Asia/Tokyo": "JP",
    "Asia/Seoul": "KR",
    "Asia/Shanghai": "CN",
    "Asia/Kolkata": "IN",
    "Asia/Singapore": "SG",
    "Asia/Dubai": "AE",
    "Asia/Jerusalem": "IL",
    "Africa/Cairo": "EG",
    "Africa/Johannesburg": "ZA"
  };

  function detectCountry() {
    const locales = [];
    try {
      if (navigator.languages && navigator.languages.length) {
        Array.prototype.push.apply(locales, navigator.languages);
      }
      if (navigator.language) locales.push(navigator.language);
    } catch (error) {
      /* navigator may be restricted in unusual embeds */
    }
    for (let index = 0; index < locales.length; index += 1) {
      const match = String(locales[index] || "").match(/[-_]([a-zA-Z]{2})$/);
      if (match) {
        const code = match[1].toUpperCase();
        if (COUNTRY_NAMES[code]) return { code: code, name: COUNTRY_NAMES[code] };
      }
    }
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (zone && TIMEZONE_COUNTRIES[zone]) {
        const code = TIMEZONE_COUNTRIES[zone];
        return { code: code, name: COUNTRY_NAMES[code] || code };
      }
    } catch (error) {
      /* Intl may be unavailable */
    }
    return { code: "", name: "Neznano" };
  }

  const visitorCountry = detectCountry();
  let cachedVisitorId = "";

  function visitorId() {
    if (cachedVisitorId) return cachedVisitorId;
    let stored = "";
    try {
      stored = window.localStorage.getItem(KEYS.analyticsVisitor) || "";
      stored = stored ? JSON.parse(stored) : "";
    } catch (error) {
      stored = "";
    }
    if (!stored || typeof stored !== "string") {
      stored = "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      write(KEYS.analyticsVisitor, stored);
    }
    cachedVisitorId = stored;
    return stored;
  }

  function getAnalyticsEvents() {
    const stored = read(KEYS.analytics, []);
    return Array.isArray(stored) ? stored.filter((event) => event && event.type) : [];
  }

  function appendAnalyticsEvents(events) {
    if (!Array.isArray(events) || !events.length) return;
    const merged = getAnalyticsEvents().concat(events.filter((event) => event && event.type));
    merged.sort((a, b) => (Number(a.t) || 0) - (Number(b.t) || 0));
    write(KEYS.analytics, merged.slice(-ANALYTICS_LIMIT));
  }

  function track(type, data) {
    if (!type) return;
    const page = document.body ? document.body.getAttribute("data-page") || "" : "";
    if (page === "admin") return;
    const payload = data || {};
    appendAnalyticsEvents([
      Object.assign(
        {
          t: Date.now(),
          type: type,
          page: page || "other",
          country: visitorCountry.code,
          countryName: visitorCountry.name,
          visitor: visitorId()
        },
        payload
      )
    ]);
  }

  function clearAnalytics() {
    try {
      window.localStorage.removeItem(KEYS.analytics);
    } catch (error) {
      /* ignore blocked storage */
    }
  }

  /* ---------------------------------------------------------- Stripe demo */
  function isValidStripeLink(value) {
    const link = String(value || "").trim();
    return /^https:\/\/(buy|checkout)\.stripe\.com\/[^\s]+$/i.test(link);
  }

  function getStripeSettings() {
    const stored = read(KEYS.stripe, {});
    const data = stored && typeof stored === "object" ? stored : {};
    return {
      enabled: data.enabled === true,
      paymentLink: typeof data.paymentLink === "string" ? data.paymentLink : "",
      publishableKey: typeof data.publishableKey === "string" ? data.publishableKey : "",
      updatedAt: Number(data.updatedAt) || 0
    };
  }

  function saveStripeSettings(input) {
    const data = input || {};
    const paymentLink = String(data.paymentLink || "").trim();
    const publishableKey = String(data.publishableKey || "").trim();
    const enabled = data.enabled === true;

    if (/^sk_/i.test(paymentLink) || /^sk_/i.test(publishableKey)) {
      return {
        ok: false,
        message: "Skrivnega ključa (sk_...) nikoli ne shranjujte v brskalnik. Uporabite javni Payment Link."
      };
    }
    if (enabled && !isValidStripeLink(paymentLink)) {
      return {
        ok: false,
        message: "Vnesite veljavno Stripe Payment Link povezavo, npr. https://buy.stripe.com/..."
      };
    }
    if (paymentLink && !isValidStripeLink(paymentLink)) {
      return {
        ok: false,
        message: "Payment Link se mora začeti s https://buy.stripe.com/ ali https://checkout.stripe.com/."
      };
    }
    if (publishableKey && !/^pk_(test|live)_[A-Za-z0-9]+$/.test(publishableKey)) {
      return {
        ok: false,
        message: "Publishable key se začne s pk_test_ ali pk_live_."
      };
    }

    const settings = {
      enabled: enabled,
      paymentLink: paymentLink,
      publishableKey: publishableKey,
      updatedAt: Date.now()
    };
    write(KEYS.stripe, settings);
    return { ok: true, settings: settings };
  }

  function stripeCheckoutUrl(orderId) {
    const settings = getStripeSettings();
    if (!settings.enabled || !isValidStripeLink(settings.paymentLink)) return "";
    try {
      const url = new URL(settings.paymentLink);
      if (orderId) url.searchParams.set("client_reference_id", orderId);
      return url.toString();
    } catch (error) {
      return settings.paymentLink;
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

  let categories = Array.isArray(NK.categories) ? NK.categories : [];
  const baseProducts = Array.isArray(NK.products) ? NK.products : [];
  const storedCustom = LIVE_MODE ? [] : read(KEYS.customProducts, []);
  const customProducts = (Array.isArray(storedCustom) ? storedCustom : []).filter(isValidCustomProduct);
  const storedHidden = LIVE_MODE ? [] : read(KEYS.hiddenProducts, []);
  const hiddenIds = new Set(
    (Array.isArray(storedHidden) ? storedHidden : []).filter((id) => typeof id === "string")
  );
  let products = baseProducts
    .filter((product) => !hiddenIds.has(product.id))
    .concat(customProducts);
  NK.baseProducts = baseProducts;
  NK.customProducts = customProducts;
  NK.hiddenProducts = baseProducts.filter((product) => hiddenIds.has(product.id));
  NK.products = products;
  const byId = new Map(products.map((product) => [product.id, product]));

  const state = {
    cart: read(KEYS.cart, []).filter((item) => item && byId.has(item.id)),
    wishlist: read(KEYS.wishlist, []).filter((id) => byId.has(id)),
    coupon: read(KEYS.coupon, ""),
    recent: read(KEYS.recent, []).filter((id) => byId.has(id))
  };

  function applyLiveData(data) {
    if (Array.isArray(data.products)) {
      products = data.products;
      NK.products = products;
      NK.baseProducts = products.slice();
      byId.clear();
      products.forEach((product) => byId.set(product.id, product));
      state.cart = state.cart.filter((item) => item && byId.has(item.id));
      state.wishlist = state.wishlist.filter((id) => byId.has(id));
      state.recent = state.recent.filter((id) => byId.has(id));
      write(KEYS.cart, state.cart);
      write(KEYS.wishlist, state.wishlist);
      write(KEYS.recent, state.recent);
    }
    if (Array.isArray(data.categories)) {
      categories = data.categories;
      NK.categories = categories;
    }
    if (Array.isArray(data.brands)) NK.brands = data.brands;
    if (data.coupons) NK.coupons = data.coupons;
    if (data.settings) NK.store = data.settings;
    if (data.session) NK.adminSession = data.session;
    NK.live = true;
    updateBadges();
    renderCartDrawer();
    document.dispatchEvent(new CustomEvent("nk:products-change"));
  }

  if (LIVE_MODE) {
    fetch(API_BASE + "/bootstrap", { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(applyLiveData)
      .catch((error) => {
        console.warn(
          "Nakupko: živi API ni dosegljiv, uporabljam lokalne demo podatke.",
          error
        );
        NK.live = false;
      })
      .finally(() => {
        if (resolveReady) resolveReady();
      });
  } else {
    NK.live = false;
  }

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

  /* --------------------------------------------------------- custom products */
  const CATEGORY_PALETTES = {
    "bela-tehnika": ["#e8f6f1", "#0f766e", "#123c36"],
    racunalnistvo: ["#e6edff", "#3b5bdb", "#1e2a5a"],
    "tv-avdio": ["#ffe9e2", "#c2410c", "#5a1f0c"],
    "mali-aparati": ["#fff1d6", "#b45309", "#4a2a05"],
    dom: ["#f0e8ff", "#7c3aed", "#3b1d70"],
    sport: ["#e3f7e8", "#15803d", "#0f3d22"],
    zdravje: ["#ffe8f0", "#be185d", "#5a0f2c"],
    igrace: ["#e8f4ff", "#2563eb", "#122a5c"]
  };

  const CATEGORY_ART = {
    "bela-tehnika": "washer",
    racunalnistvo: "laptop",
    "tv-avdio": "tv",
    "mali-aparati": "espresso",
    dom: "lamp",
    sport: "yoga",
    zdravje: "diffuser",
    igrace: "blocks"
  };

  function isValidCustomProduct(product) {
    return Boolean(
      product &&
        product.id &&
        product.name &&
        product.category &&
        categoryBySlug(product.category) &&
        Number(product.price) > 0
    );
  }

  function slugify(value) {
    return norm(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);
  }

  function nextCustomId(name) {
    const base = "custom-" + (slugify(name) || "izdelek");
    let id = base;
    let counter = 2;
    while (byId.has(id)) {
      id = base + "-" + counter;
      counter += 1;
    }
    return id;
  }

  function customPalette(slug) {
    const palette = CATEGORY_PALETTES[slug] || ["#eef4f2", "#0f766e", "#123c36"];
    return palette.slice();
  }

  function categoryArt(slug) {
    return CATEGORY_ART[slug] || "generic";
  }

  function saveCustomProduct(input) {
    const data = input || {};
    const name = String(data.name || "").trim().replace(/\s+/g, " ");
    const category = String(data.category || "");
    const categoryInfo = categoryBySlug(category);
    const price = Math.round((Number(data.price) || 0) * 100) / 100;

    if (!name) return { ok: false, message: "Vnesite naziv izdelka." };
    if (!categoryInfo) return { ok: false, message: "Izberite veljavno kategorijo." };
    if (!(price > 0)) return { ok: false, message: "Cena mora biti večja od 0." };

    const brand = String(data.brand || "").trim().replace(/\s+/g, " ") || "Nakupko";
    const oldPriceValue = Math.round((Number(data.oldPrice) || 0) * 100) / 100;
    const oldPrice = oldPriceValue > price ? oldPriceValue : null;
    const art = String(data.art || "").trim() || categoryArt(category);
    const colorName = String(data.colorName || "").trim();
    const colorHex = /^#[0-9a-f]{6}$/i.test(String(data.colorHex || "")) ? String(data.colorHex) : "#0f766e";
    const colors = colorName ? [{ name: colorName, hex: colorHex }] : [];
    const description = String(data.description || "").trim();
    const existing = data.id ? NK.customProducts.find((product) => product.id === data.id) : null;
    const sku = existing && existing.sku ? existing.sku : "NK-C" + String(Date.now()).slice(-6);

    if (existing) {
      Object.assign(existing, {
        name: name,
        brand: brand,
        category: category,
        price: price,
        oldPrice: oldPrice,
        art: art,
        palette: customPalette(category),
        colors: colors,
        description: description || existing.description,
        badge: oldPrice ? "Akcija" : "Novo",
        specs: Object.assign({}, existing.specs, {
          "Kategorija": categoryInfo.name,
          "Blagovna znamka": brand,
          "Šifra izdelka": sku
        })
      });
      write(KEYS.customProducts, NK.customProducts);
      document.dispatchEvent(new CustomEvent("nk:products-change"));
      return { ok: true, product: existing, updated: true };
    }

    const product = {
      id: nextCustomId(name),
      name: name,
      brand: brand,
      category: category,
      price: price,
      oldPrice: oldPrice,
      rating: 4.5,
      reviews: 0,
      art: art,
      palette: customPalette(category),
      badge: oldPrice ? "Akcija" : "Novo",
      colors: colors,
      description: description || "Nov izdelek v demo ponudbi Nakupko.",
      features: [],
      specs: {
        "Kategorija": categoryInfo.name,
        "Blagovna znamka": brand,
        "Šifra izdelka": sku,
        "Garancija": "2 leti"
      },
      stock: true,
      tags: ["new"],
      sku: sku,
      added: Date.now(),
      custom: true
    };

    NK.customProducts.push(product);
    NK.products.push(product);
    byId.set(product.id, product);
    write(KEYS.customProducts, NK.customProducts);
    document.dispatchEvent(new CustomEvent("nk:products-change"));
    return { ok: true, product: product, created: true };
  }

  function deleteCustomProduct(id) {
    const index = NK.customProducts.findIndex((product) => product.id === id);
    if (index === -1) return false;

    NK.customProducts.splice(index, 1);
    const catalogIndex = NK.products.findIndex((product) => product.id === id);
    if (catalogIndex !== -1) NK.products.splice(catalogIndex, 1);
    byId.delete(id);

    state.cart = state.cart.filter((item) => item.id !== id);
    state.wishlist = state.wishlist.filter((entry) => entry !== id);
    state.recent = state.recent.filter((entry) => entry !== id);

    write(KEYS.customProducts, NK.customProducts);
    write(KEYS.cart, state.cart);
    write(KEYS.wishlist, state.wishlist);
    write(KEYS.recent, state.recent);
    updateBadges();
    renderCartDrawer();
    document.dispatchEvent(new CustomEvent("nk:products-change"));
    return true;
  }

  function getCustomProducts() {
    return NK.customProducts.slice().sort((a, b) => (b.added || 0) - (a.added || 0));
  }

  function getHiddenProducts() {
    return baseProducts.filter((product) => hiddenIds.has(product.id));
  }

  function persistHidden() {
    write(KEYS.hiddenProducts, Array.from(hiddenIds));
  }

  function rebuildCatalog() {
    products = baseProducts
      .filter((product) => !hiddenIds.has(product.id))
      .concat(NK.customProducts);
    NK.products = products;
    NK.hiddenProducts = getHiddenProducts();

    byId.clear();
    products.forEach((product) => byId.set(product.id, product));

    state.cart = state.cart.filter((item) => item && byId.has(item.id));
    state.wishlist = state.wishlist.filter((id) => byId.has(id));
    state.recent = state.recent.filter((id) => byId.has(id));

    write(KEYS.cart, state.cart);
    write(KEYS.wishlist, state.wishlist);
    write(KEYS.recent, state.recent);
    updateBadges();
    renderCartDrawer();
    document.dispatchEvent(new CustomEvent("nk:products-change"));
  }

  function hideProduct(id) {
    const product = baseProducts.find((item) => item.id === id);
    if (!product || hiddenIds.has(id)) return false;
    hiddenIds.add(id);
    persistHidden();
    rebuildCatalog();
    return true;
  }

  function restoreProduct(id) {
    if (!hiddenIds.has(id)) return false;
    hiddenIds.delete(id);
    persistHidden();
    rebuildCatalog();
    return true;
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
    track("add-to-cart", {
      id: product.id,
      name: product.name,
      qty: amount,
      price: product.price
    });
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
    const store = NK.store || {};
    const freeThreshold = Number.isFinite(Number(store.freeShippingThreshold))
      ? Number(store.freeShippingThreshold)
      : 50;
    const standardCost = Number.isFinite(Number(store.standardShipping))
      ? Number(store.standardShipping)
      : 3.99;
    const expressCost = Number.isFinite(Number(store.expressShipping))
      ? Number(store.expressShipping)
      : 6.99;
    const codFee = Number.isFinite(Number(store.codFee)) ? Number(store.codFee) : 1.5;
    const delivery = opts.delivery || "standard";
    let shipping = 0;
    if (delivery === "express") shipping = expressCost;
    else if (delivery === "pickup") shipping = 0;
    else shipping = subtotal >= freeThreshold || subtotal === 0 ? 0 : standardCost;
    const payment = opts.payment || "card";
    const fee = payment === "cod" ? codFee : 0;
    const total = Math.max(0, subtotal - discount + shipping + fee);
    return {
      subtotal: subtotal,
      discount: discount,
      shipping: shipping,
      fee: fee,
      total: total,
      freeShippingRemaining: Math.max(0, freeThreshold - subtotal),
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
      '<p class="footer-demo">Demo trgovina — vsi izdelki, cene in podatki so izmišljeni. <a href="admin.html">Skrbništvo</a></p>' +
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

      const productLink = target.closest('a[href*="product.html"]');
      if (productLink) {
        const href = productLink.getAttribute("href") || "";
        const match = href.match(/[?&]id=([^&]+)/);
        if (match) {
          try {
            const id = decodeURIComponent(match[1]);
            const product = getProduct(id);
            track("product-click", {
              id: id,
              name: product ? product.name : id,
              source: document.body ? document.body.getAttribute("data-page") || "" : ""
            });
          } catch (error) {
            /* A malformed link should never block navigation. */
          }
        }
      }

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

  function renderCookieNotice() {
    if (!LIVE_MODE) return;
    if (read(KEYS.consent, "") === "accepted") return;
    if ($(".cookie-notice")) return;
    const notice = document.createElement("div");
    notice.className = "cookie-notice";
    notice.setAttribute("role", "region");
    notice.setAttribute("aria-label", "Obvestilo o piškotkih");
    notice.innerHTML =
      "<p><strong>Piškotki.</strong> Uporabljamo le nujne piškotke za košarico, prijavo v skrbništvo in varnost obrazcev. Ne uporabljamo oglaševanja ali sledenja. " +
      '<a href="info.html#zasebnost">Več o zasebnosti</a></p>' +
      '<button type="button" class="btn btn--primary" data-cookie-accept>Razumem</button>';
    document.body.appendChild(notice);
    const accept = notice.querySelector("[data-cookie-accept]");
    if (accept) {
      accept.addEventListener("click", () => {
        write(KEYS.consent, "accepted");
        notice.remove();
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
    renderCookieNotice();
    document.body.classList.add("js-ready");
    track("pageview", {
      path: window.location.pathname + window.location.search
    });
  }

  const ORDER_STATUSES = ["new", "approved", "shipped"];

  function getOrders() {
    const stored = read(KEYS.orders, []);
    return Array.isArray(stored) ? stored.filter((order) => order && order.id) : [];
  }

  function appendOrder(order) {
    if (!order || !order.id) return { ok: false, message: "Naročilo ni veljavno." };
    const orders = getOrders();
    const entry = Object.assign({ status: "new" }, order);
    orders.push(entry);
    write(KEYS.orders, orders.slice(-20));
    return { ok: true, order: entry };
  }

  function updateOrderStatus(orderId, status) {
    if (ORDER_STATUSES.indexOf(status) < 0) {
      return { ok: false, message: "Neznan status naročila." };
    }
    const orders = getOrders();
    let updated = null;
    const next = orders.map((order) => {
      if (order.id !== orderId) return order;
      updated = Object.assign({}, order, {
        status: status,
        statusUpdatedAt: new Date().toISOString()
      });
      if (status === "approved") updated.approvedAt = updated.statusUpdatedAt;
      if (status === "shipped") {
        updated.approvedAt = updated.approvedAt || updated.statusUpdatedAt;
        updated.shippedAt = updated.statusUpdatedAt;
      }
      return updated;
    });
    if (!updated) return { ok: false, message: "Naročilo ni najdeno." };
    write(KEYS.orders, next.slice(-20));
    const last = read(KEYS.lastOrder, null);
    if (last && last.id === orderId) write(KEYS.lastOrder, updated);
    return { ok: true, order: updated };
  }

  function clearCart() {
    state.cart = [];
    state.coupon = "";
    write(KEYS.cart, state.cart);
    write(KEYS.coupon, state.coupon);
    updateBadges();
    renderCartDrawer();
    document.dispatchEvent(new CustomEvent("nk:cart-change"));
  }

  function saveOrder(order) {
    if (order && order.totals) {
      track("order", {
        orderId: order.id,
        total: order.totals.total,
        items: (order.items || []).length,
        payment: order.payment ? order.payment.method : ""
      });
    }
    const result = appendOrder(order);
    write(KEYS.lastOrder, result.order || order);
    clearCart();
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
    customPalette: customPalette,
    categoryArt: categoryArt,
    saveCustomProduct: saveCustomProduct,
    deleteCustomProduct: deleteCustomProduct,
    getCustomProducts: getCustomProducts,
    getHiddenProducts: getHiddenProducts,
    hideProduct: hideProduct,
    restoreProduct: restoreProduct,
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
    clearCart: clearCart,
    ready: ready,
    api: API_BASE,
    getOrders: getOrders,
    appendOrder: appendOrder,
    updateOrderStatus: updateOrderStatus,
    getLastOrder: getLastOrder,
    track: track,
    getAnalyticsEvents: getAnalyticsEvents,
    appendAnalyticsEvents: appendAnalyticsEvents,
    clearAnalytics: clearAnalytics,
    detectCountry: detectCountry,
    countryName: function (code) {
      return COUNTRY_NAMES[String(code || "").toUpperCase()] || "Neznano";
    },
    getStripeSettings: getStripeSettings,
    saveStripeSettings: saveStripeSettings,
    isValidStripeLink: isValidStripeLink,
    stripeCheckoutUrl: stripeCheckoutUrl,
    initGlobal: initGlobal
  });
})();
