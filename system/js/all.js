/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Final Hardened & Optimized Version
   (Favorites Page Filter + Paging + Progress Bar + Popup + Quotes)
   ========================================================== */
(() => {
  "use strict";

  /* ---------------------------
     Utilities
     --------------------------- */
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const safeStr = (v) => (v == null ? "" : String(v));
  const rafAsync = () => new Promise((r) => requestAnimationFrame(r));
  const debounce = (fn, ms = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  /* ---------------------------
     Sort Mode Control
     --------------------------- */
  const getSortMode = () => localStorage.getItem("sortMode") || "sheet";
  document.addEventListener("sortModeChanged", () => {
    if (window.assetsData && typeof window.refreshCards === "function") {
      window.refreshCards();
    }
  });

  /* ---------------------------
     DOM & Config Initialization
     --------------------------- */
  function initElements() {
    const $ = (sel) => {
      try {
        if (!sel) return null;
        if (/^[A-Za-z0-9\-_]+$/.test(sel)) return document.getElementById(sel);
        return document.querySelector(sel) || null;
      } catch {
        return null;
      }
    };

    window.dom = {
      container: $("#container"),
      preloader: $("#preloader"),
      loaderImage: $("#loaderImage"),
      pageIndicator: $(".page-indicator") || $("#page-indicator"),
      searchInput: $("#searchInputHeader"),
      searchBtn: $("#searchBtnHeader"),
      updatePopup: $("#updatePopup"),
      updatePopupContent: $(".update-popup-content"),
      viewUpdateBtn: $("#viewUpdateBtn"),
      viewUpdateInfoBtn: $("#viewUpdateInfoBtn"),
      closeUpdateBtn: $("#closeUpdateBtn"),
      dontShowBtn: $("#dontShowBtn"),
      updateVideo: $("#updateVideo"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io./source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateTrailerSrc: "",
      updateLink: "system/pages/version-log.html",
    };
  }

  /* ---------------------------
     Favorites System
     --------------------------- */
  function initFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(stored.map((s) => safeStr(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = () =>
      localStorage.setItem("favorites", JSON.stringify([...window.favorites]));

    window.refreshCards = () => {
      if (!window.assetsData || typeof createAssetCards !== "function") return;
      const promises = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
      return promises;
    };
  }

  /* ---------------------------
     Preloader UI
     --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.dataset.hidden = "false";

    let counter = preloader.querySelector("#counter");
    let bar = preloader.querySelector(".load-progress-bar");
    let fill = preloader.querySelector(".load-progress-fill");

    if (!counter) {
      counter = document.createElement("div");
      counter.id = "counter";
      counter.className = "load-progress-text";
      preloader.appendChild(counter);
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "load-progress-bar";
      fill = document.createElement("div");
      fill.className = "load-progress-fill";
      bar.appendChild(fill);
      preloader.appendChild(bar);
    } else if (!fill) {
      fill = document.createElement("div");
      fill.className = "load-progress-fill";
      bar.appendChild(fill);
    }

    dom.loaderText = counter;
    dom.progressBarFill = fill;

    window.updateProgress = (p) => {
      const clamped = clamp(Math.round(p), 0, 100);
      counter.textContent = `${clamped}%`;
      fill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) =>
      (preloader.querySelector(".loading-text") || counter).textContent = text;

    window.hidePreloader = (force = false) => {
      if (preloader.dataset.hidden === "true") return;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };
  }

  /* ---------------------------
     Asset Card Builder
     --------------------------- */
  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return [];

    container.innerHTML = "";
    const imagePromises = [];
    const frag = document.createDocumentFragment();
    const sortMode = getSortMode();
    const isFav = (t) => window.favorites.has(safeStr(t).toLowerCase());

    let sorted = Array.isArray(data) ? [...data] : [];
    if (sortMode === "alphabetical") {
      sorted.sort((a, b) =>
        safeStr(a.title).localeCompare(safeStr(b.title), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    }

    for (const asset of sorted) {
      const title = safeStr(asset.title).trim();
      const author = safeStr(asset.author).trim();
      const imageSrc = safeStr(asset.image) || config.fallbackImage;
      const link = safeStr(asset.link) || config.fallbackLink;
      const pageNum = Number(asset.page) || 1;
      const status = safeStr(asset.status).toLowerCase();
      const gifFile = `${config.gifBase}${status}.gif`;

      const card = document.createElement("div");
      card.className = "asset-card";
      Object.assign(card.dataset, {
        title: title.toLowerCase(),
        author: author.toLowerCase(),
        page: String(pageNum),
        filtered: "true",
      });

      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "asset-link";

      const img = document.createElement("img");
      img.alt = title;
      img.loading = "eager";

      const imgPromise = new Promise((resolve) => {
        const tmp = new Image();
        tmp.onload = () => {
          img.src = imageSrc;
          resolve();
        };
        tmp.onerror = () => {
          img.src = config.fallbackImage;
          resolve();
        };
        tmp.src = imageSrc;
      });

      imagePromises.push({ promise: imgPromise, page: pageNum });
      a.appendChild(img);

      if (status === "soon" || status === "fix") {
        card.classList.add(status === "fix" ? "FIX" : "soon");
      } else if (["new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = gifFile;
        overlay.alt = `${status} badge`;
        overlay.className = `status-gif status-${status}`;
        a.appendChild(overlay);
      }

      const titleEl = document.createElement("h3");
      titleEl.textContent = title || "Untitled";
      const authorEl = document.createElement("p");
      authorEl.textContent = author || "";

      const star = document.createElement("button");
      star.className = "favorite-star";
      star.textContent = isFav(title) ? "★" : "☆";
      Object.assign(star.style, {
        background: "transparent",
        border: "none",
        cursor: "pointer",
      });
      star.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.textContent = window.favorites.has(key) ? "★" : "☆";
      });

      card.append(a, titleEl, authorEl, star);
      frag.appendChild(card);
    }

    container.appendChild(frag);
    return imagePromises;
  }

  /* ---------------------------
     Paging + Search + Filter
     --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    const quoteWrapper = document.getElementById("quoteWrapper");
    const getAllCards = () => [...container.querySelectorAll(".asset-card")];
    const getFilteredCards = () =>
      getAllCards().filter((c) => c.dataset.filtered === "true");
    const getPages = () =>
      [...new Set(getFilteredCards().map((c) => +c.dataset.page).filter((n) => !isNaN(n)))].sort((a, b) => a - b);

    function updateQuoteVisibility() {
      if (!quoteWrapper) return;
      const visibleCards = getFilteredCards().length;
      quoteWrapper.style.opacity = "1";
      quoteWrapper.style.pointerEvents = visibleCards === 0 ? "auto" : "none";
    }

    window.renderPage = () => {
      const pages = getPages();
      if (!pages.length) {
        window.currentPage = 1;
        getAllCards().forEach((c) => (c.style.display = "none"));
        pageIndicator && (pageIndicator.textContent = "No pages");
        updateQuoteVisibility();
        return;
      }

      const saved = +sessionStorage.getItem("currentPage") || pages[0];
      if (!window._pageRestored) {
        window.currentPage = pages.includes(saved) ? saved : pages[0];
        window._pageRestored = true;
      }

      getAllCards().forEach((c) => {
        const visible =
          +c.dataset.page === +window.currentPage &&
          c.dataset.filtered === "true";
        c.style.display = visible ? "" : "none";
      });

      const idx = pages.indexOf(+window.currentPage);
      pageIndicator &&
        (pageIndicator.textContent = `Page ${idx + 1} of ${pages.length}`);
      sessionStorage.setItem("currentPage", window.currentPage);
      updateQuoteVisibility();
    };

    window.filterAssets = (q) => {
      const query = safeStr(q).toLowerCase().trim();
      getAllCards().forEach((c) => {
        const match =
          !query ||
          c.dataset.title.includes(query) ||
          c.dataset.author.includes(query);
        c.dataset.filtered = match ? "true" : "false";
      });
      const pages = getPages();
      window.currentPage = pages[0] || 1;
      renderPage();
      updateQuoteVisibility();
    };

    window.prevPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const i = pages.indexOf(+window.currentPage);
      window.currentPage = i <= 0 ? pages.at(-1) : pages[i - 1];
      renderPage();
    };

    window.nextPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const i = pages.indexOf(+window.currentPage);
      window.currentPage =
        i === -1 || i === pages.length - 1 ? pages[0] : pages[i + 1];
      renderPage();
    };

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener(
      "input",
      debounce(() => filterAssets(searchInput.value), 200)
    );

    const saved = +sessionStorage.getItem("currentPage") || 1;
    window.currentPage = saved;
    renderPage();
  }

  /* ---------------------------
     Placeholder Cycle
     --------------------------- */
  function initPlaceholders() {
    const { searchInput } = dom || {};
    if (!searchInput) return;
    const FADE = 400, HOLD = 4000;

    const fadePlaceholder = (input, text, cb) => {
      input.classList.add("fade-out");
      setTimeout(() => {
        input.placeholder = text;
        input.classList.remove("fade-out");
        input.classList.add("fade-in");
        setTimeout(() => {
          input.classList.remove("fade-in");
          cb?.();
        }, FADE);
      }, FADE);
    };

    window.startPlaceholderCycle = () => {
      if (window._placeholderRunning) return;
      window._placeholderRunning = true;
      const loop = async () => {
        try {
          const visible = document.querySelectorAll(
            `.asset-card[data-filtered="true"][data-page="${window.currentPage}"]`
          ).length;
          await new Promise((r) =>
            fadePlaceholder(searchInput, `${visible} assets on this page`, r)
          );
          await delay(HOLD);
          await new Promise((r) =>
            fadePlaceholder(searchInput, "Search assets...", r)
          );
          await delay(HOLD);
          if (window._placeholderRunning) loop();
        } catch {
          window._placeholderRunning = false;
        }
      };
      loop();
    };

    window.stopPlaceholderCycle = () => (window._placeholderRunning = false);
  }

  /* ---------------------------
     Quotes Marquee (Merged Working Version)
     --------------------------- */
  function initQuotes() {
    const wrapper = document.getElementById("quoteWrapper");
    const box = document.getElementById("quoteBox");
    const jsonPath = "../system/json/quotes.json";

    if (!wrapper || !box) return;

    let quotes = [];
    let pos = 0;
    let speed = 120;
    let lastTime = null;

    async function loadQuotes() {
      try {
        const res = await fetch(jsonPath);
        const data = await res.json();
        quotes = Array.isArray(data) && data.length ? data : ["No quotes found"];
        start();
      } catch {
        quotes = ["⚠ Error loading quotes"];
        start();
      }
    }

    function setQuote() {
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      box.textContent = quote;
      pos = wrapper.offsetWidth;
      box.style.transform = `translateX(${pos}px)`;
    }

    function animate(t) {
      if (lastTime !== null) {
        const dt = (t - lastTime) / 1000;
        pos -= speed * dt;
        box.style.transform = `translateX(${pos}px)`;
        if (pos + box.offsetWidth < 0) setQuote();
      }
      lastTime = t;
      requestAnimationFrame(animate);
    }

    function start() {
      setQuote();
      requestAnimationFrame(animate);
    }

    loadQuotes();
  }

  /* ---------------------------
     Update Popup (Live from Sheets)
     --------------------------- */
  async function initUpdatePopup() {
    const p = dom.updatePopup;
    if (!p) return;

    const LS_HIDE = "ws_hideUpdate";
    const LS_VER = "ws_lastUpdateVersion";

    try {
      const res = await fetch(`${config.sheetUrl}?mode=version-message`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Version message fetch failed");

      const data = await res.json();
      const latest =
        Array.isArray(data) && data.length
          ? data[data.length - 1]
          : {
              version: "1.0.0",
              message: "New updates are live!",
              trailer: "",
              link: "",
            };

      const CURRENT_VERSION = latest.version || "1.0.0";
      const MESSAGE = latest.message || "Enjoy the latest update!";
      const TRAILER = latest.trailer || "";
      const LINK = latest.link || config.updateLink;

      const titleEl = p.querySelector("h2");
      const msgEl = p.querySelector("p");
      if (titleEl) titleEl.textContent = `Version ${CURRENT_VERSION} Update!`;
      if (msgEl) msgEl.textContent = MESSAGE;
      if (dom.updateVideo && TRAILER) dom.updateVideo.src = TRAILER;
      config.updateLink = LINK;

      const hidePref = localStorage.getItem(LS_HIDE);
      const lastVersion = localStorage.getItem(LS_VER);
      const hideForSession = sessionStorage.getItem(LS_HIDE);
      const shouldShow =
        (!hidePref && !hideForSession) || lastVersion !== CURRENT_VERSION;

      const footerVersion = document.getElementById("footerVersion");
      if (footerVersion)
        footerVersion.textContent = `Version ${CURRENT_VERSION}`;

      if (!shouldShow) return;
      localStorage.setItem(LS_VER, CURRENT_VERSION);

      setTimeout(() => p.classList.add("show"), 600);

      dom.viewUpdateBtn?.addEventListener("click", () => {
        window.open(LINK, "_self");
        p.classList.remove("show");
      });

      dom.viewUpdateInfoBtn?.addEventListener("click", () =>
        window.open(LINK, "_blank")
      );

      dom.closeUpdateBtn?.addEventListener("click", () => {
        sessionStorage.setItem(LS_HIDE, "1");
        p.classList.remove("show");
      });

      dom.dontShowBtn?.addEventListener("click", () => {
        localStorage.setItem(LS_HIDE, "1");
        p.classList.remove("show");
      });

      p.addEventListener("click", (e) => {
        if (e.target === p) {
          sessionStorage.setItem(LS_HIDE, "1");
          p.classList.remove("show");
        }
      });
    }
