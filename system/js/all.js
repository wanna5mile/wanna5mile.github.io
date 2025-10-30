/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - FIXED & GUARANTEED LOAD v2
Fixes:
1. Guaranteed Preloader/Asset Loading sequence (Preloader hides only AFTER full decode).
2. Robust image loading with fallback handling.
3. Popup initialization (session + “don’t show again” memory).
4. Graceful empty-asset fallback with 404 image.
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

  // State
  let isPreloaderActive = false;
  const FAV_KEY = "favorites";

  /* ---------------------------
  Sort Mode
  --------------------------- */
  const getSortMode = () => localStorage.getItem("sortMode") || "sheet";
  document.addEventListener("sortModeChanged", () => {
    if (window.assetsData && typeof window.refreshCards === "function") {
      window.refreshCards();
    }
  });

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

    window.refreshCards = () => {
      if (!window.assetsData || typeof createAssetCards !== "function") return;
      createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
    };
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
      if (!isPreloaderActive) return;
      const c = CLAMP(Math.round(p), 0, 100);
      dom.loaderText.textContent = `${c}%`;
      dom.progressBarFill.style.width = `${c}%`;
    };

    window.showLoading = (text) => {
      if (isPreloaderActive) dom.loaderText.textContent = text;
    };

    window.hidePreloader = () => {
      if (!isPreloaderActive) return;
      isPreloaderActive = false;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.4s ease";
      preloader.style.opacity = "0";
      setTimeout(() => (preloader.style.display = "none"), 450);
    };
  }

  /* ---------------------------
  Popup Logic (Session + Local Memory)
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

    if (!sorted.length) {
      // 🔥 No data fallback — show a single 404 card
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

      const img = document.createElement("img");
      img.alt = title;
      img.loading = "eager";
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      img.onerror = () => (img.src = config.fallbackImage);

      a.appendChild(img);

      if (["soon", "fix"].includes(status)) card.classList.add(status);
      else if (["new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = gifFile;
        overlay.alt = `${status} badge`;
        overlay.className = `status-gif status-${status}`;
        a.appendChild(overlay);
      }

      const titleEl = document.createElement("h3");
      titleEl.textContent = title || "Untitled";
      const authorEl = document.createElement("p");
      authorEl.textContent = author;

      const star = document.createElement("button");
      star.className = "favorite-star";
      star.textContent = isFav(title) ? "★" : "☆";
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
  Paging + Search
  --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;
    const getAll = () => [...container.querySelectorAll(".asset-card")];
    const getFiltered = () => getAll().filter((c) => c.dataset.filtered === "true");
    const getPages = () =>
      [...new Set(getFiltered().map((c) => +c.dataset.page).filter((n) => !isNaN(n)))].sort(
        (a, b) => a - b
      );

    window.renderPage = () => {
      const pages = getPages();
      if (!pages.length) {
        getAll().forEach((c) => (c.style.display = ""));
        pageIndicator && (pageIndicator.textContent = "No pages");
        return;
      }
      const saved = +sessionStorage.getItem("currentPage") || pages[0];
      window.currentPage = pages.includes(saved) ? saved : pages[0];
      getAll().forEach((c) => {
        c.style.display =
          +c.dataset.page === +window.currentPage && c.dataset.filtered === "true" ? "" : "none";
      });
      const idx = pages.indexOf(+window.currentPage);
      pageIndicator &&
        (pageIndicator.textContent = `Page ${idx + 1} of ${pages.length}`);
      sessionStorage.setItem("currentPage", window.currentPage);
    };

    window.filterAssets = (q) => {
      const query = SAFE_STR(q).toLowerCase().trim();
      getAll().forEach((c) => {
        const match =
          !query ||
          c.dataset.title.includes(query) ||
          c.dataset.author.includes(query);
        c.dataset.filtered = match ? "true" : "false";
      });
      renderPage();
    };

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", DEBOUNCE(() => filterAssets(searchInput.value), 200));
    renderPage();
  }

  /* ---------------------------
  Decode Helper
  --------------------------- */
  async function waitForRenderedImages() {
    if (!isPreloaderActive) return;
    try {
      showLoading("Optimizing images...");
      await DELAY(60);
      const imgs = Array.from(document.querySelectorAll("#container img"));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise((res) => {
              if (img.complete && img.naturalWidth !== 0) return res();
              img.onerror = () => res();
              img.onload = () => res();
            })
        )
      );
    } catch (e) {
      console.warn("Image decode wait failed:", e);
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

      updateProgress(40);
      createAssetCards(data);
      if (typeof renderPage === "function") renderPage();

      await waitForRenderedImages();
      updateProgress(100);
      await DELAY(200);
      hidePreloader();
    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000);
      showLoading("⚠ Failed to load assets.");
      createAssetCards([]); // show fallback 404 card
      hidePreloader();
    }
  }

  /* ---------------------------
  Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPaging();
      initPreloader();
      initPopup();
      await loadAssets();
      console.log("✅ WannaSmile Loader Ready");
    } catch (e) {
      console.error("Init failed:", e);
      showLoading("Initialization failed. Please reload.");
      hidePreloader();
    }
  });

  window.addEventListener("load", () => {
    if (!window.assetsData) setTimeout(() => loadAssets().catch(() => {}), 100);
  });
})();
