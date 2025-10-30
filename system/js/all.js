/* ==========================================================
   WannaSmile | Unified Asset Loader v12.0
   Rewritten for robustness: reliable fetch/retry, decoding,
   session caching, paging, favorites, search, and graceful
   preloader handling.
   ========================================================== */
(() => {
  "use strict";

  /* ---------------------------
     Utilities
     --------------------------- */
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const safeStr = (v) => (v == null ? "" : String(v));
  const toLower = (s) => safeStr(s).toLowerCase();
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const noop = () => {};

  function debounce(fn, ms = 180) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  /* ---------------------------
     Keys / State
     --------------------------- */
  const SESSION_KEY = "assetsDataCache";
  const VERSION_KEY = "assetsVersion";
  const FAV_KEY = "favoritesWannaSmile";
  const POPUP_SESSION_KEY = "popupHidden";
  const POPUP_PERM_KEY = "popupDontShow";

  let isPreloaderActive = false;
  let allAssetsFlat = []; // flattened array of assets
  let assetsByPage = {};
  let currentPage = 1;
  let isSearchMode = false;
  let isFavoritesPage = typeof location !== "undefined" && location.pathname.toLowerCase().includes("favorites");
  const imageCache = new Map(); // caches HTMLImageElement by src

  /* ---------------------------
     DOM / Config
     --------------------------- */
  const dom = {};
  const config = {
    fallbackImage:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
    fallbackLink: "https://wanna5mile.github.io/source/dino/",
    gifBase:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
    sheetUrl:
      "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
    updateLink: "system/pages/version-log.html",
    fetchTimeout: 10_000,
    maxRetries: 2,
    backoffBase: 700,
  };

  function initElements() {
    const $ = (sel) => {
      if (!sel) return null;
      try {
        // allow passing plain id or full selector
        if (/^[A-Za-z0-9\-_]+$/.test(sel)) return document.getElementById(sel);
        return document.querySelector(sel) || null;
      } catch {
        return null;
      }
    };

    dom.container = $("#container");
    dom.preloader = $("#preloader");
    dom.pageIndicator = document.querySelector(".page-indicator") || $("#page-indicator");
    dom.nextBtn = $("#nextPage");
    dom.prevBtn = $("#prevPage");
    dom.searchInput = $("#searchInputHeader");
    dom.searchBtn = $("#searchBtnHeader");
    dom.updatePopup = $("#updatePopup");
    dom.closeUpdateBtn = $("#closeUpdateBtn");
    dom.dontShowBtn = $("#dontShowBtn");
    dom.viewUpdateBtn = $("#viewUpdateBtn");

    // progress nodes will be created if missing in initPreloader
    dom.loaderText = null;
    dom.progressBarFill = null;
  }

  /* ---------------------------
     Toast helper
     --------------------------- */
  function showToast(msg, duration = 4000) {
    if (typeof document === "undefined") return;
    let toast = document.getElementById("toastNotify");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toastNotify";
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "22px",
        right: "22px",
        padding: "10px 14px",
        background: "#222",
        color: "#fff",
        borderRadius: "8px",
        fontSize: "13px",
        zIndex: "99999",
        opacity: "0",
        transition: "opacity 0.24s ease",
        pointerEvents: "none",
      });
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => (toast.style.opacity = "0"), duration);
  }

  /* ---------------------------
     Favorites
     --------------------------- */
  function initFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      window.favorites = new Set(Array.isArray(arr) ? arr.map((s) => toLower(s)) : []);
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = () => {
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...window.favorites]));
      } catch (e) {
        console.warn("Failed to save favorites:", e);
      }
    };
  }

  /* ---------------------------
     Preloader UI
     --------------------------- */
  function initPreloader() {
    const pre = dom.preloader;
    if (!pre) return;

    isPreloaderActive = true;
    pre.style.display = "flex";
    pre.style.opacity = "1";
    pre.dataset.hidden = "false";

    // ensure loader text and progress exist
    let counter = pre.querySelector("#counter");
    let bar = pre.querySelector(".load-progress-bar");
    let fill = pre.querySelector(".load-progress-fill");

    if (!counter) {
      counter = document.createElement("div");
      counter.id = "counter";
      counter.className = "load-progress-text";
      pre.appendChild(counter);
    }

    if (!bar) {
      bar = document.createElement("div");
      bar.className = "load-progress-bar";
      fill = document.createElement("div");
      fill.className = "load-progress-fill";
      bar.appendChild(fill);
      pre.appendChild(bar);
    } else if (!fill) {
      fill = document.createElement("div");
      fill.className = "load-progress-fill";
      bar.appendChild(fill);
    }

    dom.loaderText = counter;
    dom.progressBarFill = fill;

    window.updateProgress = (p) => {
      if (!isPreloaderActive || !dom.loaderText || !dom.progressBarFill) return;
      const value = clamp(Math.round(Number(p) || 0), 0, 100);
      dom.loaderText.textContent = `${value}%`;
      dom.progressBarFill.style.width = `${value}%`;
    };

    window.showLoading = (text) => {
      if (!isPreloaderActive || !dom.loaderText) return;
      dom.loaderText.textContent = text;
    };

    window.hidePreloader = async () => {
      if (!pre || pre.dataset.hidden === "true") return;
      isPreloaderActive = false;
      pre.dataset.hidden = "true";
      pre.style.transition = "opacity 0.45s ease";
      pre.style.opacity = "0";
      pre.style.pointerEvents = "none";
      // ensure display toggled even if transition doesn't run
      await delay(520);
      try {
        pre.style.display = "none";
      } catch {}
    };
  }

  /* ---------------------------
     Popup (session + "don't show again")
     --------------------------- */
  function initPopup() {
    const popup = dom.updatePopup;
    if (!popup) return;

    try {
      const wasHiddenSession = sessionStorage.getItem(POPUP_SESSION_KEY) === "true";
      const dontShow = localStorage.getItem(POPUP_PERM_KEY) === "true";
      if (wasHiddenSession || dontShow) return;

      popup.classList.add("show");

      dom.closeUpdateBtn?.addEventListener("click", () => {
        popup.classList.remove("show");
        try {
          sessionStorage.setItem(POPUP_SESSION_KEY, "true");
        } catch {}
      });

      dom.dontShowBtn?.addEventListener("click", () => {
        popup.classList.remove("show");
        try {
          localStorage.setItem(POPUP_PERM_KEY, "true");
        } catch {}
      });

      dom.viewUpdateBtn?.addEventListener("click", () => {
        window.location.href = config.updateLink;
      });
    } catch (e) {
      // never break page if popup errors
      console.warn("Popup init error:", e);
    }
  }

  /* ---------------------------
     Card builder
     --------------------------- */
  function createFallbackCard() {
    const card = document.createElement("div");
    card.className = "asset-card fallback-card";
    card.innerHTML = `
      <a href="${config.fallbackLink}" target="_blank" rel="noopener noreferrer">
        <img src="${config.fallbackImage}" alt="No assets available" loading="eager">
      </a>
      <h3>No assets available</h3>
    `;
    return card;
  }

  function createAssetCard(asset) {
    const title = safeStr(asset.title).trim() || "Untitled";
    const author = safeStr(asset.author).trim() || "";
    const imageSrc = safeStr(asset.image) || config.fallbackImage;
    const link = safeStr(asset.link) || config.fallbackLink;
    const pageNum = Number(asset.page) || 1;
    const status = toLower(asset.status);
    const gifFile = `${config.gifBase}${status}.gif`;

    const card = document.createElement("div");
    card.className = "asset-card";
    card.dataset.page = String(pageNum);
    card.dataset.title = title.toLowerCase();
    card.dataset.author = author.toLowerCase();

    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "asset-link";

    const img = document.createElement("img");
    img.alt = title;
    img.loading = "eager";
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    // fast-path to use cached Image element if available
    if (imageCache.has(imageSrc)) {
      const cached = imageCache.get(imageSrc);
      // clone node to avoid DOM reuse side-effects
      try {
        const clone = cached.cloneNode();
        img.src = clone.src;
      } catch {
        img.src = imageSrc;
      }
    } else {
      img.src = imageSrc;
      // attempt to add to cache when decoded or loaded
      const storeImg = () => {
        try {
          if (!imageCache.has(imageSrc)) {
            const copy = new Image();
            copy.src = img.src;
            imageCache.set(imageSrc, copy);
          }
        } catch {}
      };
      img.addEventListener("load", storeImg, { once: true });
      img.addEventListener("error", () => {
        if (img.src !== config.fallbackImage) img.src = config.fallbackImage;
        storeImg();
      }, { once: true });
    }

    a.appendChild(img);

    // status badges
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
    titleEl.textContent = title;
    const authorEl = document.createElement("p");
    authorEl.textContent = author;

    const star = document.createElement("button");
    star.className = "favorite-star";
    const isFav = window.favorites.has(title.toLowerCase());
    star.textContent = isFav ? "★" : "☆";

    // Styles are intentionally minimal here; keep logic separate from CSS
    star.style.cursor = "pointer";
    star.style.background = "transparent";
    star.style.border = "none";
    star.style.fontSize = "20px";

    star.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = title.toLowerCase();
      if (window.favorites.has(key)) window.favorites.delete(key);
      else window.favorites.add(key);
      window.saveFavorites();
      star.textContent = window.favorites.has(key) ? "★" : "☆";
      // If on favorites page and removed, drop the card immediately
      if (isFavoritesPage && !window.favorites.has(key)) {
        card.remove();
      }
    });

    card.append(a, titleEl, authorEl, star);
    return card;
  }

  function createAssetCards(data = []) {
    if (!dom.container) return;
    dom.container.innerHTML = "";
    const frag = document.createDocumentFragment();

    const list = Array.isArray(data) ? data.slice() : [];

    // sort mode support (simple; extendable)
    const sortMode = localStorage.getItem("sortMode") || "sheet";
    if (sortMode === "alphabetical") {
      list.sort((a, b) => safeStr(a.title).localeCompare(safeStr(b.title), undefined, { numeric: true, sensitivity: "base" }));
    }

    if (!list.length) {
      frag.appendChild(createFallbackCard());
      dom.container.appendChild(frag);
      return;
    }

    for (const asset of list) {
      const card = createAssetCard(asset);
      frag.appendChild(card);
    }
    dom.container.appendChild(frag);
  }

  /* ---------------------------
     Grouping & Paging
     --------------------------- */
  function groupAssetsForPaging(list = []) {
    assetsByPage = {};
    for (const a of list) {
      const p = Number(a.page) || 1;
      if (!assetsByPage[p]) assetsByPage[p] = [];
      assetsByPage[p].push(a);
    }
  }

  function getSortedPages() {
    return Object.keys(assetsByPage).map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  }

  /* ---------------------------
     Paging controller
     --------------------------- */
  function initPaging() {
    window.renderPage = (page = currentPage) => {
      if (isSearchMode) return;
      const pages = getSortedPages();
      if (!pages.length) {
        if (dom.pageIndicator) dom.pageIndicator.textContent = "No pages";
        createAssetCards([]);
        return;
      }

      // if requested page doesn't exist, default to first/closest page
      if (!pages.includes(page)) {
        page = pages[0];
      }

      currentPage = page;
      const assets = assetsByPage[currentPage] || [];
      createAssetCards(assets);

      // update indicator
      if (dom.pageIndicator) {
        const idx = pages.indexOf(currentPage);
        dom.pageIndicator.textContent = `Page ${idx + 1} of ${pages.length}`;
      }

      try {
        sessionStorage.setItem("currentPage", String(currentPage));
      } catch {}
    };

    window.nextPage = () => {
      if (isSearchMode) return;
      const pages = getSortedPages();
      if (!pages.length) return;
      const idx = pages.indexOf(currentPage);
      const nextIdx = idx === -1 || idx === pages.length - 1 ? 0 : idx + 1;
      window.renderPage(pages[nextIdx]);
    };

    window.prevPage = () => {
      if (isSearchMode) return;
      const pages = getSortedPages();
      if (!pages.length) return;
      const idx = pages.indexOf(currentPage);
      const prevIdx = idx <= 0 ? pages.length - 1 : idx - 1;
      window.renderPage(pages[prevIdx]);
    };

    dom.nextBtn?.addEventListener("click", () => window.nextPage());
    dom.prevBtn?.addEventListener("click", () => window.prevPage());
  }

  /* ---------------------------
     Live search
     --------------------------- */
  function initLiveSearch() {
    const input = dom.searchInput;
    const btn = dom.searchBtn;
    if (!input) return;

    async function applySearch() {
      const raw = toLower(input.value).trim();
      try {
        sessionStorage.setItem("searchQuery", raw);
      } catch {}
      if (!raw) {
        isSearchMode = false;
        const savedPage = Number(sessionStorage.getItem("currentPage")) || 1;
        window.renderPage(savedPage);
        return;
      }

      isSearchMode = true;
      const source = isFavoritesPage ? allAssetsFlat.filter((a) => window.favorites.has(toLower(a.title))) : allAssetsFlat;
      const filtered = source.filter((a) => {
        const t = toLower(a.title);
        const auth = toLower(a.author);
        return t.includes(raw) || auth.includes(raw);
      });

      createAssetCards(filtered);
      if (dom.pageIndicator) dom.pageIndicator.textContent = `Search: ${filtered.length} result${filtered.length === 1 ? "" : "s"}`;
    }

    input.addEventListener("input", debounce(applySearch, 180));
    btn?.addEventListener("click", applySearch);

    const savedQuery = sessionStorage.getItem("searchQuery");
    if (savedQuery) {
      input.value = savedQuery;
      // run on next tick so DOM has initialized
      setTimeout(() => applySearch(), 100);
    }
  }

  /* ---------------------------
     Image stabilization: wait for images to decode or load
     --------------------------- */
  async function waitForRenderedImages(timeout = 8000) {
    if (!isPreloaderActive) return;
    try {
      window.showLoading("Optimizing images...");
      await delay(30);
      const imgs = Array.from(document.querySelectorAll("#container img") || []);
      const tasks = imgs.map((img) => {
        if (!img.src) return Promise.resolve();
        if (typeof img.decode === "function") {
          return Promise.race([
            img.decode(),
            new Promise((res) => setTimeout(res, timeout)),
          ]).catch(() => {});
        } else if (img.complete && img.naturalWidth !== 0) {
          return Promise.resolve();
        } else {
          return new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
            setTimeout(res, timeout);
          });
        }
      });
      await Promise.all(tasks);
      await new Promise((r) => requestAnimationFrame(r));
    } catch (e) {
      console.warn("waitForRenderedImages error:", e);
    }
  }

  /* ---------------------------
     Robust fetch with timeout and retries
     --------------------------- */
  async function fetchWithTimeout(url, opts = {}, timeout = config.fetchTimeout, retries = 0) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(id);
      if (retries > 0) {
        const backoff = config.backoffBase * (config.maxRetries - retries + 1);
        await delay(backoff);
        return fetchWithTimeout(url, opts, timeout, retries - 1);
      }
      throw err;
    }
  }

  /* ---------------------------
     Try to interpret various JSON shapes from sheet
     --------------------------- */
  function normalizeSheetJson(json) {
    // Accepts array, {data:[]}, {assets:[]}, or object with nested arrays
    if (Array.isArray(json)) return json.filter(Boolean);
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.assets)) return json.assets;
    // find first array in values
    const vals = Object.values(json || {});
    for (const v of vals) {
      if (Array.isArray(v)) return v;
    }
    return [];
  }

  /* ---------------------------
     Check remote version for updates (non-blocking)
     --------------------------- */
  async function checkForUpdate(localVersion) {
    try {
      const res = await fetchWithTimeout(config.sheetUrl, { cache: "no-store" }, 8_000, 1);
      if (!res) return;
      const j = await res.json().catch(() => null);
      if (!j) return;
      const remoteVersion = safeStr(j.version || Date.now());
      if (remoteVersion && localVersion && remoteVersion !== localVersion) {
        showToast("⚡ New update available! Refresh to rebuild assets.");
      }
    } catch (e) {
      // ignore errors here
      console.warn("Update check failed:", e);
    }
  }

  /* ---------------------------
     Load assets: main entry point
     --------------------------- */
  async function loadAssets(forceRefresh = false) {
    try {
      window.showLoading?.("Loading assets...");
      window.updateProgress?.(5);

      // Attempt to load from session cache first unless forced
      if (!forceRefresh) {
        try {
          const raw = sessionStorage.getItem(SESSION_KEY);
          const ver = sessionStorage.getItem(VERSION_KEY);
          if (raw && ver) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allAssetsFlat = parsed;
              groupAssetsForPaging(allAssetsFlat);

              const initialData = isFavoritesPage ? allAssetsFlat.filter((a) => window.favorites.has(toLower(a.title))) : (assetsByPage[1] || []);
              createAssetCards(initialData);

              const savedPage = Number(sessionStorage.getItem("currentPage")) || 1;
              if (!isFavoritesPage) window.renderPage(savedPage);
              window.updateProgress?.(40);

              // Wait and then hide preloader
              await waitForRenderedImages(6_000);
              window.updateProgress?.(100);
              await delay(200);
              await window.hidePreloader();
              // background update check
              checkForUpdate(ver).catch(noop);
              return;
            }
          }
        } catch (e) {
          console.warn("Cache read failed, will fetch fresh:", e);
        }
      }

      // Fresh fetch (with retries)
      window.updateProgress?.(12);
      const res = await fetchWithTimeout(config.sheetUrl, { cache: "no-store" }, config.fetchTimeout, config.maxRetries);
      window.updateProgress?.(30);
      const json = await res.json().catch(() => null);
      if (!json) throw new Error("Invalid JSON from sheet");

      let version = safeStr(json.version || Date.now());
      let data = normalizeSheetJson(json);
      data = Array.isArray(data) ? data.filter((i) => {
        // keep objects with at least one non-empty property
        if (!i) return false;
        if (isObj(i)) {
          return Object.values(i).some((v) => safeStr(v).trim().length > 0);
        }
        return Boolean(safeStr(i));
      }) : [];

      allAssetsFlat = data;
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(allAssetsFlat));
        sessionStorage.setItem(VERSION_KEY, version);
      } catch (e) {
        console.warn("Failed to write session cache:", e);
      }

      groupAssetsForPaging(allAssetsFlat);

      // initial render
      const initialData = isFavoritesPage ? allAssetsFlat.filter((a) => window.favorites.has(toLower(a.title))) : (assetsByPage[1] || []);
      createAssetCards(initialData);

      if (!isFavoritesPage) {
        const savedPage = Number(sessionStorage.getItem("currentPage")) || 1;
        window.renderPage(savedPage);
      } else {
        if (dom.pageIndicator) dom.pageIndicator.textContent = "Favorites";
      }

      window.updateProgress?.(65);
      await waitForRenderedImages(8_000);
      window.updateProgress?.(100);
      await delay(200);
      await window.hidePreloader();
    } catch (err) {
      console.error("loadAssets error:", err);
      // make a single retry attempt if network-like error
      if (!loadAssets.__retryed) {
        loadAssets.__retryed = true;
        try {
          window.showLoading?.("Retrying to load assets...");
          await delay(900);
          return loadAssets(true);
        } catch {}
      }

      // final failure path: show fallback and hide preloader
      window.showLoading?.("⚠ Failed to load assets.");
      createAssetCards([]);
      await window.hidePreloader();
    } finally {
      // reset retry flag for future manual refreshes
      loadAssets.__retryed = false;
    }
  }

  /* ---------------------------
     Boot & keyboard
     --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPreloader();
      initPopup();
      initPaging();
      initLiveSearch();

      // Kick off load (do not await if you prefer progressive render — here we await to coordinate preloader)
      await loadAssets();

      // keyboard nav
      document.addEventListener("keydown", (e) => {
        if (dom.searchInput && document.activeElement === dom.searchInput) return;
        if (e.key === "ArrowLeft") window.prevPage && window.prevPage();
        if (e.key === "ArrowRight") window.nextPage && window.nextPage();
      });

      console.log("✅ WannaSmile Loader Ready (v12.0)");
    } catch (e) {
      console.error("Initialization failed:", e);
      try {
        window.showLoading?.("Initialization failed. Please reload.");
        await window.hidePreloader();
      } catch {}
    }
  });

  // Fallback to ensure assets are attempted again after full load for edge-cases
  window.addEventListener("load", () => {
    if (typeof loadAssets === "function" && !allAssetsFlat.length) {
      setTimeout(() => {
        loadAssets().catch((e) => console.warn("Delayed loadAssets error:", e));
      }, 150);
    }
  });

  /* ---------------------------
     Public helper: force refresh (exposed for debugging)
     --------------------------- */
  window.WannaSmile = {
    reloadAssets: async (force = true) => {
      try {
        if (force) {
          try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(VERSION_KEY); } catch {}
        }
        await loadAssets(force);
      } catch (e) {
        console.warn("WannaSmile.reloadAssets error:", e);
      }
    },
    clearImageCache: () => imageCache.clear(),
  };
})();
