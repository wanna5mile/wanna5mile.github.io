/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - Session Smart Load v4
==============================================================
✅ Combined Fixes:
1. Guaranteed preloader/asset load (with decode wait).
2. Session asset caching (only 1 fetch per session).
3. Version-aware update check + toast.
4. Robust image fallback + 404 card fallback.
5. Popup (session + "don't show again" memory).
6. Favorites + paging + search preserved.
========================================================== */
(() => {
  "use strict";

  /* ---------------------------
  Utilities
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

  const SESSION_KEY = "assetsDataCache";
  const VERSION_KEY = "assetsVersion";
  const FAV_KEY = "favorites";
  let isPreloaderActive = false;

  /* ---------------------------
  Sort Mode
  --------------------------- */
  const getSortMode = () => localStorage.getItem("sortMode") || "sheet";

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
      pageIndicator: $(".page-indicator") || $("#page-indicator"),
      searchInput: $("#searchInputHeader"),
      searchBtn: $("#searchBtnHeader"),
      updatePopup: $("#updatePopup"),
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
      updateLink: "system/pages/version-log.html",
    };
  }

  /* ---------------------------
  Toast Notification
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
      window.favorites = new Set(stored.map((s) => SAFE_STR(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = () =>
      localStorage.setItem(FAV_KEY, JSON.stringify([...window.favorites]));
  }

  /* ---------------------------
  Preloader
  --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    isPreloaderActive = true;
    preloader.style.display = "flex";
    preloader.style.opacity = "1";

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
    }

    dom.loaderText = counter;
    dom.progressBarFill = fill;

    window.updateProgress = (p) => {
      if (!isPreloaderActive) return;
      const c = CLAMP(Math.round(p), 0, 100);
      dom.loaderText.textContent = `${c}%`;
      dom.progressBarFill.style.width = `${c}%`;
    };

    window.showLoading = (text) => {
      if (isPreloaderActive && dom.loaderText) dom.loaderText.textContent = text;
    };

    window.hidePreloader = () => {
      if (!isPreloaderActive) return;
      isPreloaderActive = false;
      preloader.style.transition = "opacity 0.4s ease";
      preloader.style.opacity = "0";
      setTimeout(() => (preloader.style.display = "none"), 450);
    };
  }

  /* ---------------------------
  Popup Logic (Session + Local)
  --------------------------- */
  function initPopup() {
    const popup = dom.updatePopup;
    if (!popup) return;

    const closeBtn = popup.querySelector("#closeUpdateBtn");
    const dontShowBtn = popup.querySelector("#dontShowBtn");
    const viewBtn = popup.querySelector("#viewUpdateBtn");

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
  Asset Cards
  --------------------------- */
  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return;
    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    const isFav = (t) => window.favorites.has(SAFE_STR(t).toLowerCase());

    if (!Array.isArray(data) || !data.length) {
      const fallbackCard = document.createElement("div");
      fallbackCard.className = "asset-card fallback-card";
      fallbackCard.innerHTML = `
        <a href="${config.fallbackLink}" target="_blank" rel="noopener noreferrer">
          <img src="${config.fallbackImage}" alt="No assets available">
        </a>
        <h3>No assets available</h3>
      `;
      container.appendChild(fallbackCard);
      return;
    }

    for (const asset of data) {
      const title = SAFE_STR(asset.title);
      const author = SAFE_STR(asset.author);
      const link = SAFE_STR(asset.link) || config.fallbackLink;
      const imageSrc = SAFE_STR(asset.image) || config.fallbackImage;
      const status = SAFE_STR(asset.status).toLowerCase();

      const card = document.createElement("div");
      card.className = "asset-card";

      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      img.alt = title;
      img.loading = "eager";
      img.onerror = () => (img.src = config.fallbackImage);
      a.appendChild(img);

      if (["new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = `${config.gifBase}${status}.gif`;
        overlay.className = `status-gif status-${status}`;
        a.appendChild(overlay);
      }

      const h3 = document.createElement("h3");
      h3.textContent = title || "Untitled";
      const p = document.createElement("p");
      p.textContent = author;

      const fav = document.createElement("button");
      fav.textContent = isFav(title) ? "★" : "☆";
      Object.assign(fav.style, {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "20px",
        color: "#ffcc00",
      });
      fav.addEventListener("click", (e) => {
        e.preventDefault();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        fav.textContent = window.favorites.has(key) ? "★" : "☆";
        saveFavorites();
      });

      card.append(a, h3, p, fav);
      frag.appendChild(card);
    }

    container.appendChild(frag);
  }

  /* ---------------------------
  Image Decode Wait
  --------------------------- */
  async function waitForRenderedImages() {
    try {
      showLoading("Optimizing images...");
      await DELAY(60);
      const imgs = Array.from(document.querySelectorAll("#container img"));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise((res) => {
              if (img.complete && img.naturalWidth) return res();
              img.onload = img.onerror = () => res();
            })
        )
      );
    } catch {
      console.warn("Image decode wait failed");
    }
  }

  /* ---------------------------
  Asset Loader (Session Cache + Update Check)
  --------------------------- */
  async function loadAssets() {
    const cached = sessionStorage.getItem(SESSION_KEY);
    const cachedVersion = sessionStorage.getItem(VERSION_KEY);

    if (cached && cachedVersion) {
      try {
        const data = JSON.parse(cached);
        createAssetCards(data);
        hidePreloader();
        checkForUpdate(cachedVersion);
        return;
      } catch {
        console.warn("Cache invalid, refetching...");
      }
    }

    try {
      showLoading("Loading assets...");
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      const json = await res.json();
      const version = SAFE_STR(json.version || Date.now());
      const data = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
        ? json.data
        : [];

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      sessionStorage.setItem(VERSION_KEY, version);

      createAssetCards(data);
      await waitForRenderedImages();
      hidePreloader();
    } catch (err) {
      console.error("Asset load failed:", err);
      createAssetCards([]);
      hidePreloader();
    }
  }

  async function checkForUpdate(localVersion) {
    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      const json = await res.json();
      const version = SAFE_STR(json.version || Date.now());
      if (version !== localVersion)
        showToast("⚡ New update available! Refresh to rebuild assets.");
    } catch (e) {
      console.warn("Update check failed:", e);
    }
  }

  /* ---------------------------
  Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    initFavorites();
    initPreloader();
    initPopup();
    await loadAssets();
  });
})();
