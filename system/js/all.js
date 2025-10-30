/* ==========================================================
   WannaSmile | Unified Asset Loader v11.1 (Restored & Fixed)
   Features: Caching, Preloader, Paging, Favorites, Search
   ========================================================== */
(() => {
  "use strict";

  /* ---------------------------
  Utilities
  --------------------------- */
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const safeStr = (v) => (v == null ? "" : String(v));
  const debounce = (fn, ms = 180) => {
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
  let allAssetsFlat = []; // Cached flattened list of ALL assets from the sheet
  let currentPage = 1;
  let assetsByPage = {}; // Grouped assets for Paging mode
  let isSearchMode = false; // Flag to indicate if we're showing search results
  let isFavoritesPage = location.pathname.toLowerCase().includes("favorites");

  /* ---------------------------
  DOM / Config
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
      loaderText: null, // Will be set in initPreloader
      progressBarFill: null, // Will be set in initPreloader
      pageIndicator: $(".page-indicator") || $("#page-indicator"),
      nextBtn: $("#nextPage"),
      prevBtn: $("#prevPage"),
      searchInput: $("#searchInputHeader"),
      searchBtn: $("#searchBtnHeader"),
      updatePopup: $("#updatePopup"), // Restored from Old
      closeUpdateBtn: $("#closeUpdateBtn"), // Restored from Old
      dontShowBtn: $("#dontShowBtn"), // Restored from Old
      viewUpdateBtn: $("#viewUpdateBtn"), // Restored from Old
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io/source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateLink: "system/pages/version-log.html", // Restored from Old
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
  Preloader UI (Restored & Fixed)
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

    // The key change: ensure it always works and hides
    window.hidePreloader = async () => {
      const { preloader } = dom || {};
      if (!preloader || preloader.dataset.hidden === "true") return;

      isPreloaderActive = false;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      await delay(500);
      preloader.style.display = "none";
    };
  }

  /* ---------------------------
  Popup (session + "don't show again") (Restored)
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
  Card builder (Unified from Old & New)
  --------------------------- */
  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return;
    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    const sortMode = localStorage.getItem("sortMode") || "sheet"; // Allow sort

    let list = Array.isArray(data) ? [...data] : [];

    // Apply sorting
    if (sortMode === "alphabetical") {
      list.sort((a, b) =>
        safeStr(a.title).localeCompare(safeStr(b.title), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    }

    if (!list.length) {
      // Fallback Card
      const fallbackCard = document.createElement("div");
      fallbackCard.className = "asset-card fallback-card";
      fallbackCard.innerHTML = `
        <a href="${config.fallbackLink}" target="_blank" rel="noopener noreferrer">
          <img src="${config.fallbackImage}" alt="No assets available" loading="eager">
        </a>
        <h3>No assets available</h3>
      `;
      container.appendChild(fallbackCard);
      return;
    }

    const isFav = (t) => window.favorites.has(safeStr(t).toLowerCase());

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
        page: String(pageNum),
        title: title.toLowerCase(),
        author: author.toLowerCase(),
      });

      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "asset-link";

      const img = document.createElement("img");
      img.alt = title || "Untitled";
      img.loading = "eager";
      img.src = imageSrc;
      img.crossOrigin = "anonymous";
      img.onerror = () => {
        if (img.src !== config.fallbackImage) img.src = config.fallbackImage;
      };

      a.appendChild(img);

      // Status badges / classes
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
      // Apply clean styles for favorites page
      if (isFavoritesPage) {
        Object.assign(card.style, { background: "transparent", boxShadow: "none", border: "none" });
        Object.assign(star.style, {
          border: "none", background: "transparent", fontSize: "1.4em", color: "gold", cursor: "pointer"
        });
      } else {
        // Default styling for main pages
         Object.assign(star.style, {
          background: "transparent", border: "none", cursor: "pointer", fontSize: "20px", color: "#ffcc00",
        });
      }

      star.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.textContent = isFav(title) ? "★" : "☆";

        // If on the favorites page, immediately remove the card
        if (isFavoritesPage && !isFav(title)) {
          card.remove();
          // After removing, check if the page needs re-rendering if paging is used
          if (!isSearchMode) renderPage(currentPage);
        }
      });

      card.append(a, titleEl, authorEl, star);
      frag.appendChild(card);
    }

    container.appendChild(frag);
  }


  /* ---------------------------
  Grouping & Paging helpers (Fixed)
  --------------------------- */
  function groupAssetsForPaging(data) {
    assetsByPage = {};
    for (const asset of data) {
      const pageNum = parseInt(asset.page || 1) || 1;
      if (!assetsByPage[pageNum]) assetsByPage[pageNum] = [];
      assetsByPage[pageNum].push(asset);
    }
  }

  function getSortedPages() {
    return Object.keys(assetsByPage)
      .map((k) => +k)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);
  }

  /* ---------------------------
  Paging (Fixed for correct logic)
  --------------------------- */
  function initPaging() {
    const pageLabel = dom.pageIndicator;

    window.renderPage = (page = currentPage) => {
      if (isSearchMode) return; // Don't page in search mode

      const pages = getSortedPages();
      if (!pages.length) {
        if (pageLabel) pageLabel.textContent = "No pages";
        dom.container.innerHTML = "";
        createAssetCards([]); // Display fallback card
        return;
      }

      const maxPageNum = pages.at(-1) || 1;
      const minPageNum = pages[0] || 1;

      // Handle wrap-around based on page numbers, not array index
      if (page > maxPageNum) page = minPageNum;
      if (page < minPageNum) page = maxPageNum;

      currentPage = page;

      // 1. Get assets for the new current page
      const assets = assetsByPage[currentPage] || [];

      // 2. Clear container and build cards for the new page
      dom.container.innerHTML = "";
      createAssetCards(assets);

      // 3. Update indicator
      const currentIdx = pages.indexOf(currentPage);
      if (pageLabel) pageLabel.textContent = `Page ${currentIdx + 1} of ${pages.length}`;

      sessionStorage.setItem("currentPage", currentPage);
    };

    // Global navigation functions (used by buttons)
    window.nextPage = () => {
      const pages = getSortedPages();
      if (isSearchMode || !pages.length) return;
      const currentIdx = pages.indexOf(currentPage);
      const nextIdx = currentIdx === -1 || currentIdx === pages.length - 1 ? 0 : currentIdx + 1;
      renderPage(pages[nextIdx]);
    };

    window.prevPage = () => {
      const pages = getSortedPages();
      if (isSearchMode || !pages.length) return;
      const currentIdx = pages.indexOf(currentPage);
      const prevIdx = currentIdx <= 0 ? pages.length - 1 : currentIdx - 1;
      renderPage(pages[prevIdx]);
    };

    // Event listeners
    dom.nextBtn?.addEventListener("click", window.nextPage);
    dom.prevBtn?.addEventListener("click", window.prevPage);
  }

  /* ---------------------------
  Live search across all pages (Fixed and Unified)
  --------------------------- */
  function initLiveSearch() {
    const input = dom.searchInput;
    const btn = dom.searchBtn;
    if (!input) return;

    function applySearch() {
      const query = safeStr(input.value).toLowerCase().trim();

      if (!query) {
        // Clear search -> render current paging state
        isSearchMode = false;
        const savedPage = +sessionStorage.getItem("currentPage") || 1;
        renderPage(savedPage);
        return;
      }

      isSearchMode = true;
      const sourceList = isFavoritesPage ? allAssetsFlat.filter(a => window.favorites.has(safeStr(a.title).toLowerCase())) : allAssetsFlat;

      const filtered = sourceList.filter((a) => {
        const t = safeStr(a.title).toLowerCase();
        const auth = safeStr(a.author).toLowerCase();
        return t.includes(query) || auth.includes(query);
      });

      // Show filtered results as a single list (no paging)
      dom.container.innerHTML = ""; // Ensure container is clean before building
      createAssetCards(filtered);

      if (dom.pageIndicator) {
        dom.pageIndicator.textContent = `Search: ${filtered.length} result${
          filtered.length === 1 ? "" : "s"
        }`;
      }
    }

    input.addEventListener("input", debounce(applySearch, 180));
    btn?.addEventListener("click", applySearch);

    // Check if there's a saved search query on load
    const savedQuery = sessionStorage.getItem("searchQuery");
    if (savedQuery) {
      input.value = savedQuery;
      applySearch();
    }
  }

  /* ---------------------------
  loadAssets (Restored with Caching/Progress)
  --------------------------- */
  async function loadAssets(retry = false) {
    try {
      window.showLoading("Loading assets...");
      window.updateProgress(5);

      // --- 1. Cache Check ---
      const cached = sessionStorage.getItem(SESSION_KEY);
      const cachedVersion = sessionStorage.getItem(VERSION_KEY);

      if (cached && cachedVersion) {
        try {
          const dataCached = JSON.parse(cached);
          allAssetsFlat = dataCached;
          groupAssetsForPaging(allAssetsFlat);
          // Apply initial page or favorites filter before rendering
          const initialData = isFavoritesPage ? allAssetsFlat.filter(a => window.favorites.has(safeStr(a.title).toLowerCase())) : (assetsByPage[1] || []);
          createAssetCards(initialData);

          const savedPage = +sessionStorage.getItem("currentPage") || 1;
          if (!isFavoritesPage) window.renderPage(savedPage);

          window.updateProgress(40);
          await waitForRenderedImages(8000);
          window.updateProgress(100);
          await delay(200);
          await window.hidePreloader();
          // Background update check
          checkForUpdate(cachedVersion).catch(() => {});
          return;
        } catch (err) {
          console.warn("Cached assets invalid, refetching...", err);
        }
      }

      // --- 2. Fresh Fetch ---
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const json = await res.json();
      window.updateProgress(30);

      let version = safeStr(Date.now());
      let data = [];
      if (Array.isArray(json)) data = json;
      else if (Array.isArray(json.data)) {
        data = json.data;
        version = safeStr(json.version || Date.now());
      } else if (Array.isArray(json.assets)) {
        data = json.assets;
        version = safeStr(json.version || Date.now());
      } else if (Array.isArray(Object.values(json))) {
        for (const v of Object.values(json)) {
            if (Array.isArray(v)) {
              data = v;
              break;
            }
          }
      }

      const filtered = data.filter((i) => Object.values(i || {}).some((v) => safeStr(v).trim()));
      allAssetsFlat = filtered;

      // Store in session
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(filtered));
      sessionStorage.setItem(VERSION_KEY, version);

      // Group and render
      groupAssetsForPaging(allAssetsFlat);

      // Initial render: Favorites or Page 1
      const initialData = isFavoritesPage ? allAssetsFlat.filter(a => window.favorites.has(safeStr(a.title).toLowerCase())) : (assetsByPage[1] || []);
      createAssetCards(initialData);

      if (!isFavoritesPage) {
        const savedPage = +sessionStorage.getItem("currentPage") || 1;
        window.renderPage(savedPage);
      } else {
        // On favorites page, just show all filtered favorites without paging
        if (dom.pageIndicator) dom.pageIndicator.textContent = "Favorites";
      }

      window.updateProgress(65);

      // Wait for images
      await waitForRenderedImages(8000);
      window.updateProgress(100);
      await delay(200);
      await window.hidePreloader();

    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) {
        // Initial failure, retry once
        showLoading("Retrying to load assets...");
        return setTimeout(() => loadAssets(true), 1000);
      }
      // Hard failure
      window.showLoading("⚠ Failed to load assets.");
      createAssetCards([]); // Show fallback card
      await window.hidePreloader(); // MUST hide preloader even on failure
    }
  }

  /* ---------------------------
  waitForRenderedImages (Restored)
  --------------------------- */
  async function waitForRenderedImages(timeout = 8000) {
    if (!isPreloaderActive) return;
    try {
      window.showLoading("Optimizing images...");
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
  checkForUpdate (Restored)
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
  Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPreloader();
      initPopup(); // Restored
      initPaging(); // Sets up renderPage/nextPage/prevPage
      initLiveSearch(); // Sets up search

      await loadAssets();

      // Keyboard navigation (left/right)
      document.addEventListener("keydown", (e) => {
        if (dom.searchInput && document.activeElement === dom.searchInput) return; // Ignore if typing
        if (e.key === "ArrowLeft") window.prevPage && window.prevPage();
        if (e.key === "ArrowRight") window.nextPage && window.nextPage();
      });

      console.log("✅ WannaSmile Loader Ready (v11.1 - Fixed)");
    } catch (err) {
      console.error("Initialization failed:", err);
      window.showLoading("Initialization failed. Please reload.");
      window.hidePreloader();
    }
  });

  // Ensure assets fetch happens after window load if needed (fallback for slow DOMContentLoaded)
  window.addEventListener("load", () => {
    if (typeof loadAssets === "function" && !allAssetsFlat.length)
      setTimeout(() => loadAssets().catch(() => {}), 100);
  });
})();
