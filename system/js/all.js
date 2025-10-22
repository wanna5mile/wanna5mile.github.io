/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Optimized & Hardened Version (with Sort Mode + Star Fix)
   ========================================================== */

(() => {
  "use strict";

  /* ---------------------------
     Utilities
     --------------------------- */
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
  const rafAsync = () => new Promise((r) => requestAnimationFrame(r));

  /* ---------------------------
     Sort Mode
     --------------------------- */
  function getSortMode() {
    return localStorage.getItem("sortMode") || "sheet";
  }

  document.addEventListener("sortModeChanged", (e) => {
    console.log("🔁 Sort mode changed:", e.detail);
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

    if (!dom.container) {
      console.warn("⚠ Elements not ready, retrying...");
      return setTimeout(initElements, 200);
    }

    window.config = {
      fallbackImage:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://wanna5mile.github.io./source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
    };

    console.log("Elements initialized:", dom);
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
    } catch (e) {
      console.warn("Failed reading favorites:", e);
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
      if (!window.assetsData || typeof createAssetCards !== "function") {
        console.warn("⚠ Cannot refresh cards — assets not ready.");
        return [];
      }
      const imagePromises = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
      return imagePromises;
    };

    console.log("Favorites initialized:", [...window.favorites]);
  }

  /* ---------------------------
     Preloader UI
     --------------------------- */
  function initPreloader() {
    const { preloader } = dom || {};
    if (!preloader) return;

    preloader.innerHTML = "";

    const progressText = document.createElement("div");
    const progressBar = document.createElement("div");
    const progressFill = document.createElement("div");

    progressText.className = "load-progress-text";
    progressBar.className = "load-progress-bar";
    progressFill.className = "load-progress-fill";
    progressBar.append(progressFill);
    preloader.append(progressText, progressBar);

    let lastProgress = -1;
    window.updateProgress = (percent) => {
      const clamped = clamp(Math.floor(percent), 0, 100);
      if (clamped === lastProgress) return;
      lastProgress = clamped;
      progressText.textContent = `Loading ${clamped}%`;
      progressFill.style.width = `${clamped}%`;
    };

    window.cyclePreloaderGifs = async (success = true) => {
      const { loaderImage } = dom;
      if (!loaderImage) return;
      const gifs = success
        ? [`${config.gifBase}loading.gif`, `${config.gifBase}load-fire.gif`]
        : [
            `${config.gifBase}loading.gif`,
            `${config.gifBase}crash.gif`,
            `${config.gifBase}ded.gif`,
          ];

      for (const gif of gifs) {
        loaderImage.src = gif;
        await delay(success ? 900 : 1200);
        await rafAsync();
      }
    };

    window.hidePreloader = (force = false) => {
      if (!preloader || preloader.dataset.hidden === "true") return;
      preloader.dataset.hidden = "true";
      preloader.style.transition = "opacity 0.45s ease";
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      setTimeout(() => (preloader.style.display = "none"), 500);
    };

    console.log("Preloader ready");
  }

  /* ---------------------------
     Asset Loader (Google Sheets)
     --------------------------- */
  async function loadAssets(retry = false) {
    if (!window.dom || !dom.preloader) {
      console.warn("DOM/preloader not ready, retrying...");
      return setTimeout(() => loadAssets(retry), 200);
    }

    showLoading("Loading assets...");
    updateProgress(5);

    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("Invalid data from Sheets");

      const data = raw.filter((item) =>
        item && Object.values(item).some((v) => safeStr(v).trim() !== "")
      );

      window.assetsData = data;

      const total = data.length || 1;
      let staged = [];
      for (let i = 0; i < data.length; i++) {
        staged.push(data[i]);
        if (i % 20 === 0) await rafAsync();
        updateProgress(10 + Math.floor(((i + 1) / total) * 60));
      }

      const imagePromises = createAssetCards(staged || []);
      const imgTotal = imagePromises.length || 1;
      let imgLoaded = 0;

      imagePromises.forEach(({ promise }) => {
        promise
          .then(() => {
            imgLoaded++;
            updateProgress(75 + Math.floor((imgLoaded / imgTotal) * 25));
          })
          .catch(() => {
            imgLoaded++;
            updateProgress(75 + Math.floor((imgLoaded / imgTotal) * 25));
          });
      });

      await Promise.allSettled(imagePromises.map((p) => p.promise));
      updateProgress(100);
      await delay(350);

      hidePreloader(true);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();

      console.log("Assets loaded successfully");
    } catch (err) {
      console.error("Error loading assets:", err);
      if (!retry) {
        console.warn("Retrying asset load...");
        return setTimeout(() => loadAssets(true), 1000);
      }
      showLoading("⚠ Failed to load assets.");
      await cyclePreloaderGifs(false);
      hidePreloader(true);
    }
  }

  function showLoading(text) {
    const { preloader } = dom || {};
    if (!preloader) return;
    let textEl = preloader.querySelector(".load-progress-text");
    if (!textEl) {
      textEl = document.createElement("div");
      textEl.className = "load-progress-text";
      preloader.appendChild(textEl);
    }
    textEl.textContent = text;
  }

  /* ---------------------------
     Create Asset Cards
     --------------------------- */
  function createAssetCards(data) {
    const { container } = dom || {};
    if (!container) return [];

    container.innerHTML = "";
    const imagePromises = [];
    const frag = document.createDocumentFragment();
    const isFav = (title) => window.favorites.has(safeStr(title).toLowerCase());
    const sortMode = getSortMode();

    const sorted = [...(data || [])].sort((a, b) => {
      const aTitle = safeStr(a.title).trim();
      const bTitle = safeStr(b.title).trim();
      const aFav = isFav(aTitle);
      const bFav = isFav(bTitle);
      if (aFav !== bFav) return bFav - aFav; // favorites always first

      if (sortMode === "alphabetical") {
        return aTitle.localeCompare(bTitle, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      } else {
        const aPage = Number(a.page) || 1;
        const bPage = Number(b.page) || 1;
        if (aPage !== bPage) return aPage - bPage;
        return aTitle.localeCompare(bTitle, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
    });

    for (const asset of sorted) {
      const safeTitle = safeStr(asset.title).trim();
      const safeAuthor = safeStr(asset.author).trim();
      const safeStatus = safeStr(asset.status).toLowerCase();
      const safeImage = safeStr(asset.image).trim();
      const safeLink = safeStr(asset.link).trim();
      const pageNum = Number(asset.page) || 1;

      const card = document.createElement("div");
      card.className = "asset-card";
      card.dataset.title = safeTitle.toLowerCase();
      card.dataset.author = safeAuthor.toLowerCase();
      card.dataset.page = String(pageNum);
      card.dataset.filtered = "true";

      const img = document.createElement("img");
      img.alt = safeTitle || "Asset";
      img.loading = "eager";
      let imageSrc = safeImage;
      if (!imageSrc || imageSrc === "blank" || safeStatus === "blank")
        imageSrc = config.fallbackImage;

      const imgLoadPromise = new Promise((resolve) => {
        const tmp = new Image();
        tmp.decoding = "async";
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

      imagePromises.push({ promise: imgLoadPromise, page: pageNum });

      const link = document.createElement("a");
      link.href =
        safeStatus === "soon" ? "javascript:void(0)" : safeLink || config.fallbackLink;
      if (safeStatus !== "soon") {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.style.pointerEvents = "none";
        link.setAttribute("aria-disabled", "true");
      }
      link.appendChild(img);

      const titleEl = document.createElement("h3");
      titleEl.textContent = safeTitle || "Untitled";
      link.appendChild(titleEl);

      const author = document.createElement("p");
      author.textContent = safeAuthor || " ";

      const star = document.createElement("button");
      star.className = "favorite-star";
      star.type = "button";
      star.setAttribute("aria-label", isFav(safeTitle) ? "Unfavorite" : "Favorite");
      star.textContent = isFav(safeTitle) ? "★" : "☆";
      // ✨ REMOVE background & border
      star.style.background = "transparent";
      star.style.border = "none";
      star.style.outline = "none";
      star.style.cursor = "pointer";

      star.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = safeTitle.toLowerCase();
        if (window.favorites.has(key)) window.favorites.delete(key);
        else window.favorites.add(key);
        saveFavorites();
        star.textContent = window.favorites.has(key) ? "★" : "☆";
        if (typeof window.refreshCards === "function") window.refreshCards();
      });

      if (safeStatus === "featured" || safeStatus === "fixed") {
        const overlay = document.createElement("img");
        overlay.className = `status-overlay ${safeStatus}`;
        overlay.alt = safeStatus;
        overlay.loading = "eager";
        overlay.src = `system/images/${safeStatus}.png`;
        const overlayPromise = new Promise((r) => {
          overlay.addEventListener("load", r, { once: true });
          overlay.addEventListener("error", r, { once: true });
        });
        imagePromises.push({ promise: overlayPromise, page: pageNum });
        card.appendChild(overlay);
      }

      card.append(link, author, star);
      frag.appendChild(card);
    }

    container.appendChild(frag);
    return imagePromises;
  }

  /* ---------------------------
     Paging & Filtering
     --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    window.getAllCards = () => Array.from(container.querySelectorAll(".asset-card"));
    window.getFilteredCards = () =>
      getAllCards().filter((c) => c.dataset.filtered === "true");
    window.getPages = () =>
      [...new Set(getFilteredCards().map((c) => parseInt(c.dataset.page, 10)))]
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b);

    window.renderPage = () => {
      const pages = getPages();
      const maxPage = pages.length ? Math.max(...pages) : 1;
      if (!pages.includes(window.currentPage))
        window.currentPage = pages[0] || 1;

      getAllCards().forEach((card) => {
        const visible =
          parseInt(card.dataset.page, 10) === window.currentPage &&
          card.dataset.filtered === "true";
        card.style.display = visible ? "" : "none";
      });

      if (pageIndicator)
        pageIndicator.textContent = `Page ${window.currentPage} of ${maxPage}`;
      try {
        sessionStorage.setItem("currentPage", String(window.currentPage));
      } catch {}
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
      if (!pages.length) return;
      const idx = pages.indexOf(window.currentPage);
      window.currentPage = idx <= 0 ? pages.at(-1) : pages[idx - 1];
      renderPage();
    };

    window.nextPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const idx = pages.indexOf(window.currentPage);
      window.currentPage =
        idx === pages.length - 1 ? pages[0] : pages[idx + 1];
      renderPage();
    };

    if (searchInput && searchBtn) {
      searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
      searchInput.addEventListener("input", debounce(() => filterAssets(searchInput.value), 200));
    }

    window.currentPage = Number(sessionStorage.getItem("currentPage")) || 1;

    const observer = new MutationObserver(
      debounce(() => {
        if (typeof renderPage === "function") renderPage();
      }, 120)
    );
    observer.observe(container, { childList: true });

    renderPage();
  }

  /* ---------------------------
     Placeholder cycling
     --------------------------- */
  function initPlaceholders() {
    const { searchInput } = dom || {};
    if (!searchInput) return;

    const FADE_DURATION = 400;
    const HOLD_DURATION = 4000;

    window.fadePlaceholder = (input, text, cb) => {
      input.classList.add("fade-out");
      setTimeout(() => {
        input.placeholder = text;
        input.classList.remove("fade-out");
        input.classList.add("fade-in");
        setTimeout(() => {
          input.classList.remove("fade-in");
          if (typeof cb === "function") cb();
        }, FADE_DURATION);
      }, FADE_DURATION);
    };

    window.startPlaceholderCycle = () => {
      if (window._placeholderRunning) return;
      window._placeholderRunning = true;

      const loop = async () => {
        try {
          const visible = getFilteredCards().filter(
            (c) => parseInt(c.dataset.page, 10) === window.currentPage
          ).length;
          await new Promise((r) => {
            fadePlaceholder(searchInput, `${visible} assets on this page`, () => r());
          });
          await delay(HOLD_DURATION);
          await new Promise((r) => {
            fadePlaceholder(searchInput, "Search assets...", () => r());
          });
          await delay(HOLD_DURATION);
          if (window._placeholderRunning) loop();
        } catch {
          window._placeholderRunning = false;
        }
      };

      loop();
    };

    window.stopPlaceholderCycle = () => {
      window._placeholderRunning = false;
    };
  }

  /* ---------------------------
     DOMContentLoaded bootstrap
     --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      initElements();
      initFavorites();
      initPreloader();
      initPaging();
      initPlaceholders();

      try {
        await loadAssets();
      } catch (err) {
        console.error("❌ Startup asset load failed:", err);
        showLoading("Error loading assets. Retrying...");
        await delay(1500);
        await loadAssets(true);
      }

      console.log("✅ WannaSmile Unified Loader Initialized Successfully");
    } catch (err) {
      console.error("❌ Critical initialization error:", err);
      showLoading("Initialization failed. Please reload the page.");
      await cyclePreloaderGifs(false);
      hidePreloader(true);
    }
  });

  /* ==========================================================
     End of Unified JS Loader
     ========================================================== */
})();
