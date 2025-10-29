/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - Optimized
Final Hardened & Optimized Version (with Version-Aware Popup)
========================================================== */
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
      updateTrailerSrc: "",
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
      createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
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

    window.hidePreloader = () => {
      if (preloader.dataset.hidden === "true") return;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };
  }

/* ---------------------------
Update Popup Logic (Version-Synced)
--------------------------- */
function initUpdatePopup() {
  const { updatePopup, closeUpdateBtn, dontShowBtn, viewUpdateBtn, viewUpdateInfoBtn, updateVideo } = dom || {};
  if (!updatePopup) return;

  const POPUP_KEY = "updatePopupState";
  const VERSION_KEY = "sheetVersion";
  const YT_CHANNEL = "https://www.youtube.com/@rhap5ody?si=iD7C-rAanz8k_JwL";

  const showPopup = (trailerURL = "") => {
    updatePopup.classList.add("show");

    if (updateVideo) {
      if (trailerURL) {
        updateVideo.src = trailerURL;
        updateVideo.style.display = "block";
        if (dom.viewUpdateBtn) {
          dom.viewUpdateBtn.onclick = () => window.open(trailerURL, "_blank");
        }
        updatePopup.querySelector("p").textContent =
          "New games, smoother loading, and visual tweaks across the library!";
      } else {
        updateVideo.style.display = "none";
        updatePopup.querySelector("p").textContent =
          "Small bug fixes and patches. Check out the channel for other videos!";
        if (dom.viewUpdateBtn) dom.viewUpdateBtn.onclick = () => window.open(YT_CHANNEL, "_blank");
      }
    }
  };

  const hidePopup = () => {
    updatePopup.classList.remove("show");
    if (updateVideo) updateVideo.src = "";
  };

  closeUpdateBtn?.addEventListener("click", hidePopup);
  viewUpdateInfoBtn?.addEventListener("click", () => {
    hidePopup();
    window.open("system/pages/version-log.html", "_blank");
  });
  dontShowBtn?.addEventListener("click", () => {
    localStorage.setItem(POPUP_KEY, "dontshow");
    hidePopup();
  });

  // Called automatically after sheet load
  window.handleVersionPopup = (sheetVersion, trailerURL = "") => {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    const popupPref = localStorage.getItem(POPUP_KEY);

    console.log(`🧩 Current Sheet Version: ${sheetVersion}`);
    console.log(`📦 Saved Version: ${savedVersion || "none"}`);

    if (sheetVersion && sheetVersion !== savedVersion) {
      console.log("🔔 New sheet version detected!");
      localStorage.setItem(VERSION_KEY, sheetVersion);
      localStorage.removeItem(POPUP_KEY); // reset preference to show again
      showPopup(trailerURL);
    } else {
      if (popupPref !== "dontshow") showPopup(trailerURL);
    }

    // Update footer version
    if (dom.footerVersion) dom.footerVersion.textContent = `Version ${sheetVersion}`;
  };
}

  /* ---------------------------
  Asset Loader + Version Logic
  --------------------------- */
  async function loadAssets(retry = false) {
    showLoading("Loading assets...");
    updateProgress(5);
    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();
      
      // ✅ Detect version field (custom column “version” or _version in sheet)
      const sheetVersion = safeStr(raw[0]?.version || raw.version || raw._version || raw[0]?._ver);
      if (sheetVersion && typeof handleVersionPopup === "function")
        handleVersionPopup(sheetVersion);

      const data = Array.isArray(raw)
        ? raw.filter((i) => Object.values(i).some((v) => safeStr(v).trim()))
        : [];
      window.assetsData = data;

      updateProgress(35);
      const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
      const filtered = isFavPage
        ? data.filter((a) => window.favorites.has(safeStr(a.title).toLowerCase()))
        : data;

      createAssetCards(filtered);
      updateProgress(65);
      if (typeof renderPage === "function") renderPage();

      if (isFavPage && !filtered.length && dom.container)
        dom.container.innerHTML =
          "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";

      await waitForRenderedImages(8000);
      updateProgress(100);
      await delay(250);
      hidePreloader();

    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000);
      showLoading("⚠ Failed to load assets.");
      hidePreloader();
    }
  }

  /* ---------------------------
  Paging / Decode helpers
  --------------------------- */
  // ... (Keep your existing Paging + waitForRenderedImages + createAssetCards code unchanged)

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
      showLoading("Initialization failed. Please reload.");
      hidePreloader();
    }
  });

  window.addEventListener("load", () => {
    if (typeof loadAssets === "function" && !window.assetsData)
      setTimeout(() => loadAssets().catch(() => {}), 100);
  });
})();
