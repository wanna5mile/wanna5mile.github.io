/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - FINAL OPTIMIZED
Key Changes:
- Session-based preloader (only runs on first tab open/session start).
- Version-check with user alert for asset rebuild on update.
- Fix for update popup 'hide' not showing again on new version.
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

  // Keys for localStorage/sessionStorage
  const SORT_KEY = "sortMode";
  const FAV_KEY = "favorites";
  const PAGE_KEY = "currentPage";
  const POPUP_KEY = "updatePopupState"; // For 'Don't Show Again'
  const POPUP_SESSION_KEY = "updatePopupHidden"; // For 'Close' (Current Session)
  const SHEET_VERSION_KEY = "sheetVersion";
  // ✅ NEW KEY: Tracks if preloader ran in the current session/tab
  const LOADER_SESSION_KEY = "loaderRan"; 
  // ✅ NEW KEY: Stores the version/hash of the last loaded/built assets
  const ASSET_HASH_KEY = "assetBuildHash";

  /* ---------------------------
  Sort Mode Control
  --------------------------- */
  const getSortMode = () => localStorage.getItem(SORT_KEY) || "sheet";
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
      viewUpdateBtn: $("#viewUpdateBtn"),
      viewUpdateInfoBtn: $("#viewUpdateInfoBtn"),
      closeUpdateBtn: $("#closeUpdateBtn"),
      dontShowBtn: $("#dontShowBtn"),
      updateVideo: $("#updateVideo"),
      footerVersion: $("#footerVersion"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackYtImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/qrcode.png",
      fallbackLink: "https://wanna5mile.github.io/source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xI9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateLink: "system/pages/version-log.html",
      updateTrailerSrc: "",
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
    };
  }

  /* ---------------------------
  Preloader UI (Modified for Session Control)
  --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    // Check if loader already ran in this session
    const loaderRan = sessionStorage.getItem(LOADER_SESSION_KEY) === "true";
    if (loaderRan) {
      preloader.style.display = "none";
      preloader.dataset.hidden = "true";
      return;
    }

    // Show preloader only on first session open
    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.dataset.hidden = "false";
    sessionStorage.setItem(LOADER_SESSION_KEY, "true");

    let counter = preloader.querySelector("#counter");
    let bar = preloader.querySelector(".load-progress-bar");
    let fill = preloader.querySelector(".load-progress-fill");

    // Unified logic to ensure elements exist
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
      const clamped = CLAMP(Math.round(p), 0, 100);
      counter.textContent = `${clamped}%`;
      fill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) => {
      const tEl = preloader.querySelector(".loading-text") || counter;
      // Only update text if preloader is actually visible
      if (tEl && preloader.style.display !== "none") tEl.textContent = text;
    };

    window.hidePreloader = () => {
      // Don't animate if already hidden or if we skipped showing it
      if (preloader.dataset.hidden === "true") return;

      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };
  }

  /* ---------------------------
  Update Popup Logic (Version-aware + Session)
  --------------------------- */
  function initUpdatePopup() {
    const {
      updatePopup,
      closeUpdateBtn,
      dontShowBtn,
      viewUpdateBtn,
      viewUpdateInfoBtn,
      updateVideo,
    } = dom || {};
    if (!updatePopup) return;

    const YT_CHANNEL = "https://www.youtube.com/@rhap5ody?si=iD7C-rAanz8k_JwL";
    const YOUTUBE_IMAGE_FALLBACK = config.fallbackYtImage;

    const parseVersion = (v) =>
      SAFE_STR(v)
        .split(".")
        .map((n) => parseInt(n, 10) || 0);

    const compareVersions = (a, b) => {
      const va = parseVersion(a);
      const vb = parseVersion(b);
      const len = Math.max(va.length, vb.length);
      for (let i = 0; i < len; i++) {
        const diff = (va[i] || 0) - (vb[i] || 0);
        if (diff !== 0) return diff > 0 ? 1 : -1;
      }
      return 0;
    };

    const showPopup = (trailerURL = "") => {
      updatePopup.classList.add("show");

      if (updateVideo) {
        if (trailerURL) {
          updateVideo.src = trailerURL;
          updateVideo.style.display = "block";
          viewUpdateBtn &&
            (viewUpdateBtn.onclick = () => window.open(trailerURL, "_blank"));
          updatePopup.querySelector("p").textContent =
            "New games, smoother loading, and visual tweaks across the library!";
        } else {
          updateVideo.src = YOUTUBE_IMAGE_FALLBACK;
          updateVideo.style.display = "block";
          updatePopup.querySelector("p").textContent =
            "Small bug fixes and patches. Check out the channel for other videos!";
          viewUpdateBtn &&
            (viewUpdateBtn.onclick = () => window.open(YT_CHANNEL, "_blank"));
        }
      }
    };

    const hidePopup = () => {
      updatePopup.classList.remove("show");
      if (updateVideo) updateVideo.src = "";
    };

    closeUpdateBtn?.addEventListener("click", () => {
      // Close/Hide for CURRENT SESSION only
      sessionStorage.setItem(POPUP_SESSION_KEY, "hidden");
      hidePopup();
    });

    dontShowBtn?.addEventListener("click", () => {
      // Don't show again (PERSISTENT)
      localStorage.setItem(POPUP_KEY, "dontshow");
      sessionStorage.removeItem(POPUP_SESSION_KEY);
      hidePopup();
    });

    viewUpdateInfoBtn?.addEventListener("click", () => {
      hidePopup();
      window.open(config.updateLink, "_blank");
    });

    window.handleVersionPopup = (sheetVersion, trailerURL = "") => {
      const savedVersion = localStorage.getItem(SHEET_VERSION_KEY);
      let popupPref = localStorage.getItem(POPUP_KEY);
      const sessionHidden = sessionStorage.getItem(POPUP_SESSION_KEY);

      let shouldShow = false;

      // 1. Check for a version update
      if (!savedVersion) {
        shouldShow = true; // First run ever
      } else {
        const cmp = compareVersions(sheetVersion, savedVersion);
        if (cmp > 0) {
          // Newer version detected
          shouldShow = true;
          // ✅ FIX: Force reset of 'Don't Show Again' preference
          localStorage.removeItem(POPUP_KEY);
          popupPref = null;
          sessionStorage.removeItem(POPUP_SESSION_KEY);
        }
      }

      // Update the stored version
      localStorage.setItem(SHEET_VERSION_KEY, sheetVersion);

      // 2. Determine final visibility
      if (shouldShow && popupPref !== "dontshow" && !sessionHidden) {
        showPopup(trailerURL);
      } else if (!shouldShow && popupPref === "dontshow" && sessionHidden) {
        // If there's no update, and 'dontShowAgain' or 'close' was clicked,
        // we need to re-evaluate the 'close' button state if 'dontShowAgain' was not set.
        // The fix above handles the new version case. This block is primarily for cleanup.
        if (popupPref !== "dontshow" && sessionHidden) {
          // User clicked 'Close' on an old version - remove session flag for next session
          sessionStorage.removeItem(POPUP_SESSION_KEY);
        }
      }

      if (dom.footerVersion)
        dom.footerVersion.textContent = `Version ${sheetVersion}`;
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
      a.appendChild(img);

      img.onerror = () => (img.src = config.fallbackImage);

      if (["soon", "fix"].includes(status)) {
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
      star.style.cssText =
        "background:transparent;border:none;cursor:pointer;";
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

      const saved = +sessionStorage.getItem(PAGE_KEY) || pages[0];
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
      sessionStorage.setItem(PAGE_KEY, window.currentPage);
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

    searchBtn?.addEventListener("click", () =>
      filterAssets(searchInput.value)
    );
    searchInput?.addEventListener(
      "input",
      DEBOUNCE(() => filterAssets(searchInput.value), 200)
    );

    const saved = +sessionStorage.getItem(PAGE_KEY) || 1;
    window.currentPage = saved;
    renderPage();
    
    // Page Navigation Controls
    window.nextPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const idx = pages.indexOf(+window.currentPage);
      const nextIdx = (idx + 1) % pages.length;
      window.currentPage = pages[nextIdx];
      renderPage();
    };

    window.prevPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const idx = pages.indexOf(+window.currentPage);
      const prevIdx = (idx - 1 + pages.length) % pages.length;
      window.currentPage = pages[prevIdx];
      renderPage();
    };
  }

  /* ---------------------------
  Asset Loader (Modified for Asset Caching/Rebuild)
  --------------------------- */
  async function loadAssets(retry = false) {
    try {
      const isLoaderActive = sessionStorage.getItem(LOADER_SESSION_KEY) === "true";
      const storedHash = localStorage.getItem(ASSET_HASH_KEY);

      if (isLoaderActive) {
        showLoading && showLoading("Loading assets...");
        updateProgress && updateProgress(5);
      }

      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();

      // Determine the asset hash/version
      const sheetVersion = SAFE_STR(
        raw[0]?.version || raw.version || raw._version || raw[0]?._ver
      );
      const assetHash = sheetVersion || JSON.stringify(raw).length; // Fallback to content length as a basic hash

      // --- ASSET REBUILD/UPDATE CHECK ---
      if (storedHash && storedHash !== assetHash) {
        // Assets have changed but we should NOT auto-rebuild
        if (isLoaderActive) hidePreloader && hidePreloader(); // Hide the loader if it was active
        
        // Use a timeout to ensure the current thread finishes before the alert
        await DELAY(50); 
        alert("✨ Changes have been made to the asset library. Refresh the page to rebuild assets and see the latest content.");
        
        // This stops the execution, forcing a user-initiated refresh to proceed.
        return; 
      }
      
      // If no stored hash, or hash matches, or it's the first run, proceed to build/load
      localStorage.setItem(ASSET_HASH_KEY, assetHash);

      // Handle versioning/popup (before data processing)
      if (sheetVersion && typeof handleVersionPopup === "function") {
        handleVersionPopup(sheetVersion, "");
      }
      
      const data = Array.isArray(raw)
        ? raw
            .map((a) => ({
              ...a,
              image: SAFE_STR(a.image).trim() || config.fallbackImage,
            }))
            .filter((i) =>
              Object.values(i).some((v) => SAFE_STR(v).trim())
            )
        : [];

      window.assetsData = data;
      if (isLoaderActive) updateProgress && updateProgress(35);

      const isFavPage = location.pathname
        .toLowerCase()
        .includes("favorites.html");
      let filtered = data;
      if (isFavPage)
        filtered = [...window.favorites].length
          ? data.filter((a) =>
              window.favorites.has(SAFE_STR(a.title).toLowerCase())
            )
          : [];

      // 1. Create the card elements and append them to the DOM
      createAssetCards(filtered);
      if (isLoaderActive) updateProgress && updateProgress(65);
      if (typeof renderPage === "function") renderPage();

      if (isFavPage && !filtered.length && dom.container)
        dom.container.innerHTML =
          "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";

      // 2. Wait for all card images to be loaded and decoded/completed (only if loader is active)
      if (isLoaderActive) {
        const images = dom.container?.querySelectorAll("img") || [];
        if (images.length) {
          await Promise.all(
            [...images].map(
              (img) =>
                new Promise((resolve) => {
                  if (img.complete && img.naturalWidth !== 0) return resolve();
                  img.onerror = () => {
                    img.src = config.fallbackImage;
                    resolve();
                  };
                  img.onload = () => resolve();
                })
            )
          );
        }

        updateProgress && updateProgress(100);
        await DELAY(250);
        hidePreloader && hidePreloader();
      }

    } catch (err) {
      console.error("Error loading assets:", err);
      // Only retry if it failed (and we haven't retried yet)
      if (!retry) return setTimeout(() => loadAssets(true), 1000); 
      showLoading && showLoading("⚠ Failed to load assets.");
      hidePreloader && hidePreloader();
    }
  }

  /* ---------------------------
  DOM Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPreloader();
      initPaging();
      initUpdatePopup(); 
      
      await loadAssets();
      console.log("✅ WannaSmile Loader Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading && showLoading("Initialization failed. Please reload.");
      hidePreloader && hidePreloader();
    }
  });

  // Fallback load on window.load 
  window.addEventListener("load", () => {
    if (typeof loadAssets === "function" && !window.assetsData)
      setTimeout(() => loadAssets().catch(() => {}), 100);
  });
})();
