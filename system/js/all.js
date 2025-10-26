/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Final Hardened & Optimized Version (with Progress Bar + Fixed Favorites + Popup)
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
    console.log("Sort mode changed:", e?.detail);
    if (window.assetsData && typeof window.refreshCards === "function") {
      window.refreshCards();
    }
  });

  /* ---------------------------
     DOM & Config Initialization
     --------------------------- */
  function initElements() {
    // helper that accepts either id or selector
    const getEl = (sel) => {
      if (!sel) return null;
      // if string looks like an id (no selector punctuation) try id first
      const tryById = /^[A-Za-z0-9\-_]+$/.test(sel) && document.getElementById(sel);
      if (tryById) return tryById;
      try {
        return document.querySelector(sel) || document.getElementById(sel) || null;
      } catch {
        return document.getElementById(sel) || null;
      }
    };

    window.dom = {
      container: getEl("container"),
      preloader: getEl("preloader"),
      loaderImage: getEl("loaderImage"),
      pageIndicator: getEl(".page-indicator") || getEl("page-indicator"),
      searchInput: getEl("searchInputHeader"),
      searchBtn: getEl("searchBtnHeader"),
      updatePopup: getEl("#updatePopup") || getEl("updatePopup"),
      updatePopupContent: getEl(".update-popup-content"),
      viewUpdateBtn: getEl("#viewUpdateBtn"),
      viewUpdateInfoBtn: getEl("#viewUpdateInfoBtn"),
      closeUpdateBtn: getEl("#closeUpdateBtn"),
      dontShowBtn: getEl("#dontShowBtn"),
      updateVideo: getEl("#updateVideo"),
    };

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io./source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateTrailerSrc: "", // set if you want a default trailer url
      updateLink: "system/pages/version-log.html", // where "Check it out" goes
    };
  }

  /* ---------------------------
     Favorites System (Fixed)
     --------------------------- */
  function initFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(
        Array.isArray(stored)
          ? stored.map((s) => safeStr(s).toLowerCase())
          : []
      );
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = function saveFavorites() {
      try {
        localStorage.setItem(
          "favorites",
          JSON.stringify([...window.favorites])
        );
      } catch (e) {
        console.error("❌ Failed to save favorites:", e);
      }
    };

    window.refreshCards = function refreshCards() {
      if (!window.assetsData || typeof createAssetCards !== "function") return;
      const promises = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
      return promises;
    };

    console.log("✅ Favorites initialized:", [...window.favorites]);
  }

  /* ---------------------------
     Preloader UI (No Duplicates)
     --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.dataset.hidden = "false";

    // --- Use existing elements if available ---
    let counter = preloader.querySelector("#counter") || preloader.querySelector("#loaderText");
    let bar = preloader.querySelector(".load-progress-bar");
    let fill = preloader.querySelector(".load-progress-fill");

    // --- Create only if missing ---
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

    // --- Bind globals ---
    dom.loaderText = counter;
    dom.progressBarFill = fill;

    // --- Progress update logic ---
    window.updateProgress = (p) => {
      const clamped = clamp(Math.round(p), 0, 100);
      if (counter) counter.textContent = `${clamped}%`;
      if (fill) fill.style.width = `${clamped}%`;
    };

    window.showLoading = (text) => {
      const label = preloader.querySelector(".loading-text") || dom.loaderText;
      if (label) label.textContent = text;
    };

    window.hidePreloader = (force = false) => {
      if (preloader.dataset.hidden === "true") return;
      const opacity = parseFloat(preloader.style.opacity || "1");
      if (!force && opacity < 1) return; // ensure progress hits 100
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };

    console.log("Preloader initialized (single counter, single bar)");
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
      // default filtered true so the card participates in pagination
      card.dataset.filtered = "true";

      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "asset-link";

      // Image (safe async load)
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

      // Status GIF
      if (status && ["soon", "new", "updated"].includes(status)) {
        const overlay = document.createElement("img");
        overlay.src = gifFile;
        overlay.alt = status;
        overlay.className = `status-gif status-${status}`;
        a.appendChild(overlay);
        if (status === "soon") card.classList.add("soon");
      }

      // Title / Author
      const titleEl = document.createElement("h3");
      titleEl.textContent = title || "Untitled";
      const authorEl = document.createElement("p");
      authorEl.textContent = author || "";

      // Favorite Star
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
    // after cards are added, ensure page rendering runs externally (renderPage)
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

    // Filter out empty rows
    const data = raw.filter((i) =>
      Object.values(i).some((v) => safeStr(v).trim() !== "")
    );

    window.assetsData = data;
    updateProgress(35);

    // Step 1: Create asset cards for each record
    const promises = createAssetCards(data);
    updateProgress(55);

    // Step 2: Wait for all image assets to finish loading
    await Promise.allSettled(promises.map((p) => p.promise));
    updateProgress(80);

    // Step 3: Determine available pages (before showing anything)
    if (typeof getPages === "function") {
      const pages = getPages();
      window.currentPage = pages[0] || 1;
    }

    // Step 4: Render proper page layout
    if (typeof renderPage === "function") renderPage();

    // Step 5: Allow UI time to stabilize before fade-out
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
     Paging + Search + Filter
     --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    window.getAllCards = () =>
      Array.from(container.querySelectorAll(".asset-card"));
    window.getFilteredCards = () =>
      getAllCards().filter((c) => c.dataset.filtered === "true");

    // returns sorted list of distinct page numbers (e.g. [1,2,3])
    window.getPages = () => {
      const pages = [...new Set(getFilteredCards().map((c) => {
        const n = Number(c.dataset.page);
        return isNaN(n) ? null : n;
      }).filter(Boolean))].sort((a, b) => a - b);
      return pages;
    };

    window.renderPage = () => {
      const pages = getPages();
      const totalPages = pages.length;
      // if there are no pages, clear everything
      if (!totalPages) {
        window.currentPage = 1;
        getAllCards().forEach((card) => (card.style.display = "none"));
        if (pageIndicator) pageIndicator.textContent = `No pages`;
        return;
      }

      // keep the current page as one of the pages, otherwise reset to first page
      if (!pages.includes(window.currentPage)) {
        window.currentPage = pages[0];
      }

      // show/hide cards based on page + filtered flag
      getAllCards().forEach((card) => {
        const visible =
          +card.dataset.page === +window.currentPage &&
          card.dataset.filtered === "true";
        card.style.display = visible ? "" : "none";
      });

      // show the page index in human readable form: "Page 2 of 5" where 2 is index in pages
      if (pageIndicator) {
        const idx = pages.indexOf(+window.currentPage);
        pageIndicator.textContent = `Page ${idx + 1} of ${totalPages}`;
      }
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
      // after filtering we should reset to first available page for convenience
      const pages = getPages();
      window.currentPage = pages[0] || 1;
      renderPage();
    };

    window.prevPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const idx = pages.indexOf(+window.currentPage);
      if (idx <= 0) window.currentPage = pages[pages.length - 1];
      else window.currentPage = pages[idx - 1];
      renderPage();
    };

    window.nextPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const idx = pages.indexOf(+window.currentPage);
      if (idx === -1 || idx === pages.length - 1) window.currentPage = pages[0];
      else window.currentPage = pages[idx + 1];
      renderPage();
    };

    if (searchInput && searchBtn) {
      searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
      searchInput.addEventListener(
        "input",
        debounce(() => filterAssets(searchInput.value), 200)
      );
    }

    // default start at first page if any exist
    window.currentPage = 1;
    renderPage();
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
          const visible = getFilteredCards().filter(
            (c) => +c.dataset.page === +window.currentPage
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
     Update Popup initializer
     --------------------------- */
  function initUpdatePopup() {
    const p = dom.updatePopup;
    if (!p) return;

    // check stored preference
    const dontShow = localStorage.getItem("ws_hideUpdate") === "1";
    if (dontShow) {
      p.classList.remove("show");
      return;
    }

    // Populate video src if config has one
    if (dom.updateVideo && config.updateTrailerSrc) {
      dom.updateVideo.src = config.updateTrailerSrc;
    }

    // show popup after a short delay (only if not hidden)
    setTimeout(() => p.classList.add("show"), 600);

    // wire buttons
    dom.viewUpdateBtn?.addEventListener("click", () => {
      window.open(config.updateLink, "_self");
      p.classList.remove("show");
    });
    dom.viewUpdateInfoBtn?.addEventListener("click", () => {
      window.open(config.updateLink, "_blank");
    });
    dom.closeUpdateBtn?.addEventListener("click", () => {
      p.classList.remove("show");
      // remember it was shown (optional)
      localStorage.setItem("ws_updateLastSeen", Date.now().toString());
    });
    dom.dontShowBtn?.addEventListener("click", () => {
      localStorage.setItem("ws_hideUpdate", "1");
      p.classList.remove("show");
    });

    // allow clicking the overlay to close
    p.addEventListener("click", (ev) => {
      if (ev.target === p) p.classList.remove("show");
    });
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
      console.log("WannaSmile Loader Ready");
    } catch (err) {
      console.error("Initialization failed:", err);
      showLoading("Initialization failed. Please reload.");
      hidePreloader(true);
    }
  });

  // safety: also try a window load fallback for environments where DOMContentLoaded has already fired
  window.addEventListener("load", () => {
    // trigger a small check to ensure assets load if DOMContentLoaded was missed
    if (typeof loadAssets === "function" && !window.assetsData) {
      setTimeout(() => {
        try { loadAssets(); } catch {}
      }, 100);
    }
  });
})();
