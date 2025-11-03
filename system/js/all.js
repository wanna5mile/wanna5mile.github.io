/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Final Hardened & Optimized Version
   (Favorites Page Filter + Paging + Progress Bar + Popup)
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
  document.addEventListener("sortModeChanged", (e) => {
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
      fallbackLink: "https://wanna5mile.github.io/source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateTrailerSrc: "",
      updateLink: "system/pages/version-log.html",
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
      a.appendChild(img);

  // Apply visual status classes — CSS handles visuals for FIX + SOON
if (status === "soon" || status === "fix") {
  // Capitalize FIX to match your CSS selector `.FIX`
  card.classList.add(status === "fix" ? "FIX" : "soon");
} else if (["new", "updated"].includes(status)) {
  // Optional: still allow animated GIF overlays for these
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
      Object.assign(star.style, {
        background: "transparent",
        border: "none",
        cursor: "pointer",
      });
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
    return imagePromises;
  }

  /* ---------------------------
     Paging + Search + Filter (Optimized + Persistent)
     --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    const getAllCards = () => [...container.querySelectorAll(".asset-card")];
    const getFilteredCards = () =>
      getAllCards().filter((c) => c.dataset.filtered === "true");
    const getPages = () =>
      [...new Set(
        getFilteredCards()
          .map((c) => +c.dataset.page)
          .filter((n) => !isNaN(n))
      )].sort((a, b) => a - b);

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
          +c.dataset.page === +window.currentPage &&
          c.dataset.filtered === "true";
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
    searchInput?.addEventListener(
      "input",
      debounce(() => filterAssets(searchInput.value), 200)
    );

    const saved = +sessionStorage.getItem("currentPage") || 1;
    window.currentPage = saved;
    renderPage();
  }

  /* ---------------------------
     Placeholder Cycle
     --------------------------- */
  function initPlaceholders() {
    const { searchInput } = dom || {};
    if (!searchInput) return;
    const FADE = 400,
      HOLD = 4000;

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
          await new Promise((r) =>
            fadePlaceholder(searchInput, `${visible} assets on this page`, r)
          );
          await delay(HOLD);
          await new Promise((r) =>
            fadePlaceholder(searchInput, "Search assets...", r)
          );
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
   Update Popup (Persistent + Version-aware + YouTube Support)
   --------------------------- */
async function initUpdatePopup() {
  const p = dom.updatePopup;
  if (!p) return;

  const CURRENT_VERSION = "1.0.0"; // <-- Update this to your current deployed version
  const LS_HIDE = "ws_hideUpdate";
  const LS_VER = "ws_lastVersion";

  const hideForever = localStorage.getItem(LS_HIDE) === "1";
  const lastSeenVersion = localStorage.getItem(LS_VER) || "";
  let shouldShow = !hideForever;

  let versionMessage = "";
  let sheetVersion = CURRENT_VERSION;
  let trailerSrc = "";

  try {
    const res = await fetch(config.sheetUrl + "?fetch=version-data", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();

      // Handle array or object formats flexibly
      const latest =
        Array.isArray(json)
          ? json[json.length - 1]
          : json?.data?.[json.data.length - 1] || json;

      sheetVersion =
        latest?.version?.trim() ||
        latest?.Version ||
        CURRENT_VERSION;

      versionMessage =
        latest?.["version-message"] ||
        latest?.versionMessage ||
        latest?.message ||
        "A new version is available!";

      trailerSrc =
        latest?.["video-link"] ||
        latest?.videoLink ||
        latest?.youtube ||
        "";
    } else {
      console.warn("Sheet fetch failed:", res.status);
      versionMessage = "A new version is available!";
    }
  } catch (err) {
    console.warn("Version fetch error:", err);
    versionMessage = "A new version is available!";
  }

  // Compare version numbers and decide to show popup
  if (sheetVersion !== CURRENT_VERSION && sheetVersion !== lastSeenVersion) {
    shouldShow = true;
  } else if (hideForever) {
    shouldShow = false;
  }

  if (!shouldShow) return;

  // Save latest version
  localStorage.setItem(LS_VER, sheetVersion);

  // === Inject message ===
  if (dom.updatePopupContent) dom.updatePopupContent.textContent = versionMessage;

  // === Handle YouTube trailer ===
  if (dom.updateVideo) {
    if (trailerSrc.includes("youtube.com") || trailerSrc.includes("youtu.be")) {
      dom.updateVideo.src = trailerSrc;
      dom.updateVideo.style.display = "block";
    } else {
      dom.updateVideo.style.display = "none";
    }
  }

  // Show popup after a short delay
  setTimeout(() => p.classList.add("show"), 600);

  // === Buttons ===
  dom.viewUpdateBtn?.addEventListener("click", () => {
    window.open(config.updateLink, "_self");
    p.classList.remove("show");
  });

  dom.viewUpdateInfoBtn?.addEventListener("click", () =>
    window.open(config.updateLink, "_blank")
  );

  dom.closeUpdateBtn?.addEventListener("click", () => {
    sessionStorage.setItem("ws_hideUpdateSession", "1");
    p.classList.remove("show");
  });

  dom.dontShowBtn?.addEventListener("click", () => {
    localStorage.setItem(LS_HIDE, "1");
    p.classList.remove("show");
  });

  // Clicking outside closes (session hide only)
  p.addEventListener("click", (e) => {
    if (e.target === p) {
      sessionStorage.setItem("ws_hideUpdateSession", "1");
      p.classList.remove("show");
    }
  });
}

  /* ---------------------------
     Asset Loader
     --------------------------- */
  async function loadAssets(retry = false) {
    showLoading("Loading assets...");
    updateProgress(5);

    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();
      const data = raw.filter((i) => Object.values(i).some((v) => safeStr(v).trim()));
      window.assetsData = data;
      updateProgress(35);

      const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
      let filtered = data;
      if (isFavPage) {
        filtered = [...window.favorites]
          ? data.filter((a) => window.favorites.has(safeStr(a.title).toLowerCase()))
          : [];
      }

      const promises = createAssetCards(filtered);
      updateProgress(55);
      await Promise.allSettled(promises.map((p) => p.promise));
      updateProgress(80);

      if (typeof renderPage === "function") renderPage();

      if (isFavPage && !filtered.length && dom.container)
        dom.container.innerHTML =
          "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";

      updateProgress(100);
      await delay(350);
      hidePreloader(true);
    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000);
      showLoading("⚠ Failed to load assets.");
      hidePreloader(true);
    }
  }

/* ---------------------------
   Quotes System (Improved Full-Screen Marquee)
   --------------------------- */
async function initQuotes() {
  const wrapper = document.getElementById("quoteWrapper");
  const quoteBox = document.getElementById("quoteBox");
  if (!wrapper || !quoteBox) return;

  const jsonPath = config.quotesPath;
  let quotes = [];

  const baseSpeed = 100; // pixels per second
  let position = 0;
  let lastTime = null;
  let paused = false;
  let currentMultiplier = 1;
  let targetMultiplier = 1;

  async function loadQuotes() {
    showLoading?.("Loading quotes...");
    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch quotes: ${res.status}`);
      const data = await res.json();
      quotes = Array.isArray(data) && data.length ? data : ["No quotes available."];
      startQuotes();
      hidePreloader?.();
    } catch (err) {
      console.error("Error loading quotes:", err);
      quotes = ["⚠ Failed to load quotes."];
      startQuotes();
      hidePreloader?.(true);
    }
  }

  function setRandomQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteBox.textContent = randomQuote;

    // Start fully off-screen on the right
    position = wrapper.offsetWidth + 10;
    quoteBox.style.transform = `translateX(${position}px)`;
  }

  function animate(timestamp) {
    if (lastTime !== null) {
      const delta = (timestamp - lastTime) / 1000;
      const accel = 2; // smoother easing when speed changes
      currentMultiplier += (targetMultiplier - currentMultiplier) * accel * delta;

      if (!paused) {
        position -= baseSpeed * currentMultiplier * delta;
        quoteBox.style.transform = `translateX(${position}px)`;
      }

      // When quote fully leaves the screen, pick a new one
      if (position < -quoteBox.offsetWidth - 10) {
        // Wait until it's completely gone before swapping
        setRandomQuote();
      }
    }

    lastTime = timestamp;
    requestAnimationFrame(animate);
  }

  // Hover & grab speed interactions
  wrapper.addEventListener("mouseenter", () => (targetMultiplier = 0.8));
  wrapper.addEventListener("mouseleave", () => (targetMultiplier = 1));
  quoteBox.addEventListener("mouseenter", () => (targetMultiplier = 0.4));
  quoteBox.addEventListener("mouseleave", () => (targetMultiplier = 1));

  wrapper.addEventListener("mousedown", () => {
    paused = true;
    quoteBox.style.cursor = "grabbing";
  });
  window.addEventListener("mouseup", () => {
    paused = false;
    quoteBox.style.cursor = "grab";
  });

  function startQuotes() {
    setRandomQuote();
    requestAnimationFrame(animate);
  }

  loadQuotes();
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
      initUpdatePopup();
      await loadAssets();
      initQuotes(); // ✅ integrated here
      console.log("✅ WannaSmile Loader + Quotes Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading("Initialization failed. Please reload.");
      hidePreloader(true);
    }
  });

  window.addEventListener("load", () => {
    if (typeof loadAssets === "function" && !window.assetsData)
      setTimeout(() => loadAssets().catch(() => {}), 100);
  });

  window.addEventListener("keydown", (e) => {
    const isIndex =
      location.pathname.endsWith("index.html") ||
      location.pathname === "/" ||
      location.pathname === "";
    if (!isIndex) return;
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (activeTag === "input" || activeTag === "textarea") return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      window.prevPage?.();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      window.nextPage?.();
    }
  });
})();
