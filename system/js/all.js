/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - FINAL FIXED & RESTRUCTURED
Fixes:
1. Guaranteed Preloader/Asset Loading sequence (Preloader only hides AFTER all assets load).
2. Corrected visibility check for preloader progress updates.
3. Ensured assets load on all pages, but preloader only shows on session start.
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
  const POPUP_KEY = "updatePopupState";
  const POPUP_SESSION_KEY = "updatePopupHidden";
  const SHEET_VERSION_KEY = "sheetVersion";
  // ✅ Renamed for clarity and encapsulated state
  const IS_NEW_SESSION_KEY = "isNewSession"; 
  const ASSET_HASH_KEY = "assetBuildHash";
  
  // Track if preloader is currently visible and active (Session only)
  let isPreloaderVisible = false;

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
  DOM & Config Initialization (Simplified)
  --------------------------- */
  function initElements() {
    const $ = (sel) => {
      try {
        if (!sel) return document.querySelector(sel) || null;
        if (/^[A-Za-z0-9-_]+$/.test(sel)) return document.getElementById(sel);
        return document.querySelector(sel) || null;
      } catch {
        return null;
      }
    };

    window.dom = {
      container: $("#container"),
      preloader: $("#preloader"),
      // ... other DOM elements remain the same ...
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
  Favorites System (No change)
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
  Preloader UI (Fixed Visibility)
  --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    // Determine if this is the first load in the session/tab
    const loaderRan = sessionStorage.getItem(IS_NEW_SESSION_KEY) === "false";
    
    // Set global visibility flag
    isPreloaderVisible = !loaderRan;

    if (isPreloaderVisible) {
      preloader.style.display = "flex";
      preloader.style.opacity = "1";
      preloader.dataset.hidden = "false";
      // Mark session as NOT new for future refreshes
      sessionStorage.setItem(IS_NEW_SESSION_KEY, "false"); 
    } else {
      preloader.style.display = "none";
      preloader.dataset.hidden = "true";
    }
    
    // UI elements initialization (moved outside the visibility check)
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
      if (!isPreloaderVisible) return; // Only update if visible
      const clamped = CLAMP(Math.round(p), 0, 100);
      counter.textContent = `${clamped}%`;
      fill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) => {
      if (!isPreloaderVisible) return; // Only show text if visible
      const tEl = preloader.querySelector(".loading-text") || counter;
      if (tEl) tEl.textContent = text;
    };

    window.hidePreloader = () => {
      if (!isPreloaderVisible || preloader.dataset.hidden === "true") return;

      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };
  }

  /* ---------------------------
  Update Popup Logic (No change needed)
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
      sessionStorage.setItem(POPUP_SESSION_KEY, "hidden");
      hidePopup();
    });

    dontShowBtn?.addEventListener("click", () => {
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

      if (!savedVersion) {
        shouldShow = true; 
      } else {
        const cmp = compareVersions(sheetVersion, savedVersion);
        if (cmp > 0) {
          shouldShow = true;
          // Fix for "hide" not showing again on new version: reset preferences
          localStorage.removeItem(POPUP_KEY);
          popupPref = null;
          sessionStorage.removeItem(POPUP_SESSION_KEY);
        }
      }

      localStorage.setItem(SHEET_VERSION_KEY, sheetVersion);

      if (shouldShow && popupPref !== "dontshow" && !sessionHidden) {
        showPopup(trailerURL);
      } 

      if (dom.footerVersion)
        dom.footerVersion.textContent = `Version ${sheetVersion}`;
    };
  }


  /* ---------------------------
  Asset Card Builder (No change needed)
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
  Paging + Search + Filter (No change needed)
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
  Asset Loader (Critical Fixes)
  --------------------------- */
  async function loadAssets(retry = false) {
    try {
      // Use the global visibility flag, which is set correctly by initPreloader
      const isLoaderActive = isPreloaderVisible; 
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
      const assetHash = sheetVersion || JSON.stringify(raw).length; 

      // --- ASSET REBUILD/UPDATE CHECK ---
      if (storedHash && storedHash !== assetHash) {
        if (isLoaderActive) hidePreloader && hidePreloader(); 
        
        await DELAY(50); 
        alert("✨ Changes have been made to the asset library. Refresh the page to rebuild assets and see the latest content.");
        
        // Block further execution if assets need rebuilding
        return; 
      }
      
      // If safe to load, update the hash for the next session
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
      // Paging needs to run immediately to set visibility
      if (typeof renderPage === "function") renderPage();

      if (isFavPage && !filtered.length && dom.container)
        dom.container.innerHTML =
          "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";

      // 2. Wait for all card images to be loaded (ONLY if loader is active)
      if (isLoaderActive) {
        const images = dom.container?.querySelectorAll("img") || [];
        if (images.length) {
          // This ensures the loader does not hide until ALL images are confirmed loaded or errored
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
        // ✅ FINAL STEP: Only hide the preloader after all loading/image checks are complete
        hidePreloader && hidePreloader();
      }

    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000); 
      showLoading && showLoading("⚠ Failed to load assets.");
      hidePreloader && hidePreloader();
    }
  }

  /* ---------------------------
  DOM Bootstrap (Restructured)
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // 1. Initialize core elements and systems (must run first)
      initElements();
      initFavorites();
      initPaging();
      initUpdatePopup(); 
      
      // 2. Initialize Preloader last, as it determines session state
      initPreloader();
      
      // 3. Start Asset Loading (which uses the state set by initPreloader)
      await loadAssets();
      console.log("✅ WannaSmile Loader Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading && showLoading("Initialization failed. Please reload.");
      hidePreloader && hidePreloader();
    }
  });

  // Fallback load on window.load (No change needed)
  window.addEventListener("load", () => {
    // Only attempt fallback if assets haven't been loaded yet (i.e., assetData is missing)
    if (typeof loadAssets === "function" && !window.assetsData)
      setTimeout(() => loadAssets().catch(() => {}), 100);
  });
})();
