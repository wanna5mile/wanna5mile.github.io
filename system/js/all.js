/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Preloader-Free Rewrite
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
        "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/404_blank.png",
      fallbackLink: "https://01110010-00110101.github.io./source/dino/",
      gifBase:
        "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/GIF/",
      sheetUrl:
        "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
      updateTrailerSrc: "",
      updateLink: "system/pages/version-log.html",
      quotesJson:
        "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/json/quotes.json",
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
      if (!window.assetsData || typeof createAssetCards !== "function") return [];
      const promises = createAssetCards(window.assetsData);
      if (typeof renderPage === "function") renderPage();
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
      return promises;
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

    const badgeMap = {
      featured:
        "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/featured-cover.png",
      new:
        "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/new-cover.png",
      fixed:
        "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/fixed-cover.png",
      fix:
        "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/fixing.png",
    };

    for (const asset of sorted) {
      const title = safeStr(asset.title).trim();
      const author = safeStr(asset.author).trim();
      const imageSrc = safeStr(asset.image) || config.fallbackImage;
      const link = safeStr(asset.link) || config.fallbackLink;
      const pageNum = Number(asset.page) || 1;
      const status = safeStr(asset.status).toLowerCase();
      const statusField = safeStr(asset.type || asset.status || "").toLowerCase();

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

      const wrapper = document.createElement("div");
      wrapper.className = "asset-img-wrapper";
      Object.assign(wrapper.style, {
        position: "relative",
        display: "inline-block",
        borderRadius: "14px",
        overflow: "hidden",
      });

      const img = document.createElement("img");
      img.alt = title;
      img.loading = "eager";
      img.className = "asset-img";

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

      const addOverlay = (src, alt, cls, fullCover = false) => {
        const o = document.createElement("img");
        o.src = src;
        o.alt = alt;
        o.className = `status-overlay ${cls}`;
        Object.assign(o.style, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
          zIndex: fullCover ? "10" : "5",
        });
        wrapper.appendChild(o);
      };

      if (statusField === "featured")
        addOverlay(badgeMap.featured, "featured badge", "overlay-featured");
      if (statusField === "new")
        addOverlay(badgeMap.new, "new badge", "overlay-new");
      if (statusField === "fixed")
        addOverlay(badgeMap.fixed, "fixed badge", "overlay-fixed");

      if (["new", "updated"].includes(status))
        addOverlay(
          `${config.gifBase}${status}.gif`,
          `${status} badge`,
          `status-gif status-${status}`
        );

      if (status === "fix") {
        addOverlay(badgeMap.fix, "fixing overlay", "overlay-fix", true);
        card.classList.add("fix");
      }

      if (status === "soon") card.classList.add("soon");

      a.appendChild(wrapper);

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
     Paging + Search + Filter
  --------------------------- */
  function initPaging() {
    const { container, pageIndicator, searchInput, searchBtn } = dom || {};
    if (!container) return;

    const quoteWrapper = document.getElementById("quoteWrapper");

    let errorGif = document.getElementById("noResultsGif");
    if (!errorGif) {
      errorGif = document.createElement("img");
      errorGif.id = "noResultsGif";
      errorGif.src = "system/images/GIF/searching.gif";
      Object.assign(errorGif.style, {
        display: "none",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "128px",
        height: "128px",
        opacity: "0",
        transition: "opacity 0.25s ease",
        pointerEvents: "none",
        zIndex: "1000",
      });
      container.parentElement.appendChild(errorGif);
    }

    const getAllCards = () => [...container.querySelectorAll(".asset-card")];
    const getFilteredCards = () =>
      getAllCards().filter((c) => c.dataset.filtered === "true");
    const getPages = () =>
      [...new Set(getAllCards().map((c) => +c.dataset.page).filter(Boolean))].sort(
        (a, b) => a - b
      );

    const updateVisibility = () => {
      const visibleCards = getFilteredCards().length;
      if (visibleCards === 0) {
        errorGif.style.display = "block";
        requestAnimationFrame(() => (errorGif.style.opacity = "1"));
        if (quoteWrapper) quoteWrapper.style.opacity = "0.5";
      } else {
        errorGif.style.opacity = "0";
        setTimeout(() => {
          if (parseFloat(errorGif.style.opacity) === 0)
            errorGif.style.display = "none";
        }, 250);
        if (quoteWrapper) quoteWrapper.style.opacity = "1";
      }
    };

    window.renderPage = () => {
      const pages = getPages();
      if (!pages.length) return;

      if (!window._pageRestored) {
        const saved = +sessionStorage.getItem("currentPage") || pages[0];
        window.currentPage = pages.includes(saved) ? saved : pages[0];
        window._pageRestored = true;
      }

      getAllCards().forEach((c) => {
        const visible =
          +c.dataset.page === +window.currentPage &&
          c.dataset.filtered === "true";
        c.style.display = visible ? "" : "none";
      });

      if (pageIndicator) {
        const idx = pages.indexOf(+window.currentPage);
        pageIndicator.textContent = `Page ${idx + 1} of ${pages.length}`;
      }

      sessionStorage.setItem("currentPage", window.currentPage);
      updateVisibility();
    };

    window.filterAssets = (q) => {
      const query = safeStr(q).toLowerCase().trim();
      const words = query.split(/\s+/).filter(Boolean);

      getAllCards().forEach((c) => {
        const haystack = `${c.dataset.title} ${c.dataset.author}`.toLowerCase();
        let score = 0;
        if (haystack.includes(query)) score += 3;
        for (const w of words) if (haystack.includes(w)) score += 2;
        c.dataset.filtered = score > 0 || !query ? "true" : "false";
      });

      renderPage();
    };

    window.prevPage = () => {
      const pages = getPages();
      const i = pages.indexOf(+window.currentPage);
      window.currentPage = i <= 0 ? pages.at(-1) : pages[i - 1];
      renderPage();
    };

    window.nextPage = () => {
      const pages = getPages();
      const i = pages.indexOf(+window.currentPage);
      window.currentPage =
        i === -1 || i === pages.length - 1 ? pages[0] : pages[i + 1];
      renderPage();
    };

    searchBtn?.addEventListener("click", () =>
      filterAssets(searchInput.value)
    );
    searchInput?.addEventListener(
      "input",
      debounce(() => filterAssets(searchInput.value), 200)
    );

    window.currentPage = +sessionStorage.getItem("currentPage") || 1;
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
      };
      loop();
    };
  }

  /* ---------------------------
     Update Popup
  --------------------------- */
  async function initUpdatePopup() {
    const p = dom.updatePopup;
    if (!p) return;

    try {
      const res = await fetch(`${config.sheetUrl}?mode=version-message`, {
        cache: "no-store",
      });
      const raw = await res.json();
      const latest = raw?.at(-1) || {
        version: "0.0.0",
        message: "Welcome!",
      };

      const titleEl = p.querySelector("h2");
      const msgEl = p.querySelector("p");
      if (titleEl)
        titleEl.textContent = `Version ${latest.version} Update!`;
      if (msgEl) msgEl.textContent = latest.message;

      setTimeout(() => p.classList.add("show"), 600);
    } catch {}
  }

  /* ---------------------------
     Asset Loader (Preloader-Free)
  --------------------------- */
  async function loadAssets() {
    const res = await fetch(config.sheetUrl, { cache: "no-store" });
    const raw = await res.json();
    const data = raw.filter((i) =>
      Object.values(i).some((v) => safeStr(v).trim())
    );

    window.assetsData = data;

    const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
    const filtered = isFavPage
      ? data.filter((a) =>
          window.favorites.has(safeStr(a.title).toLowerCase())
        )
      : data;

    const promises = createAssetCards(filtered || []);
    await Promise.all(promises.map((p) => p.promise));

    if (typeof renderPage === "function") renderPage();
  }

  /* ---------------------------
     DOM Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    initElements();
    initFavorites();
    initPaging();
    initPlaceholders();
    await initUpdatePopup();
    await loadAssets();
    if (typeof initQuotes === "function") await initQuotes();
    console.log("✅ WannaSmile Ready (No Preloader)");
  });
})();
