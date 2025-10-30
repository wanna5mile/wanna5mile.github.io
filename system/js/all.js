(() => {
  "use strict";

  /* ---------------------------
  Utilities
  --------------------------- */
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const safeStr = (v) => (v == null ? "" : String(v));
  const debounce = (fn, ms = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  /* ---------------------------
  Keys / State
  --------------------------- */
  const SESSION_KEY = "assetsDataCache";
  const VERSION_KEY = "assetsVersion";
  const FAV_KEY = "favorites";
  let isPreloaderActive = false;
  let currentPage = 1;
  let totalPages = 1;
  let assetsByPage = {};
  let allAssetsFlat = []; // cached flattened list for searches

  /* ---------------------------
  DOM + Config
  --------------------------- */
  function initElements() {
    const $ = (sel) => {
      try {
        if (!sel) return null;
        if (/^[A-Za-z0-9-_]+$/.test(sel)) return document.getElementById(sel);
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
      nextBtn: $("#nextPage"),
      prevBtn: $("#prevPage"),
      searchInput: $("#searchInputHeader"),
      searchBtn: $("#searchBtnHeader"),
      updatePopup: $("#updatePopup"),
      viewUpdateBtn: $("#viewUpdateBtn"),
      viewUpdateInfoBtn: $("#viewUpdateInfoBtn"),
      closeUpdateBtn: $("#closeUpdateBtn"),
      dontShowBtn: $("#dontShowBtn"),
      updateVideo: $("#updateVideo"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io/source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateLink: "system/pages/version-log.html",
    };
  }

  /* ---------------------------
  Toast helper
  --------------------------- */
  function showToast(msg, duration = 4000) {
    let toast = document.getElementById("toastNotify");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toastNotify";
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "10px 16px",
        background: "#222",
        color: "#fff",
        borderRadius: "8px",
        fontSize: "14px",
        zIndex: "9999",
        opacity: "0",
        transition: "opacity 0.3s ease",
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
      const stored = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      window.favorites = new Set(stored.map((s) => safeStr(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = () =>
      localStorage.setItem(FAV_KEY, JSON.stringify([...window.favorites]));
  }

  /* ---------------------------
  Preloader UI
  --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    isPreloaderActive = true;
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
      if (!isPreloaderActive || !dom.loaderText || !dom.progressBarFill) return;
      const clamped = clamp(Math.round(p), 0, 100);
      dom.loaderText.textContent = `${clamped}%`;
      dom.progressBarFill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) => {
      if (!isPreloaderActive) return;
      (preloader.querySelector(".loading-text") || dom.loaderText).textContent = text;
    };

    window.hidePreloader = () => {
      if (!isPreloaderActive || preloader.dataset.hidden === "true") return;
      isPreloaderActive = false;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };
  }

  /* ---------------------------
  Popup (session + "don't show again")
  --------------------------- */
  function initPopup() {
    const popup = dom.updatePopup;
    if (!popup) return;

    const closeBtn = dom.closeUpdateBtn;
    const dontShowBtn = dom.dontShowBtn;
    const viewBtn = dom.viewUpdateBtn;

    const hiddenThisSession = sessionStorage.getItem("popupHidden");
    const dontShow = localStorage.getItem("popupDontShow");

    if (dontShow === "true" || hiddenThisSession === "true") return;

    popup.classList.add("show");

    closeBtn?.addEventListener("click", () => {
      popup.classList.remove("show");
      sessionStorage.setItem("popupHidden", "true");
    });

    dontShowBtn?.addEventListener("click", () => {
      popup.classList.remove("show");
      localStorage.setItem("popupDontShow", "true");
    });

    viewBtn?.addEventListener("click", () => {
      window.location.href = config.updateLink;
    });
  }

  /* ---------------------------
  Card builder (status + fallback + star)
  --------------------------- */
  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return [];
    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    const sortMode = localStorage.getItem("sortMode") || "sheet";
    const isFav = (t) => window.favorites.has(safeStr(t).toLowerCase());

    let list = Array.isArray(data) ? [...data] : [];
    if (sortMode === "alphabetical") {
      list.sort((a, b) =>
        safeStr(a.title).localeCompare(safeStr(b.title), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    }

    if (!list.length) {
      const fallbackCard = document.createElement("div");
      fallbackCard.className = "asset-card fallback-card";
      fallbackCard.innerHTML = `
        <a href="${config.fallbackLink}" target="_blank" rel="noopener noreferrer">
          <img src="${config.fallbackImage}" alt="No assets available" loading="eager">
        </a>
        <h3>No assets available</h3>
      `;
      container.appendChild(fallbackCard);
      return [];
    }

    for (const asset of list) {
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
      img.alt = title || "Untitled";
      img.loading = "eager"; // explicit eager as requested
      img.src = imageSrc;
      img.crossOrigin = "anonymous";
      // fallback to 404 if the src exists but 404s
      img.onerror = () => {
        if (img.src !== config.fallbackImage) img.src = config.fallbackImage;
      };

      a.appendChild(img);

      // status badges / classes
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
      // Unstyled star: transparent background, no border
      Object.assign(star.style, {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "20px",
        color: "#ffcc00",
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
    return [];
  }

  /* ---------------------------
  Paging + Search (session-aware)
  --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    const getAllCards = () => [...container.querySelectorAll(".asset-card")];
    const getFilteredCards = () =>
      getAllCards().filter((c) => c.dataset.filtered === "true");
    const getPages = () =>
      [...new Set(getFilteredCards().map((c) => +c.dataset.page).filter((n) => !isNaN(n)))].sort(
        (a, b) => a - b
      );

    window.renderPage = () => {
      const pages = getPages();
      if (!pages.length) {
        window.currentPage = 1;
        getAllCards().forEach((c) => (c.style.display = "none"));
        pageIndicator && (pageIndicator.textContent = "No pages");
        return;
      }

      const saved = +sessionStorage.getItem("currentPage") || pages[0];

      if (!window._pageRestored) {
        window.currentPage = pages.includes(saved) ? saved : pages[0];
        window._pageRestored = true;
      }

      getAllCards().forEach((c) => {
        const visible = +c.dataset.page === +window.currentPage && c.dataset.filtered === "true";
        c.style.display = visible ? "" : "none";
      });

      const idx = pages.indexOf(+window.currentPage);
      pageIndicator && (pageIndicator.textContent = `Page ${idx + 1} of ${pages.length}`);

      sessionStorage.setItem("currentPage", window.currentPage);
    };

    window.filterAssets = (q) => {
      const query = safeStr(q).toLowerCase().trim();
      getAllCards().forEach((c) => {
        const match =
          !query || c.dataset.title.includes(query) || c.dataset.author.includes(query);
        c.dataset.filtered = match ? "true" : "false";
      });
      const pages = getPages();
      window.currentPage = pages[0] || 1;
      renderPage();
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
      window.currentPage = i === -1 || i === pages.length - 1 ? pages[0] : pages[i + 1];
      renderPage();
    };

    // live search
    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));

    // initial page
    const saved = +sessionStorage.getItem("currentPage") || 1;
    window.currentPage = saved;
    renderPage();
  }

  /* ---------------------------
  waitForRenderedImages (decode + paint)
  --------------------------- */
  async function waitForRenderedImages(timeout = 8000) {
    if (!isPreloaderActive) return;
    try {
      showLoading("Optimizing images...");
      await delay(50); // allow DOM to update
      const imgs = Array.from(document.querySelectorAll("#container img") || []);
      const decodes = imgs
        .filter((img) => img.src)
        .map((img) =>
          typeof img.decode === "function"
            ? Promise.race([img.decode(), new Promise((res) => setTimeout(res, timeout))]).catch(
                () => {}
              )
            : new Promise((res) => {
                if (img.complete && img.naturalWidth !== 0) return res();
                img.onerror = img.onload = () => res();
                // safety timeout
                setTimeout(res, timeout);
              })
        );

      await Promise.all(decodes);
      await new Promise((r) => requestAnimationFrame(r));
    } catch (e) {
      console.warn("waitForRenderedImages failed:", e);
    }
  }

  /* ---------------------------
  Grouping & Paging helpers (page from sheet)
  --------------------------- */
  function groupAssetsByPage(data) {
    assetsByPage = {};
    allAssetsFlat = Array.isArray(data) ? [...data] : [];
    for (const asset of allAssetsFlat) {
      const pageNum = parseInt(asset.page || 1) || 1;
      if (!assetsByPage[pageNum]) assetsByPage[pageNum] = [];
      assetsByPage[pageNum].push(asset);
    }
    totalPages = Math.max(1, Object.keys(assetsByPage).length);
  }

  /* ---------------------------
  loadAssets: supports both plain-array and {version,data}
  - session cache used (SESSION_KEY)
  - version stored (VERSION_KEY) if present
  - creates cards, groups by page, waits for decode
  --------------------------- */
  async function loadAssets(retry = false) {
    try {
      showLoading("Loading assets...");
      updateProgress(5);

      // session cache check
      const cached = sessionStorage.getItem(SESSION_KEY);
      const cachedVersion = sessionStorage.getItem(VERSION_KEY);
      if (cached && cachedVersion) {
        try {
          const dataCached = JSON.parse(cached);
          groupAssetsByPage(dataCached);
          // initially render page 1's cards (keeps paging logic)
          createAssetCards(assetsByPage[1] || []);
          if (typeof renderPage === "function") renderPage();
          updateProgress(40);
          // wait for images on cached DOM, then hide
          await waitForRenderedImages(8000);
          updateProgress(100);
          await delay(200);
          hidePreloader();
          // background update check
          checkForUpdate(cachedVersion).catch(() => {});
          return;
        } catch (err) {
          console.warn("Cached assets invalid, refetching...", err);
        }
      }

      // fresh fetch
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const json = await res.json();

      // Determine structure: plain array OR { version, data } OR { data: [...] }
      let version = safeStr(Date.now());
      let data = [];
      if (Array.isArray(json)) {
        data = json;
      } else if (Array.isArray(json.data)) {
        data = json.data;
        version = safeStr(json.version || Date.now());
      } else if (Array.isArray(json.assets)) {
        // support alternate key
        data = json.assets;
        version = safeStr(json.version || Date.now());
      } else {
        // if server returns object of rows (rare), try to pull values
        if (Array.isArray(Object.values(json))) {
          // fallback: try to find first array inside
          for (const v of Object.values(json)) {
            if (Array.isArray(v)) {
              data = v;
              break;
            }
          }
        }
      }

      // sanitize: keep only entries with any meaningful value
      const filtered = data.filter((i) => Object.values(i || {}).some((v) => safeStr(v).trim()));

      // store in session
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(filtered));
      sessionStorage.setItem(VERSION_KEY, version);

      // group and render
      groupAssetsByPage(filtered);
      // create first page content
      createAssetCards(assetsByPage[1] || []);
      if (typeof renderPage === "function") renderPage();
      updateProgress(65);

      // wait for images to decode (eager images) before hiding
      await waitForRenderedImages(8000);
      updateProgress(100);
      await delay(200);
      hidePreloader();
    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000);
      showLoading("⚠ Failed to load assets.");
      createAssetCards([]);
      hidePreloader();
    }
  }

  /* ---------------------------
  checkForUpdate: fetch version & notify if changed
  --------------------------- */
  async function checkForUpdate(localVersion) {
    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      const remoteVersion = safeStr(j.version || Date.now());
      if (remoteVersion !== localVersion) {
        showToast("⚡ New update available! Refresh to rebuild assets.");
      }
    } catch (e) {
      console.warn("Update check failed:", e);
    }
  }

  /* ---------------------------
  Live search across all pages (flattens)
  --------------------------- */
  function initLiveSearch() {
    const input = dom.searchInput;
    const btn = dom.searchBtn;
    if (!input) return;

    function applySearch() {
      const query = safeStr(input.value).toLowerCase().trim();
      if (!query) {
        // clear search -> render current paging state
        if (typeof renderPage === "function") renderPage();
        return;
      }

      const all = allAssetsFlat.slice(); // current cached
      const filtered = all.filter((a) => {
        const t = safeStr(a.title).toLowerCase();
        const auth = safeStr(a.author).toLowerCase();
        return t.includes(query) || auth.includes(query);
      });

      // show filtered results as a single list (no paging)
      createAssetCards(filtered);
      if (dom.pageIndicator)
        dom.pageIndicator.textContent = `Search: ${filtered.length} result${
          filtered.length === 1 ? "" : "s"
        }`;
    }

    input.addEventListener("input", debounce(applySearch, 180));
    btn?.addEventListener("click", applySearch);
  }

  /* ---------------------------
  Expose next/prev as globals (for inline onclick)
  --------------------------- */
  function exposeNavigation() {
    window.nextPage = function () {
      // wrap-around navigation using grouped pages
      const pages = Object.keys(assetsByPage)
        .map((k) => +k)
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      if (!pages.length) return;
      const idx = pages.indexOf(+currentPage);
      const next = idx === -1 || idx === pages.length - 1 ? pages[0] : pages[idx + 1];
      renderPage(next);
    };

    window.prevPage = function () {
      const pages = Object.keys(assetsByPage)
        .map((k) => +k)
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      if (!pages.length) return;
      const idx = pages.indexOf(+currentPage);
      const prev = idx <= 0 ? pages.at(-1) : pages[idx - 1];
      renderPage(prev);
    };
  }

  /* ---------------------------
  Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPreloader();
      initPopup();
      initPaging(); // sets up renderPage/filterAssets handlers used below
      exposeNavigation();

      await loadAssets();

      // prepare flattened cache for search after load
      // allAssetsFlat already set in groupAssetsByPage
      initLiveSearch();

      // also wire the inline header arrow buttons (if you prefer DOM-bound)
      dom.nextBtn?.addEventListener("click", () => window.nextPage());
      dom.prevBtn?.addEventListener("click", () => window.prevPage());

      // Optional: keyboard navigation (left/right)
      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") window.prevPage && window.prevPage();
        if (e.key === "ArrowRight") window.nextPage && window.nextPage();
      });

      console.log("✅ WannaSmile Loader Ready (v8)");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading("Initialization failed. Please reload.");
      hidePreloader();
    }
  });

  // ensure assets fetch happens after window load if needed (fallback)
  window.addEventListener("load", () => {
    if (typeof loadAssets === "function" && !allAssetsFlat.length)
      setTimeout(() => loadAssets().catch(() => {}), 100);
  });
})();
