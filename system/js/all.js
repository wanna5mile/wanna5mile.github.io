/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Final Optimized — Real Progress + Pre-paged Cards
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
    const getEl = (sel) => document.getElementById(sel) || document.querySelector(sel);

    window.dom = {
      container: getEl("container"),
      preloader: getEl("preloader"),
      loaderImage: getEl("loaderImage"),
      pageIndicator: getEl(".page-indicator"),
      searchInput: getEl("searchInputHeader"),
      searchBtn: getEl("searchBtnHeader"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io./source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
    };
  }

  /* ---------------------------
     Favorites System (Fixed)
     --------------------------- */
  function initFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(Array.isArray(stored) ? stored.map((s) => safeStr(s).toLowerCase()) : []);
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = function saveFavorites() {
      try {
        localStorage.setItem("favorites", JSON.stringify([...window.favorites]));
      } catch (e) {
        console.error("Failed to save favorites:", e);
      }
    };

    window.refreshCards = function refreshCards() {
      if (!window.assetsData || typeof createAssetCards !== "function") return;
      const promises = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
      return promises;
    };
  }

  /* ---------------------------
     Preloader UI (No duplicate counters)
     --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.dataset.hidden = "false";

    // find or create counter elements (single instance)
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
      if (counter) counter.textContent = `${clamped}%`;
      if (fill) fill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) => {
      const label = preloader.querySelector(".loading-text");
      if (label) label.textContent = text;
    };

    window.hidePreloader = (force = false) => {
      if (preloader.dataset.hidden === "true") return;
      // only allow hide if force or progress reached 100
      const currentPct = parseInt((dom.loaderText && dom.loaderText.textContent) || "0", 10);
      if (!force && isNaN(currentPct)) return;
      if (!force && currentPct < 100) return;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };
  }

  /* ---------------------------
     Asset Card Builder (append hidden, pre-paging)
     --------------------------- */
  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return [];

    // clear and build the DOM fragment, but keep each card hidden initially
    container.innerHTML = "";
    const imagePromises = [];
    const frag = document.createDocumentFragment();
    const sortMode = getSortMode();
    const isFav = (t) => window.favorites.has(safeStr(t).toLowerCase());

    let sorted = Array.isArray(data) ? [...data] : [];
    if (sortMode === "alphabetical") {
      sorted.sort((a, b) =>
        safeStr(a.title).localeCompare(safeStr(b.title), undefined, { numeric: true, sensitivity: "base" })
      );
    }

    for (const asset of sorted) {
      const title = safeStr(asset.title).trim();
      const author = safeStr(asset.author).trim();
      const imageSrc = safeStr(asset.image).trim() || config.fallbackImage;
      const link = safeStr(asset.link).trim() || config.fallbackLink;
      const pageNum = Number(asset.page) || 1;
      const status = safeStr(asset.status).toLowerCase().trim();
      const gifFile = `${config.gifBase}${status}.gif`;

      const card = document.createElement("div");
      card.className = "asset-card";
      card.dataset.title = title.toLowerCase();
      card.dataset.author = author.toLowerCase();
      card.dataset.page = String(pageNum);
      card.dataset.filtered = "true";
      // keep hidden until renderPage decides visibility
      card.style.display = "none";

      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "asset-link";

      const img = document.createElement("img");
      img.alt = title;
      img.loading = "eager";

      // create image load promise
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

      if (status && ["soon", "new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = gifFile;
        overlay.alt = status;
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
      Object.assign(star.style, { background: "transparent", border: "none", cursor: "pointer" });

      star.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = title.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        // use window.saveFavorites to ensure global function called
        if (typeof window.saveFavorites === "function") window.saveFavorites();
        star.textContent = window.favorites.has(key) ? "★" : "☆";
      });

      card.append(a, titleEl, authorEl, star);
      frag.appendChild(card);
    }

    container.appendChild(frag);
    return imagePromises;
  }

  /* ---------------------------
     Asset Loader (accurate progress & pre-paging)
     --------------------------- */
  async function loadAssets(retry = false) {
    showLoading("Loading assets...");
    updateProgress(5);

    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("Invalid data from Sheets");

      // filter out empty rows
      const data = raw.filter((row) => Object.values(row).some((v) => safeStr(v).trim() !== ""));
      window.assetsData = data;

      // small progress bump
      updateProgress(25);

      // create all cards but keep them hidden; we get back image promises
      const promises = createAssetCards(data);
      updateProgress(35);

      // calculate progressive updates while images load in parallel
      const total = promises.length || 1;
      let completed = 0;

      // attach individual handlers to update progress as images resolve
      promises.forEach((p) => {
        p.promise.then(() => {
          completed++;
          // map completed/total to a progress window e.g., 35 -> 95
          const pct = 35 + Math.floor((completed / total) * 60); // 35..95
          updateProgress(pct);
        }).catch(() => {
          completed++;
          const pct = 35 + Math.floor((completed / total) * 60);
          updateProgress(pct);
        });
      });

      // wait until all images finish
      await Promise.allSettled(promises.map((p) => p.promise));

      // ensure pages are calculated and renderPage runs BEFORE we reach 100
      if (typeof renderPage === "function") {
        renderPage();
      }

      updateProgress(100);
      // slight delay so users can see 100% briefly and DOM settle
      await delay(250);
      hidePreloader(true);

      // start placeholder cycle after load completes
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000);
      showLoading("⚠ Failed to load assets.");
      hidePreloader(true);
    }
  }

  /* ---------------------------
     Paging + Search + Filter
     --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    window.getAllCards = () => Array.from(container.querySelectorAll(".asset-card"));
    window.getFilteredCards = () => getAllCards().filter((c) => c.dataset.filtered === "true");

    window.getPages = () =>
      [...new Set(getFilteredCards().map((c) => +c.dataset.page))]
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

    window.renderPage = () => {
      const pages = getPages();
      const maxPage = pages.length ? Math.max(...pages) : 1;
      if (!pages.includes(window.currentPage)) window.currentPage = pages[0] || 1;

      getAllCards().forEach((card) => {
        const visible = +card.dataset.page === window.currentPage && card.dataset.filtered === "true";
        card.style.display = visible ? "" : "none";
      });

      if (pageIndicator) pageIndicator.textContent = `Page ${window.currentPage} of ${maxPage}`;
    };

    const debounce = (fn, ms = 150) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
      };
    };

    window.filterAssets = (query) => {
      const q = safeStr(query).toLowerCase().trim();
      getAllCards().forEach((card) => {
        const match = !q || card.dataset.title.includes(q) || card.dataset.author.includes(q);
        card.dataset.filtered = match ? "true" : "false";
      });
      renderPage();
    };

    window.prevPage = () => {
      const pages = getPages();
      const idx = pages.indexOf(window.currentPage);
      window.currentPage = idx <= 0 ? pages.at(-1) : pages[idx - 1];
      renderPage();
    };

    window.nextPage = () => {
      const pages = getPages();
      const idx = pages.indexOf(window.currentPage);
      window.currentPage = idx === pages.length - 1 ? pages[0] : pages[idx + 1];
      renderPage();
    };

    if (searchInput && searchBtn) {
      searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
      searchInput.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));
    }

    window.currentPage = 1;
    // renderPage will be invoked after createAssetCards completes image loading
  }

  /* ---------------------------
     Placeholder Cycle
     --------------------------- */
  function initPlaceholders() {
    const { searchInput } = dom || {};
    if (!searchInput) return;

    const FADE = 400;
    const HOLD = 4000;

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
          const visible = getFilteredCards().filter((c) => +c.dataset.page === window.currentPage).length;
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
     DOM Bootstrap
     --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPreloader();
      initPaging();
      initPlaceholders();
      await loadAssets();
      console.log("✅ WannaSmile Loader Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading("Initialization failed. Please reload.");
      hidePreloader(true);
    }
  });
})();
