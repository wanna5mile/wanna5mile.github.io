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
      loadedImage: $("#loadedImage"),
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
   Preloader UI (Theme-aware, fully configurable)
--------------------------- */
function initPreloader() {
  const { preloader } = dom || {};
  if (!preloader) return;

  // ======= Editable GIF Paths =======
  const gifConfig = {
    default: {
      loading: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
      loaded: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
      delay: 1225
    },
    themes: {
      light: {
        loading: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        loaded: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        delay: 1100
      },
      dark: {
        loading: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        loaded: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        delay: 1100
      },
      classic: {
        loading: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        loaded: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        delay: 1100
      },
      slackerish: {
        loading: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        loaded: "https://raw.githubusercontent.com/01110010-00110101/themeify/main/redux/blankgif.png",
        crash: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/GIF/slackerish-crash.gif",
        dead: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/GIF/slackerish-dead.gif",
        searching: "https://raw.githubusercontent.com/01110010-00110101/01110010-00110101.github.io/main/system/images/GIF/slackerish-searching.gif",
        delay: 1300
      }
      // Add more theme replacements here
    }
  };

  // ======= Determine current theme =======
  const bodyTheme = document.body.getAttribute("theme") || "classic";
  const gifs = gifConfig.themes[bodyTheme] || gifConfig.default;

  // Save theme-based delay for loader logic
  preloader.dataset.gifDelay = gifs.delay;

  // ======= Create or update loaderImage =======
let loaderImg = dom.loaderImage;

if (!loaderImg) {
  loaderImg = document.createElement("img");
  loaderImg.id = "loaderImage";
  loaderImg.alt = "Loading background";

  // IMPORTANT: append to the image layer, not directly to preloader
  const gifLayer =
    document.getElementById("loader-gif") ||
    (() => {
      const layer = document.createElement("div");
      layer.id = "loader-gif";
      preloader.appendChild(layer);
      return layer;
    })();

  gifLayer.appendChild(loaderImg);
  dom.loaderImage = loaderImg;
}

// JS ONLY sets the source
loaderImg.src = gifs.loading;

  // ======= Create or update loadedImage =======
let loadedImg = dom.loadedImage;

if (!loadedImg) {
  loadedImg = document.createElement("img");
  loadedImg.id = "loadedImage";
  loadedImg.alt = "Loaded animation";

  // Append to the same layer as loaderImage
  loaderImg.parentElement.appendChild(loadedImg);

  dom.loadedImage = loadedImg;
}

// JS ONLY sets the source
loadedImg.src = gifs.loaded;

  // ======= Show preloader =======
preloader.style.display = "flex";
preloader.style.opacity = "1"; // 👈 MUST be visible while loading
preloader.style.pointerEvents = "all";
preloader.dataset.hidden = "false";

  // ======= Progress bar & text =======
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
    const t = preloader.querySelector(".loading-text") || counter;
    t.textContent = text;
  };

  window.hidePreloader = () => {
    if (preloader.dataset.hidden === "true") return;
    preloader.dataset.hidden = "true";
    preloader.style.transition = "opacity .45s ease";
    preloader.style.opacity = "0";
    preloader.style.pointerEvents = "none";
    setTimeout(() => (preloader.style.display = "none"), 500);
  };

  // ======= UPDATED: Theme-aware loaded animation delay =======
window.showLoadedState = async (
  gifDelay = Number(preloader.dataset.gifDelay) || 1000
) => {
  if (dom.loaderImage) dom.loaderImage.style.opacity = "0";
  if (dom.loadedImage) dom.loadedImage.style.opacity = "1"; // 👈 show loaded image

  await delay(gifDelay);
};

  // ======= Optional: Update GIFs dynamically if theme changes =======
  window.updatePreloaderGifsForTheme = (theme) => {
    const g = gifConfig.themes[theme] || gifConfig.default;
    if (dom.loaderImage) dom.loaderImage.src = g.loading;
    if (dom.loadedImage) dom.loadedImage.src = g.loaded;
    preloader.dataset.gifDelay = g.delay; // keep delay synced
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
      // NEW UNIFIED STATUS (from sheet column: type)
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

// UNIFIED OVERLAY LOGIC  (uses: statusField = asset.type)
if (statusField === "featured")
  addOverlay(badgeMap.featured, "featured badge", "overlay-featured");

if (statusField === "new")
  addOverlay(badgeMap.new, "new badge", "overlay-new");

if (statusField === "fixed")
  addOverlay(badgeMap.fixed, "fixed badge", "overlay-fixed");

// existing animated-status logic stays the same
if (["new", "updated"].includes(status))
  addOverlay(`${config.gifBase}${status}.gif`, `${status} badge`, `status-gif status-${status}`);

if (status === "fix") {
  addOverlay(badgeMap.fix, "fixing overlay", "overlay-fix", true);
  card.classList.add("fix");
}

if (status === "soon")
  card.classList.add("soon");

a.appendChild(wrapper);

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
  saveFavorites();
  star.textContent = window.favorites.has(key) ? "★" : "☆";
});

