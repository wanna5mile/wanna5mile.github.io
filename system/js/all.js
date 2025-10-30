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
  let assetsByPage = {};
  let allAssetsFlat = [];
  let currentPage = 1;

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
    const pre = dom.preloader;
    if (!pre) return;
    isPreloaderActive = true;
    pre.style.display = "flex";
    pre.style.opacity = "1";
    pre.dataset.hidden = "false";

    const counter = pre.querySelector("#counter") || pre.appendChild(Object.assign(document.createElement("div"), { id: "counter", className: "load-progress-text" }));
    const bar = pre.querySelector(".load-progress-bar") || pre.appendChild(Object.assign(document.createElement("div"), { className: "load-progress-bar" }));
    const fill = bar.querySelector(".load-progress-fill") || bar.appendChild(Object.assign(document.createElement("div"), { className: "load-progress-fill" }));

    dom.loaderText = counter;
    dom.progressBarFill = fill;

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
      pre.style.pointerEvents = "none";
      setTimeout(() => (pre.style.display = "none"), 500);
      isPreloaderActive = false;
    };
  }

  /* ---------------------------
  Popup (Session + Don’t Show Again)
  --------------------------- */
  function initPopup() {
    const popup = dom.updatePopup;
    if (!popup) return;
    const hiddenSession = sessionStorage.getItem("popupHidden");
    const dontShow = localStorage.getItem("popupDontShow");
    if (dontShow === "true" || hiddenSession === "true") return;

    popup.classList.add("show");
    dom.closeUpdateBtn?.addEventListener("click", () => {
      popup.classList.remove("show");
      sessionStorage.setItem("popupHidden", "true");
    });
    dom.dontShowBtn?.addEventListener("click", () => {
      popup.classList.remove("show");
      localStorage.setItem("popupDontShow", "true");
    });
    dom.viewUpdateBtn?.addEventListener("click", () => {
      window.location.href = config.updateLink;
    });
  }

  /* ---------------------------
  Asset Cards (Eager-loaded images)
  --------------------------- */
  function createAssetCards(list) {
    const cont = dom.container;
    if (!cont) return;
    cont.innerHTML = "";

    const frag = document.createDocumentFragment();
    const sortMode = localStorage.getItem("sortMode") || "sheet";
    const favCheck = (t) => window.favorites.has(safeStr(t).toLowerCase());
    const data = Array.isArray(list) ? [...list] : [];

    if (sortMode === "alphabetical")
      data.sort((a, b) => safeStr(a.title).localeCompare(safeStr(b.title), undefined, { numeric: true, sensitivity: "base" }));

    if (!data.length) {
      cont.innerHTML = `<div class="asset-card fallback-card">
        <a href="${config.fallbackLink}" target="_blank" rel="noopener noreferrer">
          <img src="${config.fallbackImage}" alt="No assets" loading="eager">
        </a><h3>No assets available</h3></div>`;
      return;
    }

    for (const a of data) {
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
      card.dataset.filtered = "true";

      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = title || "Untitled";
      img.loading = "eager";
      img.crossOrigin = "anonymous";
      img.onerror = () => {
        if (img.src !== config.fallbackImage) img.src = config.fallbackImage;
      };
      anchor.appendChild(img);

      if (["new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = `${config.gifBase}${status}.gif`;
        overlay.alt = status;
        overlay.className = `status-gif status-${status}`;
        anchor.appendChild(overlay);
      } else if (status === "fix" || status === "soon") {
        card.classList.add(status);
      }

      const titleEl = document.createElement("h3");
      titleEl.textContent = title;
      const authorEl = document.createElement("p");
      authorEl.textContent = author;

      const star = document.createElement("button");
      star.className = "favorite-star";
      star.textContent = favCheck(title) ? "★" : "☆";
      Object.assign(star.style, {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "20px",
        color: "#ffcc00",
      });
      star.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.textContent = favCheck(title) ? "★" : "☆";
      };

      card.append(anchor, titleEl, authorEl, star);
      frag.append(card);
    }

    cont.append(frag);
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
      [...new Set(allCards().map((c) => +c.dataset.page).filter((n) => !isNaN(n)))].sort((a, b) => a - b);

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
        const visible = !query || c.dataset.title.includes(query) || c.dataset.author.includes(query);
        c.dataset.filtered = visible ? "true" : "false";
      });
      renderPage(1);
    };

    searchBtn?.addEventListener("click", () => filterAssets(search.value));
    search?.addEventListener("input", debounce(() => filterAssets(search.value), 200));

    const savedPage = +sessionStorage.getItem("currentPage") || 1;
    renderPage(savedPage);
  }

  /* ---------------------------
  Wait for all images decode
  --------------------------- */
  async function waitForRenderedImages(timeout = 8000) {
    const imgs = [...document.querySelectorAll("#container img")];
    const promises = imgs.map((img) =>
      img.decode ? Promise.race([img.decode(), delay(timeout)]) : delay(50)
    );
    await Promise.all(promises);
  }

  /* ---------------------------
  Group by page
  --------------------------- */
  function groupAssetsByPage(list) {
    assetsByPage = {};
    allAssetsFlat = Array.isArray(list) ? list : [];
    for (const a of allAssetsFlat) {
      const p = parseInt(a.page || 1);
      if (!assetsByPage[p]) assetsByPage[p] = [];
      assetsByPage[p].push(a);
    }
  }

  /* ---------------------------
  Load assets (session cache + version)
  --------------------------- */
  async function loadAssets(retry = false) {
    try {
      showLoading("Loading assets...");
      updateProgress(5);
      const cached = sessionStorage.getItem(SESSION_KEY);
      const ver = sessionStorage.getItem(VERSION_KEY);

      if (cached && ver) {
        const data = JSON.parse(cached);
        groupAssetsByPage(data);
        createAssetCards(assetsByPage[1]);
        renderPage(1);
        await waitForRenderedImages();
        updateProgress(100);
        hidePreloader();
        checkForUpdate(ver);
        return;
      }

      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      const json = await res.json();
      const version = safeStr(json.version || Date.now());
      const data = Array.isArray(json.data || json.assets || json) ? (json.data || json.assets || json) : [];

      const filtered = data.filter((i) => Object.values(i).some((v) => safeStr(v).trim()));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(filtered));
      sessionStorage.setItem(VERSION_KEY, version);

      groupAssetsByPage(filtered);
      createAssetCards(assetsByPage[1]);
      renderPage(1);
      await waitForRenderedImages();
      updateProgress(100);
      hidePreloader();
    } catch (e) {
      console.error("Asset load failed:", e);
      if (!retry) setTimeout(() => loadAssets(true), 1000);
      hidePreloader();
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
    initPaging();
    await loadAssets();
    dom.nextBtn?.addEventListener("click", () => (currentPage++, renderPage(currentPage)));
    dom.prevBtn?.addEventListener("click", () => (currentPage--, renderPage(currentPage)));
    console.log("✅ WannaSmile Loader Ready (v9)");
  });
})();
