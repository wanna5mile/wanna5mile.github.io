/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Final Hardened & Optimized Version
   (Favorites Page Filter + Paging + Progress Bar + Popup + Quotes)
   ========================================================== */
(() => {
  "use strict";

  /* ---------------------------
     Utilities
  --------------------------- */
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const safeStr = (v) => (v == null ? "" : String(v));
  const rafAsync = () => new Promise((r) => requestAnimationFrame(r));
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
        if (/^[A-Za-z0-9\-_]+$/.test(sel)) return document.getElementById(sel);
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
      updatePopupContent: $(".update-popup-content"),
      viewUpdateBtn: $("#viewUpdateBtn"),
      viewUpdateInfoBtn: $("#viewUpdateInfoBtn"),
      closeUpdateBtn: $("#closeUpdateBtn"),
      dontShowBtn: $("#dontShowBtn"),
      updateVideo: $("#updateVideo"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io./source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateTrailerSrc: "",
      updateLink: "system/pages/version-log.html",
      quotesJson:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/json/quotes.json",
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
      const promises = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
      return promises;
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

    window.hidePreloader = (force = false) => {
      if (preloader.dataset.hidden === "true") return;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };
  }

  /* ---------------------------
     Asset Card Builder
  --------------------------- */
function createAssetCards(data) {
  const { container } = dom || {};
  if (!container) return [];

  container.innerHTML = "";
  const imagePromises = [];
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

  // Badge URLs
  const badgeMap = {
    featured:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/featured-cover.png",
    new:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/new-cover.png",
    fixed:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/fixed-cover.png",
  };

  for (const asset of sorted) {
    const title = safeStr(asset.title).trim();
    const author = safeStr(asset.author).trim();
    const imageSrc = safeStr(asset.image) || config.fallbackImage;
    const link = safeStr(asset.link) || config.fallbackLink;
    const pageNum = Number(asset.page) || 1;
    const status = safeStr(asset.status).toLowerCase();

    const isFeatured = safeStr(asset.featured).toLowerCase() === "yes";
    const isNew = safeStr(asset.new).toLowerCase() === "yes";
    const isFixed = safeStr(asset.fixed).toLowerCase() === "yes";

    // Card wrapper
    const card = document.createElement("div");
    card.className = "asset-card";
    Object.assign(card.dataset, {
      title: title.toLowerCase(),
      author: author.toLowerCase(),
      page: String(pageNum),
      filtered: "true",
    });

    // Link wrapper
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "asset-link";

    // Image wrapper for overlays
    const wrapper = document.createElement("div");
    wrapper.className = "asset-img-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.borderRadius = "14px";
    wrapper.style.overflow = "hidden";

    // Main asset image
    const img = document.createElement("img");
    img.alt = title;
    img.loading = "eager";
    img.className = "asset-img";

    // Track image load
    const imgPromise = new Promise((resolve) => {
      const tmp = new Image();
      tmp.onload = () => {
        img.src = imageSrc;
        resolve();
      };
      tmp.onerror = () => {
        img.src = config.fallbackImage;
        resolve();
      };
      tmp.src = imageSrc;
    });
    imagePromises.push({ promise: imgPromise, page: pageNum });

    wrapper.appendChild(img);

    // Helper to add overlay
    const addOverlay = (src, alt, cls) => {
      const o = document.createElement("img");
      o.src = src;
      o.alt = alt;
      o.className = `status-overlay ${cls}`;
      wrapper.appendChild(o);
    };

    // Add badges
    if (isFeatured) addOverlay(badgeMap.featured, "featured badge", "overlay-featured");
    if (isNew) addOverlay(badgeMap.new, "new badge", "overlay-new");
    if (isFixed) addOverlay(badgeMap.fixed, "fixed badge", "overlay-fixed");

    // Add GIF status for 'new' or 'updated'
    if (status && ["new", "updated"].includes(status)) {
      addOverlay(`${config.gifBase}${status}.gif`, `${status} badge`, `status-gif status-${status}`);
    }

    // Add "soon" or "fix" class to card
    if (status === "soon" || status === "fix") {
      card.classList.add(status === "fix" ? "FIX" : "soon");
    }

    // Append image wrapper to link
    a.appendChild(wrapper);

    // Title & author
    const titleEl = document.createElement("h3");
    titleEl.textContent = title || "Untitled";

    const authorEl = document.createElement("p");
    authorEl.textContent = author || "";

    // Favorite star
    const star = document.createElement("button");
    star.className = "favorite-star";
    star.textContent = isFav(title) ? "★" : "☆";
    Object.assign(star.style, { background: "transparent", border: "none", cursor: "pointer" });
    star.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = title.toLowerCase();
      if (window.favorites.has(key)) window.favorites.delete(key);
      else window.favorites.add(key);
      saveFavorites();
      star.textContent = window.favorites.has(key) ? "★" : "☆";
    });

    // Append everything to card
    card.append(a, titleEl, authorEl, star);
    frag.appendChild(card);
  }

  container.appendChild(frag);
  return imagePromises;
}

  /* ---------------------------
     Paging + Search + Filter
  --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    const quoteWrapper = document.getElementById("quoteWrapper");
    const getAllCards = () => [...container.querySelectorAll(".asset-card")];
    const getFilteredCards = () => getAllCards().filter((c) => c.dataset.filtered === "true");
    const getPages = () =>
      [...new Set(getFilteredCards().map((c) => +c.dataset.page).filter((n) => !isNaN(n)))].sort((a, b) => a - b);

    function updateQuoteVisibility() {
      if (!quoteWrapper) return;
      const visibleCards = getFilteredCards().length;
      quoteWrapper.style.opacity = visibleCards === 0 ? "1" : "1";
      quoteWrapper.style.pointerEvents = visibleCards === 0 ? "auto" : "none";
      quoteWrapper.style.marginTop = "0";
    }

    window.renderPage = () => {
      const pages = getPages();
      if (!pages.length) {
        window.currentPage = 1;
        getAllCards().forEach((c) => (c.style.display = "none"));
        pageIndicator && (pageIndicator.textContent = "No pages");
        updateQuoteVisibility();
        return;
      }

      const saved = +sessionStorage.getItem("currentPage") || pages[0];
      if (!window._pageRestored) {
        window.currentPage = pages.includes(saved) ? saved : pages[0];
        window._pageRestored = true;
      }

      getAllCards().forEach((c) => {
        const visible = +c.dataset.page === +window.currentPage && c.dataset.filtered === "true";
        c.style.display = visible ? "" : "none";
      });

      const idx = pages.indexOf(+window.currentPage);
      pageIndicator && (pageIndicator.textContent = `Page ${idx + 1} of ${pages.length}`);
      sessionStorage.setItem("currentPage", window.currentPage);
      updateQuoteVisibility();
    };

    window.filterAssets = (q) => {
      const query = safeStr(q).toLowerCase().trim();
      getAllCards().forEach((c) => {
        c.dataset.filtered =
          !query || c.dataset.title.includes(query) || c.dataset.author.includes(query)
            ? "true"
            : "false";
      });
      window.currentPage = getPages()[0] || 1;
      renderPage();
      updateQuoteVisibility();
    };

    window.prevPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const i = pages.indexOf(+window.currentPage);
      window.currentPage = i <= 0 ? pages.at(-1) : pages[i - 1];
      renderPage();
    };

    window.nextPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const i = pages.indexOf(+window.currentPage);
      window.currentPage = i === -1 || i === pages.length - 1 ? pages[0] : pages[i + 1];
      renderPage();
    };

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));

    window.currentPage = +sessionStorage.getItem("currentPage") || 1;
    renderPage();
  }

  /* ---------------------------
     Placeholder Cycle
  --------------------------- */
  function initPlaceholders() {
    const { searchInput } = dom || {};
    if (!searchInput) return;
    const FADE = 400, HOLD = 4000;

    const fadePlaceholder = (input, text, cb) => {
      input.classList.add("fade-out");
      setTimeout(() => {
        input.placeholder = text;
        input.classList.remove("fade-out");
        input.classList.add("fade-in");
        setTimeout(() => {
          input.classList.remove("fade-in");
          cb?.();
        }, FADE);
      }, FADE);
    };

    window.startPlaceholderCycle = () => {
      if (window._placeholderRunning) return;
      window._placeholderRunning = true;
      const loop = async () => {
        try {
          const visible = document.querySelectorAll(
            `.asset-card[data-filtered="true"][data-page="${window.currentPage}"]`
          ).length;
          await new Promise((r) => fadePlaceholder(searchInput, `${visible} assets on this page`, r));
          await delay(HOLD);
          await new Promise((r) => fadePlaceholder(searchInput, "Search assets...", r));
          await delay(HOLD);
          if (window._placeholderRunning) loop();
        } catch {
          window._placeholderRunning = false;
        }
      };
      loop();
    };

    window.stopPlaceholderCycle = () => (window._placeholderRunning = false);
  }

  /* ---------------------------
     Update Popup
  --------------------------- */
  async function initUpdatePopup() {
    const p = dom.updatePopup;
    if (!p) return;

    const LS_HIDE = "ws_hideUpdate";
    const LS_VER = "ws_lastUpdateVersion";

    try {
      const res = await fetch(`${config.sheetUrl}?mode=version-message`, { cache: "no-store" });
      const data = await res.json();
      const latest = Array.isArray(data) && data.length ? data[data.length - 1] : { version: "1.0.0", message: "New updates!", trailer: "", link: "" };

      const CURRENT_VERSION = latest.version || "1.0.0";
      const MESSAGE = latest.message || "Enjoy the latest update!";
      const TRAILER = latest.trailer || "";
      const LINK = latest.link || config.updateLink;

      const titleEl = p.querySelector("h2");
      const msgEl = p.querySelector("p");
      if (titleEl) titleEl.textContent = `Version ${CURRENT_VERSION} Update!`;
      if (msgEl) msgEl.textContent = MESSAGE;
      if (dom.updateVideo && TRAILER) dom.updateVideo.src = TRAILER;
      config.updateLink = LINK;

      const hidePref = localStorage.getItem(LS_HIDE);
      const lastVersion = localStorage.getItem(LS_VER);
      const hideForSession = sessionStorage.getItem(LS_HIDE);
      const shouldShow = (!hidePref && !hideForSession) || lastVersion !== CURRENT_VERSION;

      const footerVersion = document.getElementById("footerVersion");
      if (footerVersion) footerVersion.textContent = `Version ${CURRENT_VERSION}`;
      if (!shouldShow) return;

      localStorage.setItem(LS_VER, CURRENT_VERSION);
      setTimeout(() => p.classList.add("show"), 600);

      dom.viewUpdateBtn?.addEventListener("click", () => {
        window.open(LINK, "_self");
        p.classList.remove("show");
      });
      dom.viewUpdateInfoBtn?.addEventListener("click", () => window.open(LINK, "_blank"));
      dom.closeUpdateBtn?.addEventListener("click", () => { sessionStorage.setItem(LS_HIDE, "1"); p.classList.remove("show"); });
      dom.dontShowBtn?.addEventListener("click", () => { localStorage.setItem(LS_HIDE, "1"); p.classList.remove("show"); });
      p.addEventListener("click", (e) => { if (e.target === p) { sessionStorage.setItem(LS_HIDE, "1"); p.classList.remove("show"); } });
    } catch (err) {
      console.warn("⚠ Version message fetch failed:", err);
    }
  }

