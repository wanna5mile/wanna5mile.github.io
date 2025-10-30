/* ==========================================================
   WannaSmile | Unified Asset Loader v11.1 (Fixed)
   Paging + Favorites Style Clean + Button Fix
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
  const FAV_KEY = "favorites";
  let allAssetsFlat = [];
  let currentPage = 1;
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
      pageIndicator: $(".page-indicator") || $("#page-indicator"),
      nextBtn: $("#nextPage"),
      prevBtn: $("#prevPage"),
      searchInput: $("#searchInputHeader"),
      searchBtn: $("#searchBtnHeader"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io/source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
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
  Build Asset Cards
  --------------------------- */
  function createAssetCards(list) {
    const cont = dom.container;
    if (!cont) return;
    cont.innerHTML = "";
    const frag = document.createDocumentFragment();
    const favCheck = (t) => window.favorites.has(safeStr(t).toLowerCase());

    for (const a of list) {
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

      // Clean favorites styling
      if (isFavoritesPage) {
        Object.assign(card.style, {
          background: "transparent",
          boxShadow: "none",
          border: "none",
        });
        Object.assign(star.style, {
          border: "none",
          background: "transparent",
          fontSize: "1.4em",
          color: "gold",
          cursor: "pointer",
        });
      }

      card.append(anchor, titleEl, authorEl, star);
      frag.appendChild(card);
    }
    cont.appendChild(frag);
  }

  /* ---------------------------
  Paging
  --------------------------- */
  function initPaging() {
    const cont = dom.container;
    const pageLabel = dom.pageIndicator;
    if (!cont) return;

    const allCards = () => [...cont.querySelectorAll(".asset-card")];
    const getPages = () =>
      [...new Set(allCards().map((c) => +c.dataset.page))].sort((a, b) => a - b);

    window.renderPage = (page) => {
      const pages = getPages();
      if (!pages.length) return;
      const max = pages.length;
      currentPage = clamp(page, 1, max);
      allCards().forEach(
        (c) => (c.style.display = +c.dataset.page === currentPage ? "" : "none")
      );
      if (pageLabel)
        pageLabel.textContent = `Page ${currentPage} of ${max}`;
    };

    dom.nextBtn?.addEventListener("click", () => {
      renderPage(currentPage + 1);
    });

    dom.prevBtn?.addEventListener("click", () => {
      renderPage(currentPage - 1);
    });
  }

  /* ---------------------------
  Load Assets
  --------------------------- */
  async function loadAssets() {
    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      const json = await res.json();
      const arr = Array.isArray(json.data || json.assets || json)
        ? json.data || json.assets || json
        : [];
      const clean = arr.filter((i) => Object.values(i).some((v) => safeStr(v).trim()));

      allAssetsFlat = clean;
      createAssetCards(allAssetsFlat);
      await delay(400);
      renderPage(1);
    } catch (e) {
      console.error("❌ Asset load failed:", e);
    }
  }

  /* ---------------------------
  Init
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    initFavorites();
    await loadAssets();
    initPaging();
    console.log("✅ WannaSmile Loader Ready (v11.1)");
  });
})();
