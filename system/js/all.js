/* ==========================================================
   WannaSmile | Unified JS Loader & UI Logic
   Cleaned, optimized, single-source version
   ========================================================== */

// --- DOM READY ---
document.addEventListener("DOMContentLoaded", async () => {
  initElements();
  initFavorites();
  initPreloader();
  initPaging();
  initPlaceholders();

  try {
    await loadAssets();
  } catch (err) {
    console.error("Startup error:", err);
    await cyclePreloaderGifs(false);
    updateProgress(100);
    hidePreloader(true);
  }
});

/* ==========================================================
   1️⃣ ELEMENT INITIALIZATION
   ========================================================== */
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

  if (!dom.container) {
    console.warn("⚠ Elements not ready, retrying...");
    return setTimeout(initElements, 200);
  }

  window.config = {
    fallbackImage:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
    fallbackLink: "https://wanna5mile.github.io/source/dino/",
    gifBase:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
    sheetUrl:
      "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
  };

  console.log("✅ Elements initialized:", dom);
}

/* ==========================================================
   2️⃣ FAVORITES SYSTEM
   ========================================================== */
function initFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
    window.favorites = new Set(Array.isArray(stored) ? stored : []);
  } catch {
    window.favorites = new Set();
  }

  window.saveFavorites = () => {
    try {
      localStorage.setItem("favorites", JSON.stringify([...window.favorites]));
    } catch (e) {
      console.error("❌ Failed to save favorites:", e);
    }
  };

  window.refreshCards = () => {
    if (!window.assetsData || typeof createAssetCards !== "function") {
      console.warn("⚠ Cannot refresh cards — assets not ready.");
      return;
    }
    const imagePromises = createAssetCards(window.assetsData);
    if (typeof renderPage === "function") renderPage();
    if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
    return imagePromises;
  };

  console.log("✅ Favorites initialized:", [...window.favorites]);
}

/* ==========================================================
   3️⃣ PRELOADER
   ========================================================== */
function initPreloader() {
  const { preloader } = dom;
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

  window.updateProgress = (percent) => {
    const clamped = Math.min(100, Math.max(0, percent));
    progressText.textContent = `Loading ${Math.floor(clamped)}%`;
    progressFill.style.width = `${clamped}%`;
  };

  window.cyclePreloaderGifs = async (success = true) => {
    const { loaderImage } = dom;
    if (!loaderImage) return;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    const gifs = success
      ? [`${config.gifBase}loading.gif`, `${config.gifBase}load-fire.gif`]
      : [`${config.gifBase}loading.gif`, `${config.gifBase}crash.gif`, `${config.gifBase}ded.gif`];

    for (const gif of gifs) {
      loaderImage.src = gif;
      await delay(success ? 1000 : 1300);
    }
  };

  window.hidePreloader = (force = false) => {
    if (!preloader || preloader.dataset.hidden === "true") return;
    preloader.dataset.hidden = "true";
    preloader.style.transition = "opacity 0.5s ease";
    preloader.style.opacity = "0";
    preloader.style.pointerEvents = "none";
    setTimeout(() => (preloader.style.display = "none"), 500);
  };

  console.log("✅ Preloader ready");
}

/* ==========================================================
   4️⃣ ASSET LOADER (Google Sheets)
   ========================================================== */
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

    const rawData = await res.json();
    if (!Array.isArray(rawData)) throw new Error("Invalid data from Sheets");

    const data = rawData.filter(
      (item) => item && Object.values(item).some((v) => v && String(v).trim() !== "")
    );
    window.assetsData = data;

    const total = data.length;
    let loaded = 0;

    const stagedData = [];
    for (const entry of data) {
      stagedData.push(entry);
      loaded++;
      updateProgress(10 + Math.floor((loaded / total) * 60));
      if (loaded % 20 === 0) await new Promise((r) => requestAnimationFrame(r));
    }

    const imagePromises = createAssetCards(stagedData);
    const imgTotal = imagePromises.length;
    let imgLoaded = 0;

    for (const { promise } of imagePromises) {
      promise.then(() => {
        imgLoaded++;
        updateProgress(75 + Math.floor((imgLoaded / imgTotal) * 25));
      });
    }

    await Promise.allSettled(imagePromises.map((p) => p.promise));
    updateProgress(100);
    await new Promise((r) => setTimeout(r, 400));

    hidePreloader(true);
    if (typeof renderPage === "function") renderPage();
    if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();

    console.log("✅ Assets loaded successfully");

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
  const { preloader } = dom;
  if (!preloader) return;
  const textEl =
    preloader.querySelector(".load-progress-text") || preloader.appendChild(document.createElement("div"));
  textEl.className = "load-progress-text";
  textEl.textContent = text;
}

/* ==========================================================
   5️⃣ CREATE ASSET CARDS
   ========================================================== */
