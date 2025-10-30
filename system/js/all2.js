/* ==========================================================
WannaSmile | Unified JS Loader & UI Logic - Final Merged v3 (Fixed Fallback)
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
      footerVersion: $("#footerVersion"),
    };

    window.config = {
      // ✅ Use QR code as fallback image
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/qrcode.png",

      // ✅ Leave fallbackVideo empty (no image used as video)
      fallbackVideo: "",

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
    const {
      updatePopup,
      closeUpdateBtn,
      dontShowBtn,
      viewUpdateBtn,
      viewUpdateInfoBtn,
      updateVideo,
    } = dom || {};
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
          viewUpdateBtn &&
            (viewUpdateBtn.onclick = () =>
              window.open(trailerURL, "_blank"));
          updatePopup.querySelector("p").textContent =
            "New games, smoother loading, and visual tweaks across the library!";
        } else {
          updateVideo.style.display = "none";
          updatePopup.querySelector("p").textContent =
            "Small bug fixes and patches. Check out the channel for other videos!";
          viewUpdateBtn &&
            (viewUpdateBtn.onclick = () =>
              window.open(YT_CHANNEL, "_blank"));
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
    const isFav = (t) => window.favorites.has(safeStr(t).toLowerCase());

    let sorted = Array.isArray(data) ? [...data] : [];
    if (sortMode === "alphabetical") {
      sorted.sort((a, b) =>
        safeStr(a.title).localeCompare(safeStr(b.title), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    }

    for (const asset of sorted) {
      const title = safeStr(asset.title).trim();
      const author = safeStr(asset.author).trim();
      const imageSrc = safeStr(asset.image) || config.fallbackImage;
      const link = safeStr(asset.link) || config.fallbackLink;
      const pageNum = Number(asset.page) || 1;
      const status = safeStr(asset.status).toLowerCase();
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

      // ✅ fallback handling for broken images
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
      const query = safeStr(q).toLowerCase().trim();
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
      debounce(() => filterAssets(searchInput.value), 200)
    );

    const saved = +sessionStorage.getItem("currentPage") || 1;
    window.currentPage = saved;
    renderPage();

    /* ---------------------------
    Page Navigation Controls (wrap-around)
    --------------------------- */
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
  Asset Loader (with image wait)
  --------------------------- */
  async function loadAssets(retry = false) {
    try {
      showLoading && showLoading("Loading assets...");
      updateProgress && updateProgress(5);

      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();

      const sheetVersion = safeStr(
        raw[0]?.version || raw.version || raw._version || raw[0]?._ver
      );
      if (sheetVersion && typeof handleVersionPopup === "function")
        handleVersionPopup(sheetVersion);

      const data = Array.isArray(raw)
        ? raw
            .map((a) => ({
              ...a,
              video: safeStr(a.video).trim() || config.fallbackVideo,
              image: safeStr(a.image).trim() || config.fallbackImage,
            }))
            .filter((i) =>
              Object.values(i).some((v) => safeStr(v).trim())
            )
        : [];

      window.assetsData = data;
      updateProgress && updateProgress(35);

      const isFavPage = location.pathname
        .toLowerCase()
        .includes("favorites.html");
      let filtered = data;
      if (isFavPage)
        filtered = [...window.favorites].length
          ? data.filter((a) =>
              window.favorites.has(safeStr(a.title).toLowerCase())
            )
          : [];

      createAssetCards(filtered);
      updateProgress && updateProgress(65);
      if (typeof renderPage === "function") renderPage();

      if (isFavPage && !filtered.length && dom.container)
        dom.container.innerHTML =
          "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";

      // ✅ Wait for all images to fully load, use QR fallback on fail
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
    initPaging();
    initUpdatePopup();
    await loadAssets();
    console.log("✅ WannaSmile Loader Ready");
  });
})();
