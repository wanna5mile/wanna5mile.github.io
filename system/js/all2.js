/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - Fixed v2
========================================================== */
(() => {
  "use strict";

  /* ---------------------------
  Utilities
  --------------------------- */
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const safeStr = (v) => (v == null ? "" : String(v));

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
      fallbackVideo: "system/images/qrcode.png",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
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

    window.showLoading = (text) => {
      const tEl = preloader.querySelector(".loading-text") || counter;
      if (tEl) tEl.textContent = text;
    };

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
  Update Popup Logic
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
          viewUpdateBtn && (viewUpdateBtn.onclick = () => window.open(trailerURL, "_blank"));
          updatePopup.querySelector("p").textContent =
            "New games, smoother loading, and visual tweaks across the library!";
        } else {
          updateVideo.style.display = "none";
          updatePopup.querySelector("p").textContent =
            "Small bug fixes and patches. Check out the channel for other videos!";
          viewUpdateBtn && (viewUpdateBtn.onclick = () => window.open(YT_CHANNEL, "_blank"));
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

    window.handleVersionPopup = (sheetVersion, trailerURL = "") => {
      const savedVersion = localStorage.getItem(VERSION_KEY);
      const popupPref = localStorage.getItem(POPUP_KEY);

      if (sheetVersion && sheetVersion !== savedVersion) {
        localStorage.setItem(VERSION_KEY, sheetVersion);
        localStorage.removeItem(POPUP_KEY);
        showPopup(trailerURL);
      } else if (popupPref !== "dontshow") {
        showPopup(trailerURL);
      }

      if (dom.footerVersion) dom.footerVersion.textContent = `Version ${sheetVersion}`;
    };
  }

/* ---------------------------
Asset Loader + Image Wait + Fallback Video
--------------------------- */
async function loadAssets(retry = false) {
  try {
    showLoading && showLoading("Loading assets...");
    updateProgress && updateProgress(5);

    const res = await fetch(config.sheetUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
    const raw = await res.json();

    const sheetVersion = safeStr(raw[0]?.version || raw.version || raw._version || raw[0]?._ver);
    if (sheetVersion && typeof handleVersionPopup === "function")
      handleVersionPopup(sheetVersion);

    // Prepare assets
    const data = Array.isArray(raw)
      ? raw.map((a) => ({
          ...a,
          video: safeStr(a.video).trim() || config.fallbackVideo,
          image: safeStr(a.image).trim() || config.fallbackImage,
        })).filter((i) => Object.values(i).some((v) => safeStr(v).trim()))
      : [];
    window.assetsData = data;

    updateProgress && updateProgress(35);

    // Render cards
    if (typeof createAssetCards === "function") createAssetCards(data);
    updateProgress && updateProgress(65);
    if (typeof renderPage === "function") renderPage();

    if (dom.container && !data.length)
      dom.container.innerHTML =
        "<p style='text-align:center;color:#ccc;font-family:monospace;'>No assets found ★</p>";

    // Wait for all images to fully load
    const images = dom.container?.querySelectorAll("img") || [];
    if (images.length) {
      await Promise.all([...images].map((img) => new Promise((resolve) => {
        if (img.complete && img.naturalWidth !== 0) return resolve();
        img.onerror = () => { img.src = config.fallbackImage; resolve(); };
        img.onload = () => resolve();
      })));
    }

    updateProgress && updateProgress(100);
    await delay(250);
    hidePreloader && hidePreloader();
  } catch (err) {
    console.error("Error loading assets:", err);
    if (!retry) return setTimeout(() => loadAssets(true), 1000);
    showLoading && showLoading("⚠ Failed to load assets.");
    hidePreloader && hidePreloader();
  }
}

  /* ---------------------------
  DOM Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    initFavorites();
    initPreloader();
    if (typeof initPaging === "function") initPaging();
    initUpdatePopup();
    await loadAssets();
    console.log("✅ WannaSmile Loader Ready");
  });
})();
