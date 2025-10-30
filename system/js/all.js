/* ==========================================================
   WannaSmile | Unified Asset Loader v10 (Stable)
   Fixed Asset Loading, Preloader, and Version Cache
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
  let allAssetsFlat = [];
  let assetsByPage = {};
  let currentPage = 1;

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
      pageIndicator: $(".page-indicator") || $("#page-indicator"),
      nextBtn: $("#nextPage"),
      prevBtn: $("#prevPage"),
      searchInput: $("#searchInputHeader"),
      searchBtn: $("#searchBtnHeader"),
      updatePopup: $("#updatePopup"),
      viewUpdateBtn: $("#viewUpdateBtn"),
      closeUpdateBtn: $("#closeUpdateBtn"),
      dontShowBtn: $("#dontShowBtn"),
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
  Toast
  --------------------------- */
  function showToast(msg, dur = 4000) {
    let el = document.getElementById("toastNotify");
    if (!el) {
      el = document.createElement("div");
      el.id = "toastNotify";
      Object.assign(el.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#222",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        opacity: "0",
        transition: "opacity 0.3s",
        zIndex: 9999,
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(() => (el.style.opacity = "0"), dur);
  }

  /* ---------------------------
  Favorites
  --------------------------- */
  function initFavorites() {
    try {
      const arr = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      window.favorites = new Set(arr.map((x) => safeStr(x).toLowerCase()));
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
    const pre = dom.preloader;
    if (!pre) return;

    isPreloaderActive = true;
    pre.style.display = "flex";
    pre.style.opacity = "1";
    pre.dataset.hidden = "false";

    const counter =
      pre.querySelector("#counter") ||
      pre.appendChild(Object.assign(document.createElement("div"), { id: "counter", className: "load-progress-text" }));
    const bar =
      pre.querySelector(".load-progress-bar") ||
      pre.appendChild(Object.assign(document.createElement("div"), { className: "load-progress-bar" }));
    const fill =
      bar.querySelector(".load-progress-fill") ||
      bar.appendChild(Object.assign(document.createElement("div"), { className: "load-progress-fill" }));

    window.updateProgress = (p) => {
      if (!isPreloaderActive) return;
      const val = clamp(Math.round(p), 0, 100);
      counter.textContent = `${val}%`;
      fill.style.width = `${val}%`;
    };

    window.showLoading = (t) => (counter.textContent = t);
    window.hidePreloader = () => {
      if (!isPreloaderActive || pre.dataset.hidden === "true") return;
      pre.dataset.hidden = "true";
      pre.style.transition = "opacity 0.4s ease";
      pre.style.opacity = "0";
      setTimeout(() => {
        pre.style.display = "none";
        isPreloaderActive = false;
      }, 500);
    };
  }

  /* ---------------------------
  Popup Logic
  --------------------------- */
  function initPopup() {
    const pop = dom.updatePopup;
    if (!pop) return;
    const hiddenSession = sessionStorage.getItem("popupHidden");
    const dontShow = localStorage.getItem("popupDontShow");
    if (hiddenSession === "true" || dontShow === "true") return;

    pop.classList.add("show");
    dom.closeUpdateBtn?.addEventListener("click", () => {
      pop.classList.remove("show");
      sessionStorage.setItem("popupHidden", "true");
    });
    dom.dontShowBtn?.addEventListener("click", () => {
      pop.classList.remove("show");
      localStorage.setItem("popupDontShow", "true");
    });
    dom.viewUpdateBtn?.addEventListener("click", () => {
      window.location.href = config.updateLink;
    });
  }

  /* ---------------------------
  Build Asset Cards
  --------------------------- */
  function createAssetCards(list) {
    const cont = dom.container;
    if (!cont) return;
    cont.innerHTML = "";

    const frag = document.createDocumentFragment();
    const sortMode = localStorage.getItem("sortMode") || "sheet";
    const favCheck = (t) => window.favorites.has(safeStr(t).toLowerCase());
    const arr = Array.isArray(list) ? [...list] : [];

    if (sortMode === "alphabetical")
      arr.sort((a, b) =>
        safeStr(a.title).localeCompare(safeStr(b.title), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

    if (!arr.length) {
      cont.innerHTML = `<div class="asset-card fallback-card">
        <a href="${config.fallbackLink}" target="_blank" rel="noopener noreferrer">
          <img src="${config.fallbackImage}" alt="No assets" loading="eager">
        </a><h3>No assets found</h3></div>`;
      return;
    }

    for (const a of arr) {
      const title = safeStr(a.title);
      const author = safeStr(a.author);
      const imgSrc = safeStr(a.image) || config.fallbackImage;
      const link = safeStr(a.link) || config.fallbackLink;
      const status = safeStr(a.status).toLowerCase();
      const page = Number(a.page) || 1;

      const card = document.createElement("div");
      card.className = "asset-card";
      card.dataset.page = String(page);
      card.dataset.title = title.toLowerCase();
      card.dataset.author = author.toLowerCase();

      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = title || "Untitled";
      img.loading = "eager";
      img.onerror = () => (img.src = config.fallbackImage);
      anchor.appendChild(img);

      if (["new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = `${config.gifBase}${status}.gif`;
        overlay.alt = status;
        overlay.className = `status-gif status-${status}`;
        anchor.appendChild(overlay);
      }

      const titleEl = document.createElement("h3");
      titleEl.textContent = title;
      const authorEl = document.createElement("p");
      authorEl.textContent = author;

      const star = document.createElement("button");
      star.className = "favorite-star";
      star.textContent = favCheck(title) ? "★" : "☆";
      star.onclick = (e) => {
        e.preventDefault();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        window.saveFavorites();
        star.textContent = favCheck(title) ? "★" : "☆";
      };

      card.append(anchor, titleEl, authorEl, star);
      frag.appendChild(card);
    }
    cont.appendChild(frag);
  }

  /* ---------------------------
  Paging + Search
  --------------------------- */
  function initPaging() {
    const cont = dom.container;
    const pageLabel = dom.pageIndicator;
    const search = dom.searchInput;
    const searchBtn = dom.searchBtn;
    if (!cont) return;

    const allCards = () => [...cont.querySelectorAll(".asset-card")];
    const getPages = () =>
      [...new Set(allCards().map((c) => +c.dataset.page))].sort((a, b) => a - b);

    window.renderPage = (page = currentPage) => {
      const pages = getPages();
      if (!pages.length) return;
      currentPage = pages.includes(page) ? page : pages[0];
      allCards().forEach((c) => (c.style.display = +c.dataset.page === currentPage ? "" : "none"));
      pageLabel && (pageLabel.textContent = `Page ${pages.indexOf(currentPage) + 1} of ${pages.length}`);
      sessionStorage.setItem("currentPage", currentPage);
    };

    window.filterAssets = (q) => {
      const query = safeStr(q).toLowerCase().trim();
      allCards().forEach((c) => {
        const match =
          !query ||
          c.dataset.title.includes(query) ||
          c.dataset.author.includes(query);
        c.style.display = match ? "" : "none";
      });
    };

    searchBtn?.addEventListener("click", () => filterAssets(search.value));
    search?.addEventListener("input", debounce(() => filterAssets(search.value), 250));
  }

  /* ---------------------------
  Helpers
  --------------------------- */
  async function waitForImages(timeout = 8000) {
    const imgs = [...document.querySelectorAll("#container img")];
    const tasks = imgs.map((img) =>
      img.decode ? Promise.race([img.decode(), delay(timeout)]) : delay(50)
    );
    await Promise.all(tasks);
  }

  function groupAssets(list) {
    assetsByPage = {};
    allAssetsFlat = Array.isArray(list) ? list : [];
    for (const a of allAssetsFlat) {
      const p = parseInt(a.page || 1);
      if (!assetsByPage[p]) assetsByPage[p] = [];
      assetsByPage[p].push(a);
    }
  }

  /* ---------------------------
  Load Assets (cache + version)
  --------------------------- */
  async function loadAssets(retry = false) {
    try {
      showLoading("Loading assets...");
      updateProgress(10);

      const cached = sessionStorage.getItem(SESSION_KEY);
      const ver = sessionStorage.getItem(VERSION_KEY);

      // --- Use cache if present ---
      if (cached && ver) {
        const data = JSON.parse(cached);
        groupAssets(data);
        createAssetCards(allAssetsFlat);
        await waitForImages();
        updateProgress(100);
        hidePreloader();
        checkForUpdate(ver);
        return;
      }

      // --- Fetch fresh data ---
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const version = safeStr(json.version || Date.now());
      const arr = Array.isArray(json.data || json.assets || json)
        ? json.data || json.assets || json
        : [];

      const clean = arr.filter((i) => Object.values(i).some((v) => safeStr(v).trim()));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
      sessionStorage.setItem(VERSION_KEY, version);

      groupAssets(clean);
      createAssetCards(allAssetsFlat);
      await waitForImages();
      updateProgress(100);
      hidePreloader();
    } catch (e) {
      console.error("❌ Asset load failed:", e);
      if (!retry) setTimeout(() => loadAssets(true), 1200);
      else hidePreloader();
    }
  }

  /* ---------------------------
  Version check
  --------------------------- */
  async function checkForUpdate(localVer) {
    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      const j = await res.json();
      if (safeStr(j.version) !== localVer)
        showToast("⚡ New update available! Refresh to rebuild assets.");
    } catch {}
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
    initPaging();
    dom.nextBtn?.addEventListener("click", () => renderPage(currentPage + 1));
    dom.prevBtn?.addEventListener("click", () => renderPage(currentPage - 1));
    console.log("✅ WannaSmile Loader Ready (v10)");
  });
})();