/* ---------------------------
     Asset Loader (Smooth Progress)
--------------------------- */
async function loadAssets(retry = false) {
  try {
    showLoading("Loading assets...");

    let currentProgress = 0;
    const setProgress = (target) => {
      return new Promise((resolve) => {
        const step = () => {
          currentProgress += (target - currentProgress) * 0.08; // smooth easing
          if (Math.abs(target - currentProgress) < 0.5) {
            currentProgress = target;
            updateProgress(currentProgress);
            resolve();
          } else {
            updateProgress(currentProgress);
            requestAnimationFrame(step);
          }
        };
        step();
      });
    };

    await setProgress(5); // initial start

    // Fetch JSON
    const res = await fetch(config.sheetUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
    const raw = await res.json();
    const data = raw.filter((i) => Object.values(i).some((v) => safeStr(v).trim()));
    window.assetsData = data;

    await setProgress(20);

    const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
    const filtered = isFavPage
      ? data.filter((a) => window.favorites.has(safeStr(a.title).toLowerCase()))
      : data;

    // Create asset cards & track image loading
    const promises = createAssetCards(filtered || []);
    const totalImages = promises.length;
    let loadedImages = 0;

    if (totalImages) {
      for (const p of promises) {
        p.promise.then(() => {
          loadedImages++;
        });
      }

      // Smooth progress loop
      while (loadedImages < totalImages) {
        const target = 20 + (loadedImages / totalImages) * 70; // 20-90%
        currentProgress += (target - currentProgress) * 0.08;
        updateProgress(currentProgress);
        await rafAsync();
      }
    }

    await setProgress(90);

    if (typeof renderPage === "function") renderPage();
    if (isFavPage && !filtered.length && dom.container)
      dom.container.innerHTML =
        "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";

    await setProgress(100);
    await delay(350);
    hidePreloader(true);
  } catch (err) {
    console.error("Error loading assets:", err);
    if (!retry) {
      setTimeout(() => loadAssets(true).catch(() => {}), 1000);
      return;
    }
    showLoading("⚠ Failed to load assets.");
    hidePreloader(true);
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
      initPlaceholders();
      await initUpdatePopup();
      await loadAssets();

      if (typeof initQuotes === "function") await initQuotes();

      console.log("✅ WannaSmile Loader + Quotes Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading("Initialization failed. Please reload.");
      hidePreloader(true);
    }
  });
})();