card.append(a, titleEl, authorEl, star);
frag.appendChild(card);
    } // ← close for (const asset ...)
    container.appendChild(frag);
    return imagePromises;
  } // ← close createAssetCards()
    
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
      errorGif.alt = "No results found";
      Object.assign(errorGif.style, {
        display: "none",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "128px",
        height: "128px",
        imageRendering: "pixelated",
        opacity: "0",
        transition: "opacity 0.25s ease",
        pointerEvents: "none",
        zIndex: "1000",
      });
      container.parentElement.appendChild(errorGif);
    }

    const getAllCards = () => [...container.querySelectorAll(".asset-card")];
    const getFilteredCards = () => getAllCards().filter((c) => c.dataset.filtered === "true");
    const getPages = () => [...new Set(getAllCards().map((c) => +c.dataset.page).filter(n => !isNaN(n)))].sort((a,b)=>a-b);

    const updateVisibility = () => {
      const visibleCards = getFilteredCards().length;
      if (visibleCards === 0) {
        errorGif.style.display = "block";
        requestAnimationFrame(() => (errorGif.style.opacity = "1"));
        if(quoteWrapper) quoteWrapper.style.opacity = "0.5";
      } else {
        errorGif.style.opacity = "0";
        setTimeout(() => {
          if (parseFloat(errorGif.style.opacity) === 0) errorGif.style.display = "none";
        }, 250);
        if(quoteWrapper) quoteWrapper.style.opacity = "1";
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

      getAllCards().forEach(c => {
        const visible = +c.dataset.page === +window.currentPage && c.dataset.filtered === "true";
        c.style.display = visible ? "" : "none";
      });

      if (pageIndicator) {
        const idx = pages.indexOf(+window.currentPage);
        pageIndicator.textContent = `Page ${idx+1} of ${pages.length}`;
      }
      sessionStorage.setItem("currentPage", window.currentPage);
      updateVisibility();
    };

    window.filterAssets = (q) => {
      const query = safeStr(q).toLowerCase().trim();
      const words = query.split(/\s+/).filter(Boolean);
      const allCards = getAllCards();

      allCards.forEach(c => {
        const haystack = `${safeStr(c.dataset.title)} ${safeStr(c.dataset.author)}`.toLowerCase();
        let score = 0;
        if(haystack.includes(query)) score += 3;
        for(const w of words) if(haystack.includes(w)) score += 2;
        if(words.length && words.some(w => haystack.split(/\s+/).some(h=>h.startsWith(w)||h.endsWith(w)))) score +=1;
        c.dataset.filtered = score>0 || !query ? "true":"false";
      });

      renderPage();
    };

    window.prevPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const i = pages.indexOf(+window.currentPage);
      window.currentPage = i<=0 ? pages.at(-1) : pages[i-1];
      renderPage();
    };
    window.nextPage = () => {
      const pages = getPages();
      if (!pages.length) return;
      const i = pages.indexOf(+window.currentPage);
      window.currentPage = i===-1||i===pages.length-1 ? pages[0]:pages[i+1];
      renderPage();
    };

    searchBtn?.addEventListener("click",()=>filterAssets(searchInput.value));
    searchInput?.addEventListener("input",debounce(()=>filterAssets(searchInput.value),200));

    window.currentPage = +sessionStorage.getItem("currentPage") || 1;
    renderPage();
  }

  /* ---------------------------
     Placeholder Cycle
  --------------------------- */
  function initPlaceholders() {
    const { searchInput } = dom || {};
    if(!searchInput) return;
    const FADE=400,HOLD=4000;

    const fadePlaceholder=(input,text,cb)=>{
      input.classList.add("fade-out");
      setTimeout(()=>{
        input.placeholder=text;
        input.classList.remove("fade-out");
        input.classList.add("fade-in");
        setTimeout(()=>{input.classList.remove("fade-in"); cb?.()},FADE);
      },FADE);
    };

    window.startPlaceholderCycle = () => {
      if(window._placeholderRunning) return;
      window._placeholderRunning = true;
      const loop = async()=>{
        try {
          const visible = document.querySelectorAll(`.asset-card[data-filtered="true"][data-page="${window.currentPage}"]`).length;
          await new Promise(r=>fadePlaceholder(searchInput,`${visible} assets on this page`,r));
          await delay(HOLD);
          await new Promise(r=>fadePlaceholder(searchInput,"Search assets...",r));
          await delay(HOLD);
          if(window._placeholderRunning) loop();
        } catch { window._placeholderRunning=false; }
      };
      loop();
    };
    window.stopPlaceholderCycle=()=>window._placeholderRunning=false;
  }

  /* ---------------------------
     Update Popup
  --------------------------- */
  async function initUpdatePopup() {
    const p=dom.updatePopup;
    if(!p) return;
    const LS_HIDE="ws_hideUpdate",LS_VER="ws_lastUpdateVersion";

    try {
      const res = await fetch(`${config.sheetUrl}?mode=version-message`,{cache:"no-store"});
      const raw = await res.json();

      let latest=null;
      if(Array.isArray(raw)){
        if(raw[0]?.version && raw[0]?.["version-message"]){
          latest = raw.filter(r=>r.version && r["version-message"]).at(-1);
          latest={version:latest.version,message:latest["version-message"],trailer:latest.trailer||"",link:latest.link||config.updateLink};
        } else if(raw.at(-1)?.version) latest = raw.at(-1);
      }
      if(!latest) latest={version:"0.0.0",message:"Welcome to WannaSmile!",trailer:"",link:config.updateLink};

      const CURRENT_VERSION = latest.version||"0.0.0";
      const MESSAGE = latest.message||"Enjoy the latest update!";
      const TRAILER = latest.trailer||"";
      const LINK = latest.link||config.updateLink;

      const titleEl=p.querySelector("h2");
      const msgEl=p.querySelector("p");
      if(titleEl) titleEl.textContent=`Version ${CURRENT_VERSION} Update!`;
      if(msgEl) msgEl.textContent=MESSAGE;
      if(dom.updateVideo && TRAILER) dom.updateVideo.src=TRAILER;

      const footerVersion = document.getElementById("footerVersion");
      if(footerVersion) footerVersion.textContent=`Version ${CURRENT_VERSION}`;

      const lastVersion = localStorage.getItem(LS_VER);
      const hidePref = localStorage.getItem(LS_HIDE);

      if(lastVersion!==CURRENT_VERSION){
        localStorage.removeItem(LS_HIDE);
        sessionStorage.removeItem(LS_HIDE);
      }
      localStorage.setItem(LS_VER,CURRENT_VERSION);

      const isNewVersion = lastVersion!==CURRENT_VERSION;
      const shouldShow = isNewVersion || (!hidePref && !sessionStorage.getItem(LS_HIDE));
      if(!shouldShow) return;

      setTimeout(()=>p.classList.add("show"),600);

      dom.viewUpdateBtn?.addEventListener("click",()=>{window.open(LINK,"_self"); p.classList.remove("show");});
      dom.viewUpdateInfoBtn?.addEventListener("click",()=>window.open(LINK,"_blank"));
      dom.closeUpdateBtn?.addEventListener("click",()=>{sessionStorage.setItem(LS_HIDE,"1");p.classList.remove("show");});
      dom.dontShowBtn?.addEventListener("click",()=>{localStorage.setItem(LS_HIDE,"1");p.classList.remove("show");});
      p.addEventListener("click",(e)=>{if(e.target===p){sessionStorage.setItem(LS_HIDE,"1");p.classList.remove("show");}});
    } catch(err){console.warn("⚠ Version message fetch failed:",err);}
  }

