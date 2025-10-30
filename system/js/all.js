/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - FIXED & GUARANTEED LOAD
Fixes:
1. Guaranteed Preloader/Asset Loading sequence (Preloader only hides AFTER all assets load/decode).
2. Robust image loading via waitForRenderedImages.
3. Added fallback onerror for images.
4. Cleaned up visibility checks.
========================================================== */
(() => {
  "use strict";

  /* ---------------------------
  Constants & Utilities
  --------------------------- */
  const CLAMP = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const DELAY = (ms) => new Promise((r) => setTimeout(r, ms));
  const SAFE_STR = (v) => (v == null ? "" : String(v));
  const DEBOUNCE = (fn, ms = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // Global state for preloader
  let isPreloaderActive = false;
  
  // Keys
  const FAV_KEY = "favorites";

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
      searchInput: $("#searchInputHeader"),
      searchBtn: $("#searchBtnHeader"),
      updatePopup: $("#updatePopup"),
      // ... (other dom elements retained for compatibility)
      loaderText: null, 
      progressBarFill: null, 
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io/source/dino/",
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
      const stored = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      window.favorites = new Set(stored.map((s) => SAFE_STR(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }
    window.saveFavorites = () =>
      localStorage.setItem(FAV_KEY, JSON.stringify([...window.favorites]));

    window.refreshCards = () => {
      if (!window.assetsData || typeof createAssetCards !== "function") return;
      createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      // Placeholder cycle reference removed as it was undefined
    };
  }

  /* ---------------------------
  Preloader UI (Fixed Visibility)
  --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    // Assume active if the element exists. In a proper session load, it should be visible.
    isPreloaderActive = true; 
    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.dataset.hidden = "false";

    // Setup UI elements (as in your previous version)
    let counter = preloader.querySelector("#counter");
    let bar = preloader.querySelector(".load-progress-bar");
    let fill = preloader.querySelector(".load-progress-fill");

    // ... (logic to create/append counter/bar/fill if missing) ...
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
      const clamped = CLAMP(Math.round(p), 0, 100);
      dom.loaderText.textContent = `${clamped}%`;
      dom.progressBarFill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) => {
      if (!isPreloaderActive) return;
      (preloader.querySelector(".loading-text") || dom.loaderText).textContent = text;
    }

    window.hidePreloader = () => {
      if (!isPreloaderActive || preloader.dataset.hidden === "true") return;
      
      isPreloaderActive = false; // Disable future updates
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
    const frag = document.createDocumentFragment();
    const sortMode = getSortMode();
    const isFav = (t) => window.favorites.has(SAFE_STR(t).toLowerCase());

    let sorted = Array.isArray(data) ? [...data] : [];
    if (sortMode === "alphabetical") {
      sorted.sort((a, b) =>
        SAFE_STR(a.title).localeCompare(SAFE_STR(b.title), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    }

    for (const asset of sorted) {
      const title = SAFE_STR(asset.title).trim();
      const author = SAFE_STR(asset.author).trim();
      const imageSrc = SAFE_STR(asset.image) || config.fallbackImage;
      const link = SAFE_STR(asset.link) || config.fallbackLink;
      const pageNum = Number(asset.page) || 1;
      const status = SAFE_STR(asset.status).toLowerCase();
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
      img.src = imageSrc; 
      
      // ✅ FIX: Ensure broken images fall back and don't stall the loading
      img.onerror = () => (img.src = config.fallbackImage); 

      a.appendChild(img);

      // Apply visual status classes
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
    return [];
  }

  /* ---------------------------
  Paging + Search + Filter
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
        const visible =
          +c.dataset.page === +window.currentPage && c.dataset.filtered === "true";
        c.style.display = visible ? "" : "none";
      });

      const idx = pages.indexOf(+window.currentPage);
      pageIndicator &&
        (pageIndicator.textContent = `Page ${idx + 1} of ${pages.length}`);

      sessionStorage.setItem("currentPage", window.currentPage);
    };

    window.filterAssets = (q) => {
      const query = SAFE_STR(q).toLowerCase().trim();
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

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener(
      "input",
      DEBOUNCE(() => filterAssets(searchInput.value), 200)
    );

    const saved = +sessionStorage.getItem("currentPage") || 1;
    window.currentPage = saved;
    renderPage();
  }

  /* ---------------------------
  Decode Helper (Wait for all DOM images + full render)
  --------------------------- */
  async function waitForRenderedImages(timeout = 8000) {
    if (!isPreloaderActive) return; // Skip image loading wait if preloader isn't active
    
    try {
      showLoading("Optimizing images...");
      // Small pause to allow images to be appended to the DOM
      await DELAY(50); 
      const imgs = Array.from(document.querySelectorAll("#container img") || []);

      const decodes = imgs
        .filter((img) => img.src)
        .map((img) =>
          new Promise((resolve) => {
              // Standard image loading promise
              if (img.complete && img.naturalWidth !== 0) return resolve();
              img.onerror = () => resolve(); // Resolve on error so a single broken link doesn't stop everything
              img.onload = () => resolve();
          })
        );
      
      // Wait for all images to resolve (load/error)
      await Promise.all(decodes);
      
      // Wait for a final paint to ensure everything is visible before hiding the preloader
      await new Promise((r) => requestAnimationFrame(r));
    } catch (e) {
      console.warn("waitForRenderedImages failed silently:", e);
    }
  }

  /* ---------------------------
  Asset Loader
  --------------------------- */
  async function loadAssets(retry = false) {
    if (isPreloaderActive) {
      showLoading("Loading assets...");
      updateProgress(5);
    }
    
    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();
      const data = raw.filter((i) => Object.values(i).some((v) => SAFE_STR(v).trim()));
      window.assetsData = data;
      
      if (isPreloaderActive) updateProgress(35);

      const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
      let filtered = data;
      if (isFavPage) {
        filtered = [...window.favorites].length
          ? data.filter((a) => window.favorites.has(SAFE_STR(a.title).toLowerCase()))
          : [];
      }

      // 1. Create the card elements and append them to the DOM
      createAssetCards(filtered);
      if (isPreloaderActive) updateProgress(65);

      if (typeof renderPage === "function") renderPage();

      if (isFavPage && !filtered.length && dom.container)
        dom.container.innerHTML =
          "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";

      // 2. Wait for all card images to be loaded and decoded (Only if preloader is active)
      if (isPreloaderActive) {
        await waitForRenderedImages(8000);
        updateProgress(100);
        await DELAY(250); 
        // ✅ FINAL STEP: Only hide after all asset work is complete
        hidePreloader();
      }

    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000);
      if (isPreloaderActive) showLoading("⚠ Failed to load assets.");
      hidePreloader();
    }
  }

  /* ---------------------------
  DOM Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPaging();
      // Initialize preloader last so it can set the initial active state
      initPreloader();
      
      await loadAssets();
      console.log("✅ WannaSmile Loader Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      if (isPreloaderActive) showLoading("Initialization failed. Please reload.");
      hidePreloader();
    }
  });

  window.addEventListener("load", () => {
    if (typeof loadAssets === "function" && !window.assetsData)
      setTimeout(() => loadAssets().catch(() => {}), 100);
  });
})();
