/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Final Optimized Version
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
    console.log("Sort mode changed:", e.detail);
    if (window.assetsData && typeof window.refreshCards === "function") {
      window.refreshCards();
    }
  });

  /* ---------------------------
     DOM & Config Initialization
     --------------------------- */
  function initElements() {
    const getEl = (sel) =>
      document.getElementById(sel) || document.querySelector(sel);

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
     Favorites System (No Refresh)
     --------------------------- */
  function initFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(
        Array.isArray(stored) ? stored.map((s) => safeStr(s).toLowerCase()) : []
      );
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
     Preloader UI (Fixed Visibility)
     --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.dataset.hidden = "false";

    const counter = document.getElementById("counter");
    window.updateProgress = (p) => {
      const clamped = clamp(p, 0, 100);
      if (counter) counter.textContent = `${clamped}%`;
    };

    window.showLoading = (text) => {
      const label = preloader.querySelector(".loading-text");
      if (label) label.textContent = text;
    };

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

    let sorted = [...data];
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

      // Link
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "asset-link";

      // Image
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

      // Status GIF Overlay
      if (status && ["soon", "new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = gifFile;
        overlay.alt = status;
        overlay.className = `status-gif status-${status}`;
        a.appendChild(overlay);
      }

      // Title + Author
      const titleEl = document.createElement("h3");
      titleEl.textContent = title || "Untitled";
      const authorEl = document.createElement("p");
      authorEl.textContent = author || "";

      // Favorite star
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
     Asset Loader (Google Sheets)
     --------------------------- */
  async function loadAssets(retry = false) {
    showLoading("Loading assets...");
    updateProgress(5);

    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("Invalid data from Sheets");

      const data = raw.filter((i) =>
        Object.values(i).some((v) => safeStr(v).trim() !== "")
      );

      window.assetsData = data;
      updateProgress(30);

      const promises = createAssetCards(data);
      updateProgress(80);
      await Promise.allSettled(promises.map((p) => p.promise));

      updateProgress(100);
      await delay(300);
      hidePreloader(true);
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

    window.getAllCards = () =>
      Array.from(container.querySelectorAll(".asset-card"));
    window.getFilteredCards = () =>
      getAllCards().filter((c) => c.dataset.filtered === "true");

    window.getPages = () =>
      [...new Set(getFilteredCards().map((c) => +c.dataset.page))]
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

    window.renderPage = () => {
      const pages = getPages();
      const maxPage = pages.length ? Math.max(...pages) : 1;
      if (!pages.includes(window.currentPage))
        window.currentPage = pages[0] || 1;

      getAllCards().forEach((card) => {
        const visible =
          +card.dataset.page === window.currentPage &&
          card.dataset.filtered === "true";
        card.style.display = visible ? "" : "none";
      });

      if (pageIndicator)
        pageIndicator.textContent = `Page ${window.currentPage} of ${maxPage}`;
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
        const match =
          !q ||
          card.dataset.title.includes(q) ||
          card.dataset.author.includes(q);
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
      window.currentPage =
        idx === pages.length - 1 ? pages[0] : pages[idx + 1];
      renderPage();
    };

    if (searchInput && searchBtn) {
      searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
      searchInput.addEventListener(
        "input",
        debounce(() => filterAssets(searchInput.value), 200)
      );
    }

    window.currentPage = 1;
    renderPage();
  }

  /* ---------------------------
     Placeholder Cycling
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
          const visible = getFilteredCards().filter(
            (c) => +c.dataset.page === window.currentPage
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
      console.log("WannaSmile Loader Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading("Initialization failed. Please reload.");
      hidePreloader(true);
    }
  });
})();
