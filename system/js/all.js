/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Optimized Final — Clean Logic & Streamlined DOM Ops
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
  document.addEventListener("sortModeChanged", () => {
    if (window.assetsData && typeof window.refreshCards === "function") {
      window.refreshCards();
    }
  });

  /* ---------------------------
     DOM & Config Setup
     --------------------------- */
  function initElements() {
    const $ = (sel) => document.getElementById(sel) || document.querySelector(sel);

    window.dom = {
      container: $("container"),
      preloader: $("preloader"),
      loaderImage: $("loaderImage"),
      pageIndicator: $(".page-indicator"),
      searchInput: $("searchInputHeader"),
      searchBtn: $("searchBtnHeader"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io./source/dino/", // keep the extra dot
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
    };
  }

  /* ---------------------------
     Favorites System
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

    window.saveFavorites = () => {
      try {
        localStorage.setItem("favorites", JSON.stringify([...window.favorites]));
      } catch (e) {
        console.error("Failed to save favorites:", e);
      }
    };

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

    Object.assign(preloader.style, { display: "flex", opacity: "1" });
    preloader.dataset.hidden = "false";

    const ensureEl = (cls, tag = "div") => {
      let el = preloader.querySelector(cls);
      if (!el) {
        el = document.createElement(tag);
        if (cls.startsWith("#")) el.id = cls.slice(1);
        else el.className = cls.replace(/^\./, "");
        preloader.appendChild(el);
      }
      return el;
    };

    const counter = ensureEl("#counter");
    const bar = ensureEl(".load-progress-bar");
    const fill = ensureEl(".load-progress-fill");

    if (!bar.contains(fill)) bar.appendChild(fill);

    dom.loaderText = counter;
    dom.progressBarFill = fill;

    window.updateProgress = (p) => {
      const clamped = clamp(Math.round(p), 0, 100);
      counter.textContent = `${clamped}%`;
      fill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) => {
      const label = preloader.querySelector(".loading-text");
      if (label) label.textContent = text;
    };

    window.hidePreloader = (force = false) => {
      if (preloader.dataset.hidden === "true") return;
      const currentPct = parseInt(counter.textContent || "0", 10);
      if (!force && (isNaN(currentPct) || currentPct < 100)) return;

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
    const frag = document.createDocumentFragment();
    const promises = [];
    const sortMode = getSortMode();
    const isFav = (t) => window.favorites.has(safeStr(t).toLowerCase());

    const sorted = Array.isArray(data)
      ? sortMode === "alphabetical"
        ? [...data].sort((a, b) =>
            safeStr(a.title).localeCompare(safeStr(b.title), undefined, {
              numeric: true,
              sensitivity: "base",
            })
          )
        : [...data]
      : [];

    for (const asset of sorted) {
      const title = safeStr(asset.title).trim();
      const author = safeStr(asset.author).trim();
      const imageSrc = safeStr(asset.image).trim() || config.fallbackImage;
      const link = safeStr(asset.link).trim() || config.fallbackLink;
      const pageNum = +asset.page || 1;
      const status = safeStr(asset.status).toLowerCase().trim();
      const gifFile = `${config.gifBase}${status}.gif`;

      const card = Object.assign(document.createElement("div"), {
        className: "asset-card",
        dataset: {
          title: title.toLowerCase(),
          author: author.toLowerCase(),
          page: pageNum,
          filtered: "true",
        },
        style: { display: "none" },
      });

      const a = Object.assign(document.createElement("a"), {
        href: link,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "asset-link",
      });

      const img = Object.assign(document.createElement("img"), {
        alt: title,
        loading: "eager",
      });

      const imgPromise = new Promise((resolve) => {
        const tmp = new Image();
        tmp.onload = () => ((img.src = imageSrc), resolve());
        tmp.onerror = () => ((img.src = config.fallbackImage), resolve());
        tmp.src = imageSrc;
      });

      promises.push({ promise: imgPromise, page: pageNum });
      a.appendChild(img);

      if (["soon", "new", "updated"].includes(status)) {
        const overlay = Object.assign(document.createElement("img"), {
          src: gifFile,
          alt: status,
          className: `status-gif status-${status}`,
        });
        a.appendChild(overlay);
      }

      const titleEl = document.createElement("h3");
      titleEl.textContent = title || "Untitled";
      const authorEl = document.createElement("p");
      authorEl.textContent = author || "";

      const star = Object.assign(document.createElement("button"), {
        className: "favorite-star",
        textContent: isFav(title) ? "★" : "☆",
      });
      Object.assign(star.style, { background: "transparent", border: "none", cursor: "pointer" });

      star.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = title.toLowerCase();
        window.favorites.has(key)
          ? window.favorites.delete(key)
          : window.favorites.add(key);
        window.saveFavorites?.();
        star.textContent = window.favorites.has(key) ? "★" : "☆";
      });

      card.append(a, titleEl, authorEl, star);
      frag.appendChild(card);
    }

    container.appendChild(frag);
    return promises;
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
      if (!Array.isArray(raw)) throw new Error("Invalid sheet data");

      const data = raw.filter((r) => Object.values(r).some((v) => safeStr(v).trim() !== ""));
      window.assetsData = data;
      updateProgress(25);

      const promises = createAssetCards(data);
      updateProgress(35);

      const total = promises.length || 1;
      let done = 0;

      for (const p of promises) {
        p.promise
          .then(() => {
            done++;
            updateProgress(35 + Math.floor((done / total) * 60));
          })
          .catch(() => {
            done++;
            updateProgress(35 + Math.floor((done / total) * 60));
          });
      }

      await Promise.allSettled(promises.map((p) => p.promise));
      renderPage?.();
      updateProgress(100);
      await delay(250);
      hidePreloader(true);
      startPlaceholderCycle?.();
    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) return setTimeout(() => loadAssets(true), 1000);
      showLoading("⚠ Failed to load assets.");
      hidePreloader(true);
    }
  }

  /* ---------------------------
     Paging + Search
     --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    const getAllCards = () => Array.from(container.querySelectorAll(".asset-card"));
    const getFilteredCards = () => getAllCards().filter((c) => c.dataset.filtered === "true");
    const getPages = () =>
      [...new Set(getFilteredCards().map((c) => +c.dataset.page))]
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

    window.renderPage = () => {
      const pages = getPages();
      const max = pages.length ? Math.max(...pages) : 1;
      if (!pages.includes(window.currentPage)) window.currentPage = pages[0] || 1;

      getAllCards().forEach((c) => {
        const visible = +c.dataset.page === window.currentPage && c.dataset.filtered === "true";
        c.style.display = visible ? "" : "none";
      });
      if (pageIndicator) pageIndicator.textContent = `Page ${window.currentPage} of ${max}`;
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
      getAllCards().forEach((c) => {
        const match = !q || c.dataset.title.includes(q) || c.dataset.author.includes(q);
        c.dataset.filtered = match ? "true" : "false";
      });
      renderPage();
    };

    window.prevPage = () => {
      const pages = getPages();
      const i = pages.indexOf(window.currentPage);
      window.currentPage = i <= 0 ? pages.at(-1) : pages[i - 1];
      renderPage();
    };

    window.nextPage = () => {
      const pages = getPages();
      const i = pages.indexOf(window.currentPage);
      window.currentPage = i === pages.length - 1 ? pages[0] : pages[i + 1];
      renderPage();
    };

    searchBtn?.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput?.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));
    window.currentPage = 1;
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
            `.asset-card[data-page="${window.currentPage}"][data-filtered="true"]`
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
     Bootstrap
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