function createAssetCards(data) {
  const { container } = dom;
  if (!container) return Promise.resolve();

  container.innerHTML = "";
  const imagePromises = [];

  const sorted = [...data].sort((a, b) => {
    const aFav = favorites.has(a.title);
    const bFav = favorites.has(b.title);
    if (aFav !== bFav) return bFav - aFav;
    return (a.page || 1) - (b.page || 1);
  });

  for (const asset of sorted) {
    const card = document.createElement("div");
    card.className = "asset-card";
    card.dataset.title = (asset.title || "").toLowerCase();
    card.dataset.author = (asset.author || "").toLowerCase();
    card.dataset.page = asset.page ? parseInt(asset.page) : 1;
    card.dataset.filtered = "true";

    let imageSrc = asset.image?.trim() || "";
    if (!imageSrc || imageSrc === "blank" || asset.status?.toLowerCase() === "blank") {
      imageSrc = config.fallbackImage;
    }

    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = asset.title || "Asset";
    img.loading = "eager";
    img.addEventListener("error", () => {
      if (!img.dataset.fallbackApplied) {
        img.src = config.fallbackImage;
        img.dataset.fallbackApplied = "true";
      }
    });

    const imgPromise = new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
    imagePromises.push({ promise: imgPromise, page: card.dataset.page });

    const link = document.createElement("a");
    link.href = asset.link?.trim() || config.fallbackLink;
    link.target = "_blank";
    link.rel = "noopener";
    link.appendChild(img);
    link.innerHTML += `<h3>${asset.title || "Untitled"}</h3>`;

    const author = document.createElement("p");
    author.textContent = asset.author || " ";

    const star = document.createElement("span");
    star.className = "favorite-star";
    star.textContent = favorites.has(asset.title) ? "★" : "☆";
    star.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (favorites.has(asset.title)) favorites.delete(asset.title);
      else favorites.add(asset.title);
      saveFavorites();
      refreshCards();
    });

    const status = asset.status?.toLowerCase();
    if (status === "soon") {
      card.classList.add("soon");
      link.removeAttribute("href");
      link.style.pointerEvents = "none";
    } else if (status === "featured" || status === "fixed") {
      const overlay = document.createElement("img");
      overlay.className = `status-overlay ${status}`;
      overlay.src = `system/images/${status}.png`;
      overlay.alt = status;
      overlay.loading = "eager";
      card.appendChild(overlay);
      imagePromises.push({
        promise: new Promise((r) => {
          overlay.addEventListener("load", r, { once: true });
          overlay.addEventListener("error", r, { once: true });
        }),
        page: card.dataset.page,
      });
    }

    card.append(link, author, star);
    container.appendChild(card);
  }

  return imagePromises;
}

/* ==========================================================
   6️⃣ PAGING
   ========================================================== */
function initPaging() {
  const { container, pageIndicator, searchInput, searchBtn } = dom;

  window.getAllCards = () => Array.from(container.querySelectorAll(".asset-card"));
  window.getFilteredCards = () =>
    getAllCards().filter((c) => c.dataset.filtered === "true");
  window.getPages = () =>
    [...new Set(getFilteredCards().map((c) => parseInt(c.dataset.page)))]
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

  window.renderPage = () => {
    const pages = getPages();
    const maxPage = Math.max(...pages, 1);
    if (!pages.includes(window.currentPage)) window.currentPage = pages[0] || 1;

    getAllCards().forEach((card) => {
      const visible =
        parseInt(card.dataset.page) === window.currentPage &&
        card.dataset.filtered === "true";
      card.style.display = visible ? "block" : "none";
    });

    if (pageIndicator)
      pageIndicator.textContent = `Page ${window.currentPage} of ${maxPage}`;
    sessionStorage.setItem("currentPage", window.currentPage);
  };

  window.filterAssets = (query) => {
    const q = query.toLowerCase().trim();
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
    window.currentPage = idx === 0 ? pages.at(-1) : pages[idx - 1];
    renderPage();
  };

  window.nextPage = () => {
    const pages = getPages();
    if (!pages.length) return;
    const idx = pages.indexOf(window.currentPage);
    window.currentPage = idx === pages.length - 1 ? pages[0] : pages[idx + 1];
    renderPage();
  };

  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput.addEventListener("input", () => filterAssets(searchInput.value));
  }

  window.currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  const observer = new MutationObserver(() => {
    clearTimeout(window._pagingDebounce);
    window._pagingDebounce = setTimeout(renderPage, 150);
  });
  observer.observe(container, { childList: true });

  renderPage();
}

/* ==========================================================
   7️⃣ PLACEHOLDERS
   ========================================================== */
function initPlaceholders() {
  const { searchInput } = dom;
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
        if (cb) cb();
      }, FADE_DURATION);
    }, FADE_DURATION);
  };

  window.startPlaceholderCycle = () => {
    const loop = () => {
      const visible = getFilteredCards().filter(
        (c) => parseInt(c.dataset.page) === window.currentPage
      ).length;

      fadePlaceholder(searchInput, `${visible} assets on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search assets...", () =>
            setTimeout(loop, HOLD_DURATION)
          );
        }, HOLD_DURATION);
      });
    };
    loop();
  };
}
