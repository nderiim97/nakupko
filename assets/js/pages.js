/* Page controllers for the Nakupko demo storefront. */
(function () {
  const NK = window.NK;
  const ART = window.NKArt;
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const params = new URLSearchParams(window.location.search);

  function esc(value) {
    return NK.escapeHtml(value);
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function productGrid(list, className) {
    return '<div class="product-grid ' + (className || "") + '">' + list.map((product) => NK.productCard(product)).join("") + "</div>";
  }

  function emptyState(title, text, href, label) {
    return (
      '<div class="empty-state">' +
      '<span class="empty-state__icon">' + ART.icon("spark", 34) + "</span>" +
      "<h2>" + esc(title) + "</h2><p>" + esc(text) + "</p>" +
      '<a class="btn btn--primary" href="' + href + '">' + esc(label) + "</a>" +
      "</div>"
    );
  }

  function starsOnly(rating) {
    return NK.stars(rating);
  }

  /* ------------------------------------------------------------------ home */
  function initHome() {
    renderHero();
    renderCategoryTiles();
    renderHomePromos();

    const featured = NK.products.filter((product) => (product.tags || []).includes("featured")).slice(0, 8);
    const fresh = NK.products.filter((product) => (product.tags || []).includes("new")).slice(0, 4);
    const sale = NK.products.filter((product) => product.oldPrice).slice(0, 4);
    const recent = NK.recentProducts(4);

    setHtml("#featured-grid", productGrid(featured));
    setHtml("#new-grid", productGrid(fresh));
    setHtml("#sale-grid", productGrid(sale));

    const custom = NK.getCustomProducts();
    if (custom.length) {
      const customSection = $("#custom-section");
      if (customSection) customSection.hidden = false;
      setHtml("#custom-grid", productGrid(custom.slice(0, 4)));
    }

    if (recent.length) {
      const section = $("#recent-section");
      if (section) section.hidden = false;
      setHtml("#recent-grid", productGrid(recent));
    }

    const newsletter = $("[data-newsletter]");
    if (newsletter) {
      /* Global handler already validates; nothing extra needed here. */
    }
  }

  function setHtml(selector, html) {
    const node = $(selector);
    if (node) node.innerHTML = html;
  }

  function renderHero() {
    const host = $("#hero-slides");
    const dots = $("#hero-dots");
    if (!host) return;

    host.innerHTML = NK.promos
      .map((promo, index) => {
        return (
          '<article class="hero-slide' + (index === 0 ? " is-active" : "") + '" data-slide="' + index + '" aria-hidden="' + (index === 0 ? "false" : "true") + '">' +
          '<div class="hero-slide__copy">' +
          '<p class="eyebrow">' + esc(promo.eyebrow) + "</p>" +
          (index === 0 ? "<h1>" : "<h2>") + esc(promo.title) + (index === 0 ? "</h1>" : "</h2>") +
          "<p>" + esc(promo.text) + "</p>" +
          '<div class="hero-slide__actions">' +
          '<a class="btn btn--primary btn--lg" href="' + promo.href + '">' + esc(promo.cta) + ART.icon("arrow-right", 18) + "</a>" +
          '<a class="btn btn--ghost" href="category.html">Vsi izdelki</a>' +
          "</div>" +
          '<ul class="hero-slide__points">' +
          '<li>' + ART.icon("check", 16) + " Brezplačna dostava nad 50 €</li>" +
          '<li>' + ART.icon("check", 16) + " Vračilo v 30 dneh</li>" +
          "</ul></div>" +
          '<div class="hero-slide__art">' + ART.product(promo.art, promo.palette, promo.title) + "</div>" +
          "</article>"
        );
      })
      .join("");

    if (dots) {
      dots.innerHTML = NK.promos
        .map(
          (promo, index) =>
            '<button class="hero-dot' + (index === 0 ? " is-active" : "") + '" type="button" data-hero-dot="' + index + '" aria-label="Prikaži ponudbo ' + (index + 1) + '" aria-current="' + (index === 0 ? "true" : "false") + '"></button>'
        )
        .join("");
    }

    let current = 0;
    let timer = null;

    function show(index) {
      const slides = $$(".hero-slide", host);
      const buttons = $$("[data-hero-dot]", dots || host);
      if (!slides.length) return;
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        const active = position === current;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
      buttons.forEach((button, position) => {
        const active = position === current;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-current", active ? "true" : "false");
      });
    }

    function start() {
      stop();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = window.setInterval(() => show(current + 1), 7000);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    $$("[data-hero-dot]", dots || host).forEach((button) => {
      button.addEventListener("click", () => {
        show(Number(button.getAttribute("data-hero-dot")));
        start();
      });
    });

    const prev = $("[data-hero-prev]");
    const next = $("[data-hero-next]");
    if (prev) prev.addEventListener("click", () => { show(current - 1); start(); });
    if (next) next.addEventListener("click", () => { show(current + 1); start(); });

    const hero = $("#hero");
    if (hero) {
      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
      hero.addEventListener("focusin", stop);
      hero.addEventListener("focusout", start);
    }
    start();
  }

  function renderCategoryTiles() {
    const host = $("#category-tiles");
    if (!host) return;
    host.innerHTML = NK.categories
      .map((category) => {
        const count = NK.products.filter((product) => product.category === category.slug).length;
        return (
          '<a class="category-tile" href="' + NK.categoryUrl(category.slug) + '" style="--tint:' + category.tint + '">' +
          '<span class="category-tile__icon">' + ART.icon(category.icon, 30) + "</span>" +
          '<span class="category-tile__text"><strong>' + esc(category.name) + "</strong><small>" + count + " izdelkov</small></span>" +
          '<span class="category-tile__arrow">' + ART.icon("arrow-right", 18) + "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderHomePromos() {
    const host = $("#promo-grid");
    if (!host) return;
    host.innerHTML =
      '<a class="promo-card promo-card--wide" href="category.html?sale=1">' +
      '<div class="promo-card__copy"><span class="badge badge--sale">Do 30 % popusta</span><h2>Izbrana bela tehnika za lažji vsakdan.</h2><p>Pralni in pomivalni stroji, hladilniki in še več — do konca meseca.</p><span class="text-link">Poglej akcije ' + ART.icon("arrow-right", 16) + "</span></div>" +
      '<div class="promo-card__art">' + ART.product("washer", ["#e8f6f1", "#0f766e", "#123c36"], "Pralni stroj") + "</div></a>" +
      '<a class="promo-card" href="category.html?cat=dom">' +
      '<div class="promo-card__copy"><span class="badge badge--soft">Novo v ponudbi</span><h2>Mali dodatki za večji občutek doma.</h2><p>Svetila, preproge in organizatorji v mirnih jesenskih odtenkih.</p><span class="text-link">Razišči dom ' + ART.icon("arrow-right", 16) + "</span></div>" +
      '<div class="promo-card__art">' + ART.product("rug", ["#f7efe7", "#b45309", "#6b2f06"], "Preproga") + "</div></a>";
  }

  /* -------------------------------------------------------------- category */
  function initCategory() {
    const isSearch = document.body.getAttribute("data-page") === "search";
    if (isSearch) return initSearch();

    const state = {
      q: params.get("q") || "",
      cat: params.get("cat") || "",
      brands: (params.get("brand") || "").split(",").filter(Boolean),
      min: params.get("min") || "",
      max: params.get("max") || "",
      rating: params.get("rating") || "",
      sale: params.get("sale") === "1",
      isnew: params.get("new") === "1",
      stock: params.get("stock") === "1",
      sort: params.get("sort") || "relevance",
      visible: 8
    };

    const category = NK.categoryBySlug(state.cat);
    const title = category ? category.name : state.sale ? "Akcije" : state.isnew ? "Novo v ponudbi" : "Vsi izdelki";
    const description = category
      ? category.blurb
      : "Preverjena izbira za dom, delo in prosti čas. Cene so vključno z DDV.";
    setText("#catalog-title", title);
    setText("#catalog-description", description);
    document.title = title + " | Nakupko";
    const crumb = $("#catalog-crumb");
    if (crumb) crumb.textContent = title;

    renderFilters(state);
    renderCatalog(state);
    bindCatalogEvents(state);
  }

  function renderFilters(state) {
    const host = $("#filters");
    if (!host) return;

    const catRadios = NK.categories
      .map(
        (category) =>
          '<label class="check"><input type="radio" name="cat" value="' + category.slug + '"' + (state.cat === category.slug ? " checked" : "") + '><span>' + esc(category.name) + "</span></label>"
      )
      .join("");

    const brandChecks = NK.brands
      .map(
        (brand) =>
          '<label class="check"><input type="checkbox" name="brand" value="' + esc(brand) + '"' + (state.brands.includes(brand) ? " checked" : "") + '><span>' + esc(brand) + "</span></label>"
      )
      .join("");

    host.innerHTML =
      '<div class="filters__head"><h2>Filtriraj</h2><button class="link-btn" type="button" data-reset-filters>Počisti</button></div>' +
      '<form id="filter-form">' +
      '<fieldset class="filter-group"><legend>Kategorija</legend>' +
      '<label class="check"><input type="radio" name="cat" value=""' + (!state.cat ? " checked" : "") + "><span>Vse kategorije</span></label>" +
      catRadios +
      "</fieldset>" +
      '<fieldset class="filter-group"><legend>Cena (€)</legend><div class="price-inputs">' +
      '<label><span class="sr-only">Najnižja cena</span><input type="number" name="min" min="0" step="1" placeholder="Od" value="' + esc(state.min) + '"></label>' +
      '<span>–</span>' +
      '<label><span class="sr-only">Najvišja cena</span><input type="number" name="max" min="0" step="1" placeholder="Do" value="' + esc(state.max) + '"></label>' +
      "</div></fieldset>" +
      '<fieldset class="filter-group"><legend>Znamka</legend>' + brandChecks + "</fieldset>" +
      '<fieldset class="filter-group"><legend>Ocena</legend>' +
      '<label class="check"><input type="radio" name="rating" value=""' + (!state.rating ? " checked" : "") + "><span>Vse ocene</span></label>" +
      '<label class="check"><input type="radio" name="rating" value="4"' + (state.rating === "4" ? " checked" : "") + "><span>4 zvezdice in več</span></label>" +
      '<label class="check"><input type="radio" name="rating" value="3"' + (state.rating === "3" ? " checked" : "") + "><span>3 zvezdice in več</span></label>" +
      "</fieldset>" +
      '<fieldset class="filter-group"><legend>Ponudba</legend>' +
      '<label class="check"><input type="checkbox" name="stock"' + (state.stock ? " checked" : "") + "><span>Samo na zalogi</span></label>" +
      '<label class="check"><input type="checkbox" name="sale"' + (state.sale ? " checked" : "") + "><span>Samo akcijske</span></label>" +
      '<label class="check"><input type="checkbox" name="new"' + (state.isnew ? " checked" : "") + "><span>Novo v ponudbi</span></label>" +
      "</fieldset>" +
      "</form>";
  }

  function filteredProducts(state) {
    let base = state.q ? NK.searchProducts(state.q) : NK.products.slice();
    let list = base.filter((product) => {
      if (state.cat && product.category !== state.cat) return false;
      if (state.brands.length && !state.brands.includes(product.brand)) return false;
      if (state.min && product.price < Number(state.min)) return false;
      if (state.max && product.price > Number(state.max)) return false;
      if (state.rating && product.rating < Number(state.rating)) return false;
      if (state.sale && !product.oldPrice) return false;
      if (state.isnew && !(product.tags || []).includes("new")) return false;
      if (state.stock && !product.stock) return false;
      return true;
    });

    const sort = state.sort;
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    else if (sort === "newest") list.sort((a, b) => b.added - a.added);
    else if (!state.q) {
      list.sort((a, b) => {
        const scoreA = ((a.tags || []).includes("featured") ? 2 : 0) + ((a.tags || []).includes("new") ? 1 : 0) + a.rating;
        const scoreB = ((b.tags || []).includes("featured") ? 2 : 0) + ((b.tags || []).includes("new") ? 1 : 0) + b.rating;
        return scoreB - scoreA;
      });
    }
    return list;
  }

  function renderCatalog(state) {
    const list = filteredProducts(state);
    const grid = $("#catalog-grid");
    const count = $("#catalog-count");
    const more = $("#load-more");
    if (count) {
      count.textContent = list.length + (list.length === 1 ? " izdelek" : list.length === 2 ? " izdelka" : list.length < 5 ? " izdelki" : " izdelkov");
    }
    if (!list.length) {
      if (grid) grid.innerHTML = "";
      const empty = $("#catalog-empty");
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = emptyState("Ni ustreznih izdelkov", "Poskusite odstraniti filter ali poiskati drug izraz.", "category.html", "Poglej vse izdelke");
      }
      if (more) more.hidden = true;
      renderChips(state);
      updateCatalogUrl(state);
      return;
    }
    const empty = $("#catalog-empty");
    if (empty) empty.hidden = true;
    const visible = list.slice(0, state.visible);
    if (grid) grid.innerHTML = visible.map((product) => NK.productCard(product)).join("");
    if (more) {
      more.hidden = list.length <= state.visible;
      more.textContent = "Prikaži več (" + Math.max(0, list.length - state.visible) + ")";
    }
    renderChips(state);
    updateCatalogUrl(state);
  }

  function renderChips(state) {
    const host = $("#active-filters");
    if (!host) return;
    const chips = [];
    if (state.q) chips.push({ key: "q", label: "Iskanje: " + state.q });
    if (state.cat) {
      const cat = NK.categoryBySlug(state.cat);
      chips.push({ key: "cat", label: cat ? cat.name : state.cat });
    }
    state.brands.forEach((brand) => chips.push({ key: "brand", value: brand, label: brand }));
    if (state.min) chips.push({ key: "min", label: "Od " + NK.money(Number(state.min)) });
    if (state.max) chips.push({ key: "max", label: "Do " + NK.money(Number(state.max)) });
    if (state.rating) chips.push({ key: "rating", label: state.rating + "+ zvezdic" });
    if (state.sale) chips.push({ key: "sale", label: "Akcije" });
    if (state.isnew) chips.push({ key: "new", label: "Novo" });
    if (state.stock) chips.push({ key: "stock", label: "Na zalogi" });

    host.innerHTML = chips
      .map(
        (chip) =>
          '<button class="chip" type="button" data-clear="' + chip.key + '"' + (chip.value ? ' data-value="' + esc(chip.value) + '"' : "") + ">" + esc(chip.label) + ART.icon("close", 13) + "</button>"
      )
      .join("");
  }

  function updateCatalogUrl(state) {
    const next = new URLSearchParams();
    if (state.q) next.set("q", state.q);
    if (state.cat) next.set("cat", state.cat);
    if (state.brands.length) next.set("brand", state.brands.join(","));
    if (state.min) next.set("min", state.min);
    if (state.max) next.set("max", state.max);
    if (state.rating) next.set("rating", state.rating);
    if (state.sale) next.set("sale", "1");
    if (state.isnew) next.set("new", "1");
    if (state.stock) next.set("stock", "1");
    if (state.sort && state.sort !== "relevance") next.set("sort", state.sort);
    const query = next.toString();
    try {
      window.history.replaceState({}, "", window.location.pathname + (query ? "?" + query : ""));
    } catch (error) {
      /* Some browsers restrict history on file:// URLs; filtering still works. */
    }
  }

  function bindCatalogEvents(state) {
    /* Delegated so the handlers survive filter panel re-renders. */
    document.addEventListener("change", (event) => {
      const form = event.target.closest("#filter-form");
      if (!form) return;
      const data = new FormData(form);
      state.cat = String(data.get("cat") || "");
      state.brands = data.getAll("brand").map(String);
      state.min = String(data.get("min") || "");
      state.max = String(data.get("max") || "");
      state.rating = String(data.get("rating") || "");
      state.stock = data.get("stock") === "on";
      state.sale = data.get("sale") === "on";
      state.isnew = data.get("new") === "on";
      state.visible = 8;
      renderCatalog(state);
    });

    document.addEventListener("submit", (event) => {
      if (event.target.closest("#filter-form")) event.preventDefault();
    });

    const sort = $("#sort");
    if (sort) {
      sort.value = state.sort;
      sort.addEventListener("change", () => {
        state.sort = sort.value;
        renderCatalog(state);
      });
    }

    const more = $("#load-more");
    if (more) {
      more.addEventListener("click", () => {
        state.visible += 8;
        renderCatalog(state);
      });
    }

    document.addEventListener("click", (event) => {
      const clear = event.target.closest("[data-clear]");
      if (clear) {
        const key = clear.getAttribute("data-clear");
        const value = clear.getAttribute("data-value");
        if (key === "brand") state.brands = state.brands.filter((brand) => brand !== value);
        else if (key === "cat") state.cat = "";
        else if (key === "rating") state.rating = "";
        else if (key === "min") state.min = "";
        else if (key === "max") state.max = "";
        else if (key === "sale") state.sale = false;
        else if (key === "new") state.isnew = false;
        else if (key === "stock") state.stock = false;
        state.visible = 8;
        renderFilters(state);
        renderCatalog(state);
        const sortNode = $("#sort");
        if (sortNode) sortNode.value = state.sort;
        return;
      }

      const reset = event.target.closest("[data-reset-filters]");
      if (reset) {
        state.q = "";
        state.cat = "";
        state.brands = [];
        state.min = "";
        state.max = "";
        state.rating = "";
        state.sale = false;
        state.isnew = false;
        state.stock = false;
        state.sort = "relevance";
        state.visible = 8;
        renderFilters(state);
        renderCatalog(state);
        const sortNode = $("#sort");
        if (sortNode) sortNode.value = "relevance";
      }

      const toggle = event.target.closest("[data-filter-toggle]");
      if (toggle) {
        const filters = $("#filters");
        if (filters) {
          const open = filters.classList.toggle("is-open");
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
        }
      }
    });
  }

  /* ---------------------------------------------------------------- search */
  function initSearch() {
    const query = params.get("q") || "";
    const form = $("#search-page-form");
    const input = $("#search-page-input");
    if (input) input.value = query;
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = input ? input.value.trim() : "";
        window.location.href = "search.html" + (value ? "?q=" + encodeURIComponent(value) : "");
      });
    }

    const title = $("#search-title");
    const count = $("#search-count");
    const grid = $("#search-results");
    const sort = $("#search-sort");
    const empty = $("#search-empty");

    if (!query) {
      if (title) title.textContent = "Kaj iščete?";
      if (count) count.textContent = "Vnesite izraz za iskanje po izdelkih, znamkah in kategorijah.";
      if (grid) {
        const popular = NK.products.filter((product) => (product.tags || []).includes("featured")).slice(0, 4);
        grid.innerHTML = productGrid(popular);
      }
      if (sort) sort.closest(".catalog-toolbar")?.setAttribute("hidden", "");
      return;
    }

    NK.track("search", { query: String(query).slice(0, 80) });
    let results = NK.searchProducts(query);
    const sortParam = params.get("sort") || "relevance";
    if (sort && ["relevance", "price-asc", "price-desc", "rating"].includes(sortParam)) {
      sort.value = sortParam;
    }
    function render() {
      let list = results.slice();
      const mode = sort ? sort.value : "relevance";
      if (mode === "price-asc") list.sort((a, b) => a.price - b.price);
      else if (mode === "price-desc") list.sort((a, b) => b.price - a.price);
      else if (mode === "rating") list.sort((a, b) => b.rating - a.rating);
      if (title) title.textContent = "Rezultati za „" + query + "“";
      if (count) count.textContent = list.length + (list.length === 1 ? " izdelek" : list.length === 2 ? " izdelka" : list.length < 5 ? " izdelki" : " izdelkov");
      if (grid) grid.innerHTML = list.map((product) => NK.productCard(product)).join("");
      if (empty) {
        empty.hidden = list.length > 0;
        if (!list.length) empty.innerHTML = emptyState("Ni zadetkov", "Poskusite z drugačnim izrazom ali poglejte vse izdelke.", "category.html", "Poglej vse izdelke");
      }
    }
    render();
    if (sort) {
      sort.addEventListener("change", () => {
        render();
        try {
          const next = new URLSearchParams(window.location.search);
          if (sort.value === "relevance") next.delete("sort");
          else next.set("sort", sort.value);
          const qs = next.toString();
          window.history.replaceState({}, "", window.location.pathname + (qs ? "?" + qs : ""));
        } catch (error) {
          /* history may be restricted on file:// URLs */
        }
      });
    }
  }

  /* --------------------------------------------------------------- product */
  function initProduct() {
    const id = params.get("id") || "";
    const product = NK.getProduct(id);
    const root = $("#product-root");
    if (!root) return;

    if (!product) {
      root.innerHTML = emptyState("Izdelek ni najden", "Povezava morda ni več veljavna. Poglejte celotno ponudbo.", "category.html", "Vsi izdelki");
      return;
    }

    document.title = product.name + " | Nakupko";
    const category = NK.categoryBySlug(product.category);
    NK.addRecent(product.id);
    NK.track("product-view", {
      id: product.id,
      name: product.name,
      category: product.category
    });

    const palettes = [
      product.palette,
      [product.palette[1], product.palette[0], product.palette[2]],
      ["#f5f3ee", product.palette[1], product.palette[2]]
    ];
    const badge = product.badge || (product.oldPrice ? "Akcija" : (product.tags || []).includes("new") ? "Novo" : "");
    const wished = NK.isWishlisted(product.id);
    const savings = product.oldPrice ? product.oldPrice - product.price : 0;

    let colors = "";
    if (product.colors && product.colors.length) {
      colors =
        '<div class="product-option"><span class="product-option__label">Barva: <strong id="selected-color">' + esc(product.colors[0].name) + "</strong></span>" +
        '<div class="swatches">' +
        product.colors
          .map(
            (color, index) =>
              '<button class="swatch' + (index === 0 ? " is-active" : "") + '" type="button" data-color="' + esc(color.name) + '" style="--swatch:' + color.hex + '" aria-pressed="' + (index === 0 ? "true" : "false") + '" aria-label="Barva ' + esc(color.name) + '"><span></span></button>'
          )
          .join("") +
        "</div></div>";
    }

    root.innerHTML =
      '<nav class="breadcrumb" aria-label="Drobtinice"><a href="index.html">Domov</a><span>/</span><a href="' + NK.categoryUrl(product.category) + '">' + esc(category ? category.name : "Izdelki") + "</a><span>/</span><span aria-current=\"page\">" + esc(product.name) + "</span></nav>" +
      '<div class="product-detail">' +
      '<div class="product-gallery">' +
      '<div class="product-gallery__main" id="product-main-art">' + ART.product(product.art, palettes[0], product.name) + "</div>" +
      '<div class="product-gallery__thumbs">' +
      palettes
        .map(
          (palette, index) =>
            '<button class="gallery-thumb' + (index === 0 ? " is-active" : "") + '" type="button" data-gallery="' + index + '" aria-label="Pogled ' + (index + 1) + '">' + ART.product(product.art, palette, product.name + " – pogled " + (index + 1)) + "</button>"
        )
        .join("") +
      "</div></div>" +
      '<div class="product-info">' +
      '<div class="product-info__top">' +
      (badge ? '<span class="badge ' + (badge === "Akcija" ? "badge--sale" : "badge--new") + '">' + esc(badge) + "</span>" : "") +
      '<p class="product-info__brand"><a href="' + NK.categoryUrl(product.category) + '?brand=' + encodeURIComponent(product.brand) + '">' + esc(product.brand) + "</a></p>" +
      "</div>" +
      "<h1>" + esc(product.name) + "</h1>" +
      '<div class="product-info__rating">' + starsOnly(product.rating) + '<span class="product-info__reviews">' + (product.reviews ? product.reviews + " ocen" : "Nov izdelek") + "</span></div>" +
      '<div class="product-price">' +
      "<strong>" + NK.money(product.price) + "</strong>" +
      (product.oldPrice ? "<s>" + NK.money(product.oldPrice) + "</s>" : "") +
      (savings > 0 ? '<span class="save">Prihranite ' + NK.money(savings) + "</span>" : "") +
      "</div>" +
      '<p class="product-info__lead">' + esc(product.description) + "</p>" +
      colors +
      '<div class="product-buy">' +
      '<div class="qty" aria-label="Količina"><button type="button" id="qty-minus" aria-label="Zmanjšaj količino">' + ART.icon("minus", 16) + '</button><span id="qty-value" aria-live="polite">1</span><button type="button" id="qty-plus" aria-label="Povečaj količino">' + ART.icon("plus", 16) + "</button></div>" +
      '<button class="btn btn--primary btn--lg" type="button" id="product-add">' + ART.icon("cart", 19) + " Dodaj v košarico</button>" +
      "</div>" +
      '<button class="btn btn--ghost btn--block product-wish' + (wished ? " is-active" : "") + '" type="button" id="product-wish" aria-pressed="' + (wished ? "true" : "false") + '">' + ART.icon("heart", 18) + "<span>" + (wished ? "Na seznamu želja" : "Dodaj na seznam želja") + "</span></button>" +
      '<ul class="product-perks">' +
      '<li>' + ART.icon("truck", 20) + "<span><strong>Dostava v 2–4 dneh</strong><small>Brezplačno nad 50 €</small></span></li>" +
      '<li>' + ART.icon("return", 20) + "<span><strong>30 dni za vračilo</strong><small>Brez pojasnila</small></span></li>" +
      '<li>' + ART.icon("shield", 20) + "<span><strong>2 leti garancije</strong><small>Preverjena kakovost</small></span></li>" +
      "</ul>" +
      '<div class="delivery-note">' + ART.icon("pin", 18) + " Predvidena dostava: <strong>" + NK.longDate(new Date(Date.now() + 3 * 86400000)) + "</strong></div>" +
      "</div></div>" +
      '<section class="product-tabs">' +
      '<div class="tabs" role="tablist" aria-label="Informacije o izdelku">' +
      '<button class="tab is-active" type="button" role="tab" aria-selected="true" data-tab="opis">Opis</button>' +
      '<button class="tab" type="button" role="tab" aria-selected="false" data-tab="specifikacije">Specifikacije</button>' +
      '<button class="tab" type="button" role="tab" aria-selected="false" data-tab="dostava">Dostava in vračilo</button>' +
      "</div>" +
      '<div class="tab-panel is-active" data-panel="opis"><p>' + esc(product.description) + "</p><ul class=\"feature-list\">" + (product.features || []).map((feature) => "<li>" + ART.icon("check", 16) + " " + esc(feature) + "</li>").join("") + "</ul></div>" +
      '<div class="tab-panel" data-panel="specifikacije"><table class="spec-table"><tbody>' +
      Object.entries(product.specs || {}).map(([key, value]) => "<tr><th>" + esc(key) + "</th><td>" + esc(value) + "</td></tr>").join("") +
      "</tbody></table></div>" +
      '<div class="tab-panel" data-panel="dostava"><p>Naročila oddana do 14. ure ob delovnem dnevu odpremimo isti dan. Standardna dostava traja 2–4 delovne dni, hitra pa 1–2 delovna dneva. Dostava je brezplačna pri naročilih nad 50 €.</p><p>Izdelek lahko vrnete v 30 dneh od prejema, če je v originalni embalaži in nepoškodovan. Za vračilo ni potrebno pojasnilo.</p></div>' +
      "</section>" +
      '<section class="section section--related"><div class="section-head"><div><p class="eyebrow">Morda vam bo všeč</p><h2>Podobni izdelki</h2></div><a class="text-link" href="' + NK.categoryUrl(product.category) + '">Vsi v kategoriji ' + ART.icon("arrow-right", 16) + "</a></div><div id=\"related-grid\"></div></section>";

    let qty = 1;
    let selectedColor = product.colors && product.colors[0] ? product.colors[0].name : "";

    const qtyValue = $("#qty-value");
    const minus = $("#qty-minus");
    const plus = $("#qty-plus");
    if (minus) minus.addEventListener("click", () => { qty = Math.max(1, qty - 1); if (qtyValue) qtyValue.textContent = qty; });
    if (plus) plus.addEventListener("click", () => { qty = Math.min(99, qty + 1); if (qtyValue) qtyValue.textContent = qty; });

    $$("[data-color]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedColor = button.getAttribute("data-color") || "";
        $$("[data-color]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
        const label = $("#selected-color");
        if (label) label.textContent = selectedColor;
      });
    });

    $$("[data-gallery]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-gallery")) || 0;
        const main = $("#product-main-art");
        if (main) main.innerHTML = ART.product(product.art, palettes[index], product.name);
        $$("[data-gallery]").forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });

    $$("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-tab");
        $$("[data-tab]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
        $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.getAttribute("data-panel") === key));
      });
    });

    const add = $("#product-add");
    if (add) add.addEventListener("click", () => NK.addToCart(product.id, qty, selectedColor));

    const wish = $("#product-wish");
    function syncWish() {
      if (!wish) return;
      const active = NK.isWishlisted(product.id);
      wish.classList.toggle("is-active", active);
      wish.setAttribute("aria-pressed", active ? "true" : "false");
      const label = wish.querySelector("span");
      if (label) label.textContent = active ? "Na seznamu želja" : "Dodaj na seznam želja";
    }
    if (wish) wish.addEventListener("click", () => { NK.toggleWishlist(product.id); syncWish(); });
    document.addEventListener("nk:wishlist-change", syncWish);

    const related = NK.products
      .filter((item) => item.category === product.category && item.id !== product.id)
      .sort((a, b) => b.rating - a.rating);
    if (related.length < 4) {
      NK.products.forEach((item) => {
        if (item.id !== product.id && !related.some((entry) => entry.id === item.id)) related.push(item);
      });
    }
    setHtml("#related-grid", productGrid(related.slice(0, 4)));
  }

  /* ------------------------------------------------------------------ cart */
  let cartMessage = "";

  function initCart() {
    renderCartPage();
    document.addEventListener("nk:cart-change", renderCartPage);

    document.addEventListener("submit", (event) => {
      const form = event.target.closest("#coupon-form");
      if (!form) return;
      event.preventDefault();
      const input = $("#coupon-input");
      const result = NK.applyCoupon(input ? input.value : "");
      cartMessage = result.message;
      if (input) input.value = "";
      renderCartPage();
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-remove-coupon]")) {
        NK.clearCoupon();
        cartMessage = "Koda je odstranjena.";
        renderCartPage();
      }
    });
  }

  function renderCartPage() {
    const root = $("#cart-root");
    if (!root) return;
    const items = NK.cartItems();
    if (!items.length) {
      root.innerHTML =
        emptyState("Vaša košarica je prazna", "Dodajte izdelek in nadaljujte z nakupom. Vaša izbira bo shranjena v tem brskalniku.", "category.html", "Začni nakupovati") +
        '<section class="section section--related"><div class="section-head"><div><p class="eyebrow">Predlogi</p><h2>Morda potrebujete</h2></div></div><div id="cart-recommend"></div></section>';
      setHtml("#cart-recommend", productGrid(NK.products.filter((product) => (product.tags || []).includes("featured")).slice(0, 4)));
      return;
    }

    const totals = NK.cartTotals();
    root.innerHTML =
      '<div class="cart-layout">' +
      '<div class="cart-main">' +
      '<div class="cart-lines">' +
      items
        .map(
          (item) =>
            '<article class="cart-line">' +
            '<a class="cart-line__art" href="' + NK.productUrl(item.product) + '">' + ART.product(item.product.art, item.product.palette, item.product.name) + "</a>" +
            '<div class="cart-line__info"><p class="cart-line__brand">' + esc(item.product.brand) + "</p>" +
            '<a class="cart-line__name" href="' + NK.productUrl(item.product) + '">' + esc(item.product.name) + "</a>" +
            (item.color ? '<p class="cart-line__meta">Barva: ' + esc(item.color) + "</p>" : "") +
            '<div class="cart-line__controls"><div class="qty qty--sm"><button type="button" data-cart-qty="' + item.key + '" data-delta="-1" aria-label="Zmanjšaj količino">' + ART.icon("minus", 14) + '</button><span>' + item.qty + '</span><button type="button" data-cart-qty="' + item.key + '" data-delta="1" aria-label="Povečaj količino">' + ART.icon("plus", 14) + "</button></div>" +
            '<button class="link-btn" type="button" data-remove-cart="' + item.key + '">' + ART.icon("trash", 15) + " Odstrani</button></div></div>" +
            '<div class="cart-line__price"><strong>' + NK.money(item.lineTotal) + "</strong><span>" + NK.money(item.product.price) + " / kos</span></div>" +
            "</article>"
        )
        .join("") +
      "</div>" +
      '<div class="cart-foot"><a class="text-link" href="category.html">' + ART.icon("chevron-left", 16) + " Nadaljuj z nakupovanjem</a>" +
      '<span class="cart-foot__note">' + ART.icon("lock", 15) + " Varno plačilo</span></div>" +
      "</div>" +
      '<aside class="cart-aside">' +
      '<div class="summary-card"><h2>Povzetek naročila</h2>' +
      '<div class="summary-row"><span>Vmesni seštevek</span><strong>' + NK.money(totals.subtotal) + "</strong></div>" +
      (totals.coupon ? '<div class="summary-row summary-row--discount"><span>Popust (' + esc(totals.coupon.code) + ")</span><strong>−" + NK.money(totals.discount) + "</strong></div>" : "") +
      '<div class="summary-row"><span>Dostava</span><strong>' + (totals.shipping === 0 ? "Brezplačno" : NK.money(totals.shipping)) + "</strong></div>" +
      '<div class="summary-total"><span>Skupaj</span><strong>' + NK.money(totals.total) + "</strong></div>" +
      (totals.freeShippingRemaining > 0 ? '<p class="summary-hint">' + ART.icon("truck", 16) + " Do brezplačne dostave še " + NK.money(totals.freeShippingRemaining) + ".</p>" : '<p class="summary-hint is-ok">' + ART.icon("check", 16) + " Brezplačna dostava je zagotovljena.</p>") +
      '<a class="btn btn--primary btn--block btn--lg" href="checkout.html">Na blagajno ' + ART.icon("arrow-right", 18) + "</a>" +
      '<p class="summary-note">Cene vključujejo DDV. Demo trgovina — plačilo ni izvedeno.</p></div>' +
      '<div class="coupon-card"><h3>Koda za popust</h3><form id="coupon-form" class="coupon-form"><label class="sr-only" for="coupon-input">Koda za popust</label><input id="coupon-input" name="coupon" placeholder="npr. NAKUP10" autocomplete="off"><button class="btn btn--soft" type="submit">Uporabi</button></form>' +
      (cartMessage ? '<p class="coupon-message">' + esc(cartMessage) + "</p>" : "") +
      (totals.coupon ? '<p class="coupon-applied">' + ART.icon("check", 15) + " " + esc(totals.coupon.info.label) + ' <button class="link-btn" type="button" data-remove-coupon>Odstrani</button></p>' : '<p class="coupon-hint">Poskusite <strong>NAKUP10</strong> za 10 % popusta.</p>') +
      "</div></aside></div>";
  }

  /* -------------------------------------------------------------- checkout */
  function initCheckout() {
    const root = $("#checkout-root");
    if (!root) return;
    if (!NK.cartItems().length) {
      root.innerHTML = emptyState("Košarica je prazna", "Pred zaključkom nakupa dodajte vsaj en izdelek.", "category.html", "Poglej izdelke");
      return;
    }

    const stripe = NK.getStripeSettings();
    const stripeReady = NK.live
      ? Boolean(NK.store && NK.store.stripeEnabled)
      : stripe.enabled && NK.isValidStripeLink(stripe.paymentLink);
    const checkoutTotals = NK.cartTotals();
    NK.track("checkout", {
      items: NK.cartCount(),
      total: checkoutTotals.total
    });

    root.innerHTML =
      '<div class="checkout-layout">' +
      '<form class="checkout-form" id="checkout-form" novalidate>' +
      '<section class="form-section"><div class="form-section__head"><span class="step-number">1</span><div><h2>Kontaktni podatki</h2><p>Za potrditev naročila in dostavo.</p></div></div>' +
      '<div class="form-grid">' +
      field("email", "E-pošta", "email", "ime@primer.si", "email", "Vnesite veljaven e-poštni naslov.") +
      field("name", "Ime in priimek", "text", "Ana Novak", "name", "Vnesite ime in priimek.") +
      field("phone", "Telefon", "tel", "+386 31 234 567", "tel", "Vnesite veljaven telefonski številka.") +
      "</div></section>" +
      '<section class="form-section"><div class="form-section__head"><span class="step-number">2</span><div><h2>Naslov dostave</h2><p>Kam naj pošljemo vaše naročilo?</p></div></div>' +
      '<div class="form-grid">' +
      field("address", "Naslov", "text", "Tržaška cesta 12", "street-address", "Vnesite naslov.") +
      field("postal", "Poštna številka", "text", "1000", "postal-code", "Vnesite štirimestno poštno številko.", "inputmode=numeric maxlength=4") +
      field("city", "Kraj", "text", "Ljubljana", "address-level2", "Vnesite kraj.") +
      "</div>" +
      '<div class="field"><label for="note">Opomba za dostavo <span>(neobvezno)</span></label><textarea id="note" name="note" rows="3" placeholder="npr. zvonec ne dela, pokličite pred dostavo"></textarea></div>' +
      "</section>" +
      '<section class="form-section"><div class="form-section__head"><span class="step-number">3</span><div><h2>Dostava</h2><p>Izberite način, ki vam najbolj ustreza.</p></div></div>' +
      '<div class="choice-list">' +
      choice("delivery", "standard", "Standardna dostava", "2–4 delovna dni", "3,99 €", true) +
      choice("delivery", "express", "Hitra dostava", "1–2 delovna dneva", "6,99 €") +
      choice("delivery", "pickup", "Osebni prevzem", "Tržaška cesta 12, Ljubljana", "Brezplačno") +
      "</div></section>" +
      '<section class="form-section"><div class="form-section__head"><span class="step-number">4</span><div><h2>Plačilo</h2><p>' +
      (stripeReady
        ? "Kartično plačilo lahko zaključite na varni strani Stripe."
        : NK.live
          ? "Kartično plačilo trenutno ni na voljo. Izberite plačilo po povzetju ali bančno nakazilo."
          : "Demo različica ne izvede pravega plačila.") +
      "</p></div></div>" +
      '<div class="choice-list">' +
      (stripeReady
        ? choice("payment", "card", "Kartica", "Visa, Mastercard, Maestro", "Brez doplačila", true)
        : NK.live
          ? ""
          : choice("payment", "card", "Kartica", "Visa, Mastercard, Maestro", "Brez doplačila", true)) +
      choice("payment", "cod", "Plačilo po povzetju", "Plačate ob prevzemu", "+1,50 €", NK.live && !stripeReady) +
      choice("payment", "bank", "Bančno nakazilo", "Podatke prejmete po e-pošti", "Brez doplačila") +
      (stripeReady
        ? choice("payment", "stripe", "Stripe", "Varno kartično plačilo prek Stripe", "Brez doplačila")
        : "") +
      "</div>" +
      (stripeReady
        ? '<p class="checkout-stripe-note">' +
          ART.icon("lock", 16) +
          " Po oddaji naročila boste preusmerjeni na varno plačilno stran Stripe.</p>"
        : "") +
      "</section>" +
      '<label class="check check--terms"><input type="checkbox" name="terms" id="terms"><span>Strinjam se s <a href="info.html#pogoji" target="_blank" rel="noopener">splošnimi pogoji</a> in <a href="info.html#zasebnost" target="_blank" rel="noopener">politiko zasebnosti</a>.</span></label>' +
      '<p class="field__error" data-error="terms"></p>' +
      '<button class="btn btn--primary btn--lg btn--block" type="submit">' + ART.icon("lock", 18) + " Oddaj naročilo</button>" +
      '<p class="checkout-demo">' +
      (NK.live
        ? "Podatki se varno pošljejo strežniku trgovine in shranijo v bazo naročil."
        : "Demo: obrazec ne pošilja podatkov in ne izvede plačila.") +
      "</p>" +
      "</form>" +
      '<aside class="checkout-aside"><div class="summary-card" id="checkout-summary"></div></aside>' +
      "</div>";

    const form = $("#checkout-form");
    const summary = $("#checkout-summary");
    function currentOptions() {
      const delivery = form.querySelector('input[name="delivery"]:checked');
      const payment = form.querySelector('input[name="payment"]:checked');
      return {
        delivery: delivery ? delivery.value : "standard",
        payment: payment ? payment.value : "card"
      };
    }
    function renderSummary() {
      if (!summary) return;
      const options = currentOptions();
      const totals = NK.cartTotals(options);
      const items = NK.cartItems();
      const deliveryLabels = {
        standard: "Standardna dostava",
        express: "Hitra dostava",
        pickup: "Osebni prevzem"
      };
      const paymentLabels = {
        card: "Kartica",
        cod: "Plačilo po povzetju",
        bank: "Bančno nakazilo",
        stripe: "Stripe"
      };
      summary.innerHTML =
        '<h2>Vaše naročilo</h2><ul class="checkout-items">' +
        items
          .map(
            (item) =>
              '<li><span class="checkout-items__art">' + ART.product(item.product.art, item.product.palette, item.product.name) + '</span><span class="checkout-items__text"><strong>' + esc(item.product.name) + "</strong><small>" + item.qty + " × " + NK.money(item.product.price) + (item.color ? " · " + esc(item.color) : "") + "</small></span><strong>" + NK.money(item.lineTotal) + "</strong></li>"
          )
          .join("") +
        "</ul>" +
        '<div class="summary-row"><span>Vmesni seštevek</span><strong>' + NK.money(totals.subtotal) + "</strong></div>" +
        (totals.coupon ? '<div class="summary-row summary-row--discount"><span>Popust (' + esc(totals.coupon.code) + ")</span><strong>−" + NK.money(totals.discount) + "</strong></div>" : "") +
        '<div class="summary-row"><span>' + deliveryLabels[options.delivery] + "</span><strong>" + (totals.shipping === 0 ? "Brezplačno" : NK.money(totals.shipping)) + "</strong></div>" +
        (totals.fee ? '<div class="summary-row"><span>' + paymentLabels[options.payment] + "</span><strong>" + NK.money(totals.fee) + "</strong></div>" : "") +
        '<div class="summary-total"><span>Skupaj</span><strong>' + NK.money(totals.total) + "</strong></div>" +
        '<p class="summary-note">' + ART.icon("shield", 15) + (NK.live ? " Podatki so poslani varno in ostanejo zaupni." : " Podatki ostanejo v vašem brskalniku.") + "</p>";
    }
    form.addEventListener("change", renderSummary);
    renderSummary();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const checks = [
        ["email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.get("email") || "").trim()), "Vnesite veljaven e-poštni naslov."],
        ["name", String(data.get("name") || "").trim().length >= 2, "Vnesite ime in priimek."],
        ["phone", /^[+()\d\s/-]{6,}$/.test(String(data.get("phone") || "").trim()), "Vnesite veljaven telefonski številka."],
        ["address", String(data.get("address") || "").trim().length >= 4, "Vnesite naslov."],
        ["postal", /^\d{4}$/.test(String(data.get("postal") || "").trim()), "Vnesite štirimestno poštno številko."],
        ["city", String(data.get("city") || "").trim().length >= 2, "Vnesite kraj."],
        ["terms", data.get("terms") === "on", "Potrdite splošne pogoje."]
      ];
      let firstInvalid = null;
      checks.forEach(([name, valid, message]) => {
        const error = form.querySelector('[data-error="' + name + '"]');
        const input = form.querySelector('[name="' + name + '"]');
        if (error) {
          error.textContent = valid ? "" : message;
          error.classList.toggle("is-visible", !valid);
        }
        if (input) {
          input.setAttribute("aria-invalid", valid ? "false" : "true");
          if (!valid && !firstInvalid) firstInvalid = input;
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const options = currentOptions();
      const totals = NK.cartTotals(options);
      const items = NK.cartItems();
      if (NK.live) {
        submitLiveOrder(form, options, items, totals, data);
        return;
      }
      const now = new Date();
      const stamp =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");
      const order = {
        id: "NK-" + stamp + "-" + String(Math.floor(1000 + Math.random() * 9000)),
        createdAt: now.toISOString(),
        estimated: new Date(now.getTime() + 3 * 86400000).toISOString(),
        status: "new",
        customer: {
          email: String(data.get("email") || "").trim(),
          name: String(data.get("name") || "").trim(),
          phone: String(data.get("phone") || "").trim(),
          address: String(data.get("address") || "").trim(),
          postal: String(data.get("postal") || "").trim(),
          city: String(data.get("city") || "").trim(),
          note: String(data.get("note") || "").trim()
        },
        delivery: {
          method: options.delivery,
          label: { standard: "Standardna dostava", express: "Hitra dostava", pickup: "Osebni prevzem" }[options.delivery],
          price: totals.shipping
        },
        payment: {
          method: options.payment,
          label: {
            card: "Kartica",
            cod: "Plačilo po povzetju",
            bank: "Bančno nakazilo",
            stripe: "Stripe"
          }[options.payment],
          fee: totals.fee
        },
        items: items.map((item) => ({
          id: item.id,
          name: item.product.name,
          brand: item.product.brand,
          qty: item.qty,
          color: item.color,
          price: item.product.price,
          lineTotal: item.lineTotal
        })),
        totals: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          fee: totals.fee,
          total: totals.total,
          coupon: totals.coupon ? totals.coupon.code : ""
        }
      };
      NK.saveOrder(order);
      const stripeUrl =
        options.payment === "stripe" ? NK.stripeCheckoutUrl(order.id) : "";
      window.location.href = stripeUrl || "order.html";
    });

    form.addEventListener("input", (event) => {
      const input = event.target;
      if (!input.name) return;
      const error = form.querySelector('[data-error="' + input.name + '"]');
      if (error) {
        error.textContent = "";
        error.classList.remove("is-visible");
      }
      input.setAttribute("aria-invalid", "false");
    });
  }

  function submitLiveOrder(form, options, items, totals, data) {
    const submit = form.querySelector('button[type="submit"]');
    const label = submit ? submit.textContent : "";
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Pošiljam naročilo …";
    }
    const customer = {
      email: String(data.get("email") || "").trim(),
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      address: String(data.get("address") || "").trim(),
      postal: String(data.get("postal") || "").trim(),
      city: String(data.get("city") || "").trim(),
      note: String(data.get("note") || "").trim()
    };

    fetch(NK.api + "/orders", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          id: item.id,
          qty: item.qty,
          color: item.color || ""
        })),
        customer: customer,
        delivery: options.delivery,
        payment: options.payment,
        coupon: totals.coupon ? totals.coupon.code : ""
      })
    })
      .then((response) =>
        response
          .json()
          .catch(() => ({}))
          .then((body) => {
            if (!response.ok) {
              throw new Error(body.detail || "Naročila ni bilo mogoče oddati.");
            }
            return body;
          })
      )
      .then((body) => {
        NK.clearCart();
        try {
          window.localStorage.setItem("nakupko.last-order-token.v1", body.accessToken);
        } catch (error) {
          /* Storage may be blocked; the URL still carries the token. */
        }
        if (body.checkoutUrl) {
          window.location.href = body.checkoutUrl;
          return;
        }
        window.location.href =
          "order.html?id=" +
          encodeURIComponent(body.order.id) +
          "&token=" +
          encodeURIComponent(body.accessToken);
      })
      .catch((error) => {
        NK.toast(error.message || "Naročila ni bilo mogoče oddati.", "info");
        if (submit) {
          submit.disabled = false;
          submit.textContent = label;
        }
      });
  }

  function field(name, label, type, placeholder, autocomplete, message, extra) {
    return (
      '<div class="field"><label for="' + name + '">' + esc(label) + "</label>" +
      '<input id="' + name + '" name="' + name + '" type="' + type + '" placeholder="' + esc(placeholder) + '" autocomplete="' + autocomplete + '" ' + (extra || "") + ">" +
      '<p class="field__error" data-error="' + name + '"></p></div>'
    );
  }

  function choice(name, value, title, detail, price, checked) {
    return (
      '<label class="choice"><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + ">" +
      '<span class="choice__body"><span class="choice__title">' + esc(title) + "</span><span class=\"choice__detail\">" + esc(detail) + '</span></span><span class="choice__price">' + esc(price) + "</span></label>"
    );
  }

  /* -------------------------------------------------------------- wishlist */
  function initWishlist() {
    renderWishlist();
    document.addEventListener("nk:wishlist-change", renderWishlist);
  }

  function renderWishlist() {
    const root = $("#wishlist-root");
    if (!root) return;
    const items = NK.products.filter((product) => NK.isWishlisted(product.id));
    if (!items.length) {
      root.innerHTML = emptyState("Seznam želja je prazen", "Shranite izdelke, ki so vam všeč, in se vrnite k njim pozneje.", "category.html", "Odkrij izdelke");
      return;
    }
    root.innerHTML =
      '<div class="wishlist-head"><p class="muted">' + items.length + (items.length === 1 ? " shranjen izdelek" : items.length === 2 ? " shranjena izdelka" : items.length < 5 ? " shranjeni izdelki" : " shranjenih izdelkov") + "</p></div>" +
      productGrid(items);
  }

  /* ----------------------------------------------------------------- order */
  function lastOrderToken() {
    try {
      return window.localStorage.getItem("nakupko.last-order-token.v1") || "";
    } catch (error) {
      return "";
    }
  }

  function orderStatusLabel(status) {
    return {
      pending_payment: "Čaka plačilo",
      new: "Novo",
      approved: "Odobreno",
      shipped: "Poslano",
      cancelled: "Preklicano"
    }[status] || "Novo";
  }

  function initOrder() {
    const root = $("#order-root");
    if (!root) return;

    if (NK.live) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const token = params.get("token") || lastOrderToken();
      if (!id || !token) {
        root.innerHTML = emptyState(
          "Naročilo ni najdeno",
          "Povezava do naročila manjka ali ni več veljavna.",
          "category.html",
          "Začni nakupovati"
        );
        return;
      }
      root.innerHTML = '<p class="muted">Nalagam vaše naročilo …</p>';
      fetch(
        NK.api +
          "/orders/" +
          encodeURIComponent(id) +
          "?token=" +
          encodeURIComponent(token),
        { credentials: "same-origin" }
      )
        .then((response) => {
          if (!response.ok) throw new Error("not-found");
          return response.json();
        })
        .then((data) =>
          renderOrderPage(data.order, { live: true, token: token })
        )
        .catch(() => {
          root.innerHTML = emptyState(
            "Naročilo ni najdeno",
            "Povezava je potekla ali naročilo ne obstaja.",
            "category.html",
            "Začni nakupovati"
          );
        });
      return;
    }

    const order = NK.getLastOrder();
    if (!order) {
      root.innerHTML = emptyState("Naročilo ni najdeno", "V tem brskalniku še ni shranjenega naročila.", "category.html", "Začni nakupovati");
      return;
    }
    renderOrderPage(order, { live: false });
  }

  function renderOrderPage(order, options) {
    const root = $("#order-root");
    if (!root) return;
    const opts = options || {};
    const totals = order.totals || {};
    const created = new Date(order.createdAt);
    const estimated = order.estimated
      ? new Date(order.estimated)
      : new Date(created.getTime() + 3 * 86400000);
    const status = order.status || "new";
    const pendingPayment = opts.live && status === "pending_payment";
    const isBank =
      opts.live &&
      order.payment &&
      order.payment.method === "bank" &&
      order.paymentStatus !== "paid";
    const store = NK.store || {};

    let intro;
    if (!opts.live) {
      intro = "Vaše naročilo je zabeleženo. V demo trgovini e-poštno sporočilo ni poslano, podatki pa ostanejo v vašem brskalniku.";
    } else if (pendingPayment) {
      intro = "Naročilo je shranjeno, vendar plačilo še ni zaključeno. Lahko ga dokončate zdaj.";
    } else if (order.paymentStatus === "paid") {
      intro = "Plačilo je potrjeno. Potrditev naročila smo poslali na " + esc(order.customer.email) + ".";
    } else if (order.payment && order.payment.method === "cod") {
      intro = "Naročilo je prejeto. Znesek plačate ob prevzemu. Potrditev smo poslali na " + esc(order.customer.email) + ".";
    } else if (isBank) {
      intro = "Naročilo je prejeto. Znesek poravnate z bančnim nakazilom. Potrditev smo poslali na " + esc(order.customer.email) + ".";
    } else {
      intro = "Naročilo je prejeto. Podatke smo shranili v trgovini in jih bomo obdelali v najkrajšem času.";
    }

    document.title = "Hvala za naročilo | Nakupko";
    root.innerHTML =
      '<div class="order-success">' +
      '<span class="order-success__icon">' + ART.icon("check", 38) + "</span>" +
      '<p class="eyebrow">Naročilo ' + esc(order.id) + "</p>" +
      "<h1>Hvala za naročilo!</h1>" +
      "<p>" + intro + "</p>" +
      '<div class="order-meta">' +
      '<div><span>Datum</span><strong>' + NK.longDate(order.createdAt) + "</strong></div>" +
      '<div><span>Predvidena dostava</span><strong>' + NK.longDate(estimated) + "</strong></div>" +
      '<div><span>Status</span><strong>' + esc(orderStatusLabel(status)) + "</strong></div>" +
      '<div><span>Plačilo</span><strong>' + esc(order.payment ? order.payment.label : "Kartica") + "</strong></div>" +
      '<div><span>Dostava</span><strong>' + esc(order.delivery ? order.delivery.label : "Standardna dostava") + "</strong></div>" +
      "</div>" +
      '<div class="order-card"><h2>Povzetek</h2><ul class="order-items">' +
      (order.items || [])
        .map(
          (item) =>
            "<li><span><strong>" + esc(item.name) + "</strong><small>" + item.qty + " × " + NK.money(item.price) + (item.color ? " · " + esc(item.color) : "") + "</small></span><strong>" + NK.money(item.lineTotal) + "</strong></li>"
        )
        .join("") +
      "</ul>" +
      '<div class="summary-row"><span>Vmesni seštevek</span><strong>' + NK.money(totals.subtotal) + "</strong></div>" +
      (totals.discount ? '<div class="summary-row summary-row--discount"><span>Popust</span><strong>−' + NK.money(totals.discount) + "</strong></div>" : "") +
      '<div class="summary-row"><span>Dostava</span><strong>' + (totals.shipping ? NK.money(totals.shipping) : "Brezplačno") + "</strong></div>" +
      (totals.fee ? '<div class="summary-row"><span>Doplačilo za plačilo</span><strong>' + NK.money(totals.fee) + "</strong></div>" : "") +
      '<div class="summary-total"><span>Skupaj</span><strong>' + NK.money(totals.total) + "</strong></div></div>" +
      '<div class="order-address"><h2>Dostava na</h2><p>' + esc(order.customer.name) + "<br>" + esc(order.customer.address) + "<br>" + esc(order.customer.postal) + " " + esc(order.customer.city) + "<br>" + esc(order.customer.email) + "</p></div>" +
      (isBank
        ? '<div class="order-bank"><h2>Podatki za nakazilo</h2>' +
          (store.storeIban
            ? "<p>IBAN: <strong>" + esc(store.storeIban) + "</strong><br>Sklic: <strong>" + esc(order.id) + "</strong><br>Znesek: <strong>" + NK.money(totals.total) + "</strong><br>Prejemnik: <strong>" + esc(store.storeName || "Nakupko") + "</strong></p>"
            : "<p>Podatke za bančno nakazilo vam pošljemo po e-pošti.</p>") +
          "</div>"
        : "") +
      '<div class="order-actions">' +
      (pendingPayment
        ? '<button class="btn btn--primary" type="button" id="retry-payment">' + ART.icon("lock", 17) + " Dokončaj plačilo</button>"
        : "") +
      '<button class="btn btn--soft" type="button" id="print-order">' + ART.icon("arrow-right", 17) + " Natisni povzetek</button><a class=\"btn btn--primary\" href=\"category.html\">Nadaljuj z nakupovanjem</a></div>" +
      "</div>";

    const print = $("#print-order");
    if (print) print.addEventListener("click", () => window.print());

    const retry = $("#retry-payment");
    if (retry && opts.token) {
      retry.addEventListener("click", () => {
        retry.disabled = true;
        fetch(
          NK.api +
            "/orders/" +
            encodeURIComponent(order.id) +
            "/stripe?token=" +
            encodeURIComponent(opts.token),
          { method: "POST", credentials: "same-origin" }
        )
          .then((response) =>
            response
              .json()
              .catch(() => ({}))
              .then((body) => {
                if (!response.ok) {
                  throw new Error(body.detail || "Plačila ni mogoče začeti.");
                }
                return body;
              })
          )
          .then((body) => {
            if (body.checkoutUrl) window.location.href = body.checkoutUrl;
          })
          .catch((error) => {
            NK.toast(error.message, "info");
            retry.disabled = false;
          });
      });
    }
  }

  /* ------------------------------------------------------------------ info */
  function initInfo() {
    if (!NK.live) return;
    const store = NK.store || {};
    const money = (value) =>
      Number.isFinite(Number(value)) ? NK.money(Number(value)) : "";

    $$("[data-store-name]").forEach((el) => {
      el.textContent = store.storeName || "Nakupko";
    });

    $$("[data-store-email]").forEach((el) => {
      if (!store.storeEmail) return;
      el.textContent = store.storeEmail;
      if (el.tagName === "A") el.setAttribute("href", "mailto:" + store.storeEmail);
    });

    $$("[data-store-phone]").forEach((el) => {
      if (!store.storePhone) return;
      el.textContent = store.storePhone;
      if (el.tagName === "A") {
        el.setAttribute("href", "tel:" + store.storePhone.replace(/[^+\d]/g, ""));
      }
    });

    $$("[data-store-address]").forEach((el) => {
      if (store.storeAddress) el.textContent = store.storeAddress;
    });

    $$("[data-store-vat]").forEach((el) => {
      if (store.storeVat) el.textContent = store.storeVat;
    });

    $$("[data-store-iban]").forEach((el) => {
      el.textContent = store.storeIban || "—";
    });

    $$("[data-store-price]").forEach((el) => {
      const value = money(store[el.getAttribute("data-store-price")]);
      if (value) el.textContent = value;
    });
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    Promise.resolve(NK.ready).then(() => {
      NK.initGlobal();
      const page = document.body.getAttribute("data-page");
      if (page === "home") initHome();
      else if (page === "category") initCategory();
      else if (page === "search") initSearch();
      else if (page === "product") initProduct();
      else if (page === "cart") initCart();
      else if (page === "checkout") initCheckout();
      else if (page === "wishlist") initWishlist();
      else if (page === "order") initOrder();
      else if (page === "info") initInfo();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
