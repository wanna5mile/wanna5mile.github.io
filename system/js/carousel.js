document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");

  // --- Config & State ---
  const jsonPath = "system/json/assets.json";
  const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
  const fallbackImage = "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://wanna5mile.github.io/source/dino/";
  let assetsData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  // --- Helpers ---
  const showLoading = (text) => {
    container.textContent = text;
    container.style.textAlign = "center";
  };
  const saveFavorites = () =>
    localStorage.setItem("favorites", JSON.stringify([...favorites]));

  // --- Preloader Cycle + Hide ---
  async function cyclePreloaderGifs() {
    if (!loaderImage) return;
    const gifs = [
      "system/images/GIF/loading.gif",
      "system/images/GIF/almost.gif",
      "system/images/GIF/done.gif",
    ];
    for (let i = 0; i < gifs.length; i++) {
      loaderImage.src = gifs[i];
      await new Promise((r) => setTimeout(r, 1200)); // wait per GIF
    }
  }

  async function hidePreloader(force = false) {
    if (!preloader || (preloader.dataset.hidden === "true" && !force)) return;
    preloader.dataset.hidden = "true";
    preloader.classList.add("fade");
    preloader.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      preloader.style.display = "none";
    }, 500);
  }

  // --- Card Builder ---
  function createAssetCards(data) {
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
      if (!imageSrc || imageSrc === "blank" || asset.status?.toLowerCase() === "blank")
        imageSrc = fallbackImage;

      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = asset.title || "Asset";
      img.loading = "lazy";
      img.addEventListener("error", () => {
        if (!img.dataset.fallbackApplied) {
          img.src = fallbackImage;
          img.dataset.fallbackApplied = "true";
        }
      });

      const imgPromise = new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
      imagePromises.push({ promise: imgPromise, page: card.dataset.page });

      const link = document.createElement("a");
      link.href = asset.link?.trim() || fallbackLink;
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
        overlay.loading = "lazy";
        card.appendChild(overlay);
        const overlayPromise = new Promise((resolve) => {
          overlay.addEventListener("load", resolve, { once: true });
          overlay.addEventListener("error", resolve, { once: true });
        });
        imagePromises.push({ promise: overlayPromise, page: card.dataset.page });
      }

      card.append(link, author, star);
      container.appendChild(card);
    }

    return imagePromises;
  }

  // --- Paging / Filtering ---
  const getAllCards = () => Array.from(container.querySelectorAll(".asset-card"));
  const getFilteredCards = () => getAllCards().filter((c) => c.dataset.filtered === "true");
  const getPages = () => [...new Set(getFilteredCards().map((c) => parseInt(c.dataset.page)))].sort((a, b) => a - b);

  function renderPage() {
    const pages = getPages();
    const maxPage = Math.max(...pages, 1);
    if (!pages.includes(currentPage)) currentPage = pages[0] || 1;

    getAllCards().forEach((card) => {
      card.style.display =
        parseInt(card.dataset.page) === currentPage && card.dataset.filtered === "true"
          ? "block"
          : "none";
    });

    if (pageIndicator) pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;
    sessionStorage.setItem("currentPage", currentPage);
  }

  function filterAssets(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const match = !q || card.dataset.title.includes(q) || card.dataset.author.includes(q);
      card.dataset.filtered = match ? "true" : "false";
    });
    renderPage();
  }

  function refreshCards() {
    container.innerHTML = "";
    const imgData = createAssetCards(assetsData);
    renderPage();
    startPlaceholderCycle();
    return imgData;
  }

  // --- Placeholder animation ---
  function fadePlaceholder(input, text, cb) {
    input.classList.add("fade-out");
    setTimeout(() => {
      input.placeholder = text;
      input.classList.remove("fade-out");
      input.classList.add("fade-in");
      setTimeout(() => {
        input.classList.remove("fade-in");
        cb && cb();
      }, 400);
    }, 400);
  }

  function startPlaceholderCycle() {
    if (!searchInput) return;
    const loop = () => {
      const visible = getFilteredCards().filter(
        (c) => parseInt(c.dataset.page) === currentPage
      ).length;
      fadePlaceholder(searchInput, `${visible} assets on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search assets...", () =>
            setTimeout(loop, 4000)
          );
        }, 4000);
      });
    };
    loop();
  }

  // --- Nav buttons ---
  window.prevPage = () => {
    const pages = getPages();
    if (!pages.length) return;
    const idx = pages.indexOf(currentPage);
    currentPage = idx === 0 ? pages.at(-1) : pages[idx - 1];
    renderPage();
  };
  window.nextPage = () => {
    const pages = getPages();
    if (!pages.length) return;
    const idx = pages.indexOf(currentPage);
    currentPage = idx === pages.length - 1 ? pages[0] : pages[idx + 1];
    renderPage();
  };

  // --- Load & Wait for Page 1 ---
  async function loadAssets(retry = false) {
    showLoading("Loading assets...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      assetsData = await res.json();

      const imagePromises = createAssetCards(assetsData);
      renderPage();
      startPlaceholderCycle();

      // Wait for all images of page 1 to fully load
      const firstPageImages = imagePromises
        .filter((p) => parseInt(p.page) === 1)
        .map((p) => p.promise);

      await Promise.all(firstPageImages);

      // Cycle through GIFs before hiding
      await cyclePreloaderGifs();
      hidePreloader();

      // Continue loading rest in background
      Promise.all(imagePromises.map((p) => p.promise)).catch(() => {});
    } catch (err) {
      console.error("Error loading JSON:", err);
      if (!retry) {
        setTimeout(() => loadAssets(true), 1000);
      } else {
        showLoading("⚠ Failed to load asset data.");
        if (loaderImage) loaderImage.src = "system/images/GIF/crash.gif";
        hidePreloader(true);
      }
    }
  }

  // --- Hard fallback ---
  setTimeout(() => hidePreloader(true), 10000);

  // --- Events ---
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput.addEventListener("input", () => filterAssets(searchInput.value));
  }

  // --- Run ---
  loadAssets();
});