/* ---------------------------
   Asset Loader
--------------------------- */
async function loadAssets(retry = false) {
  try {
    showLoading("Loading assets...");

    let currentProgress = 0;

    const setProgress = (target) =>
      new Promise((resolve) => {
        const step = () => {
          currentProgress += (target - currentProgress) * 0.08;

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

    // Start progress
    await setProgress(5);

    // Fetch sheet
    const res = await fetch(config.sheetUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);

    const raw = await res.json();
    const data = raw.filter((i) =>
      Object.values(i).some((v) => safeStr(v).trim())
    );
    window.assetsData = data;

    await setProgress(20);

    // Favorites mode
    const isFavPage = location.pathname.toLowerCase().includes("favorites.html");
    const filtered = isFavPage
      ? data.filter((a) =>
          window.favorites.has(safeStr(a.title).toLowerCase())
        )
      : data;

    // Load images
    const promises = createAssetCards(filtered || []);
    const totalImages = promises.length;

    if (totalImages > 0) {
      await Promise.all(promises.map((p) => p.promise));
    }

    await setProgress(90);

    if (typeof renderPage === "function") renderPage();

    if (isFavPage && !filtered.length && dom.container) {
      dom.container.innerHTML =
        "<p style='text-align:center;color:#ccc;font-family:monospace;'>No favorites yet ★</p>";
    }

    // Finish progress
    await setProgress(100);

    // THEME-BASED LOADED GIF DELAY
    const gifDelay =
      Number(dom.preloader?.dataset?.gifDelay) || 1000; // fallback

    // Let progress bar reach 100 smoothly
    await delay(150);

    // ▶ Show "loaded" GIF for its full duration
    await showLoadedState(gifDelay);

    // Fade out immediately after GIF finishes
    hidePreloader();
  } catch (err) {
    console.error("Error loading assets:", err);

    if (!retry) {
      setTimeout(() => loadAssets(true).catch(() => {}), 1000);
      return;
    }

    showLoading("⚠ Failed to load assets.");
    hidePreloader();
  }
}

  /* ---------------------------
     DOM Bootstrap
  --------------------------- */
  document.addEventListener("DOMContentLoaded",async()=>{
    try{
      initElements();
      initFavorites();
      initPreloader();
      initPaging();
      initPlaceholders();
      await initUpdatePopup();
      await loadAssets();
      if(typeof initQuotes==="function") await initQuotes();
      console.log("✅ WannaSmile Loader + Quotes Ready");
    } catch(err){
      console.error("Initialization failed:",err);
      showLoading("Initialization failed. Please reload.");
      hidePreloader();
    }
  });
})();
