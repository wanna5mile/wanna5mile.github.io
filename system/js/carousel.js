document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");

  // --- Config & State ---
  let assetsData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
  const jsonPath = "system/json/assets.json";
  const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
  const fallbackImage =
    "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://wanna5mile.github.io/source/dino/";

  // --- Helpers ---
  function showLoading(text) {
    container.textContent = text;
    container.style.textAlign = "center";
  }

  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
  }

  // --- Shoelace alert helper ---
  function showSlowLoadAlert() {
    if (document.querySelector(".slow-load-alert")) return;

    const alert = document.createElement("sl-alert");
    alert.className = "slow-load-alert";
    alert.variant = "warning";
    alert.closable = true;
    alert.duration = 7000;
    alert.innerHTML = `
      <sl-icon slot="icon" name="clock"></sl-icon>
      <strong>Still loading?</strong>
      <br />If the screen stays here too long, try refreshing the page.
    `;
    document.body.appendChild(alert);
    alert.toast();
  }

  // --- Preloader Controller ---
  function hidePreloader() {
    if (!preloader) return;
    if (loaderImage) loaderImage.src = "system/images/GIF/load-fire.gif";
    preloader.classList.add("fade");
    setTimeout(() => (preloader.style.display = "none"), 600);
  }

  // --- Card Creation ---
  function createAssetCards(data) {
    if (!container) return;

    const imagePromises = [];
    const sortedData = [...data].sort((a, b) => {
      const aFav = favorites.has(a.title);
      const bFav = favorites.has(b.title);
      if (aFav !== bFav) return bFav - aFav;
      return (a.page || 1) - (b.page || 1);
    });

    sortedData.forEach((asset) => {
      const card = document.createElement("div");
      card.className = "asset-card";
      card.dataset.title = (asset.title || "").toLowerCase();
      card.dataset.author = (asset.author || "").toLowerCase();
      card.dataset.page = asset.page ? parseInt(asset.page) : 1;
      card.dataset.filtered = "true";

      // --- Image + Link ---
      let imageSrc = asset.image?.trim() || "";
      let linkSrc = asset.link?.trim() || "";
      if (!imageSrc || imageSrc === "blank" || asset.status?.toLowerCase() === "blank")
        imageSrc = fallbackImage;
      if (!linkSrc) linkSrc = fallbackLink;

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

      // Track when each image finishes loading or errors
      const imgPromise = new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
      imagePromises.push(imgPromise);

      const link = document.createElement("a");
      link.href = linkSrc;
      link.target = "_blank";
      link.rel = "noopener";
      link.appendChild(img);
      link.innerHTML += `<h3>${asset.title || "Untitled"}</h3>`;

      const author = document.createElement("p");
      author.textContent = asset.author || " ";

      const star = document.createElement("span");
      star.className = "favorite-star";
      star.textContent = favorites.has(asset.title) ? "★" : "☆";
      star.title = "Toggle favorite";
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (favorites.has(asset.title)) {
          favorites.delete(asset.title);
          star.textContent = "☆";
        } else {
          favorites.add(asset.title);
          star.textContent = "★";
        }
        saveFavorites();
        refreshCards();
      });

      // --- Status Overlays ---
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

        // Track overlay load
        const overlayPromise = new Promise((resolve) => {
          overlay.addEventListener("load", resolve, { once: true });
          overlay.addEventListener("error", resolve, { once: true });
        });
        imagePromises.push(overlayPromise);
      }

      card.appendChild(link);
      card.appendChild(author);
      card.appendChild(star);
      container.appendChild(card);
    });

    // Return a promise that resolves when all images are done
    return Promise.all(imagePromises);
  }

  // --- Page Handling ---
  function getAllCards() {
    return Array.from(container.querySelectorAll(".asset-card"));
  }

  function getFilteredCards() {
    return getAllCards().filter((c) => c.dataset.filtered === "true");
  }

  function getPagesWithContent() {
    const pages = new Set(getFilteredCards().map((c) => parseInt(c.dataset.page)));
    return [...pages].sort((a, b) => a - b);
  }

  function renderPage() {
    const pagesWithContent = getPagesWithContent();
    const maxPage = Math.max(...pagesWithContent, 1);

    if (!pagesWithContent.includes(currentPage)) {
      currentPage = pagesWithContent[0] || 1;
    }

    getAllCards().forEach((card) => {
      card.style.display =
        parseInt(card.dataset.page) === currentPage && card.dataset.filtered === "true"
          ? "block"
          : "none";
    });

    if (pageIndicator) pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;
    sessionStorage.setItem("currentPage", currentPage);
  }

  // --- Filtering ---
  function filterAssets(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const matches = !q || card.dataset.title.includes(q) || card.dataset.author.includes(q);
      card.dataset.filtered = matches ? "true" : "false";
    });
    renderPage();
  }

  // --- Refresh Cards ---
  function refreshCards() {
    container.innerHTML = "";
    createAssetCards(assetsData).then(() => {
      renderPage();
      startPlaceholderCycle();
    });
  }

  // --- Placeholder Animation ---
  function fadePlaceholder(input, text, cb) {
    if (!input) return;
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
    const cycle = () => {
      const visibleCount = getFilteredCards().filter(
        (c) => parseInt(c.dataset.page) === currentPage
      ).length;
      fadePlaceholder(searchInput, `${visibleCount} assets on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search assets...", () => setTimeout(cycle, 4000));
        }, 4000);
      });
    };
    cycle();
  }

  // --- Navigation ---
  window.prevPage = () => {
    const pagesWithContent = getPagesWithContent();
    if (!pagesWithContent.length) return;

    const index = pagesWithContent.indexOf(currentPage);
    currentPage =
      index === 0 ? pagesWithContent[pagesWithContent.length - 1] : pagesWithContent[index - 1];
    renderPage();
  };

  window.nextPage = () => {
    const pagesWithContent = getPagesWithContent();
    if (!pagesWithContent.length) return;

    const index = pagesWithContent.indexOf(currentPage);
    currentPage =
      index === pagesWithContent.length - 1 ? pagesWithContent[0] : pagesWithContent[index + 1];
    renderPage();
  };

  // --- Initialization ---
  async function loadAssets() {
    showLoading("Loading assets...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      assetsData = await res.json();

      container.innerHTML = "";

      // Wait until all images (including overlays) are loaded before hiding preloader
      await createAssetCards(assetsData);
      renderPage();
      startPlaceholderCycle();
      hidePreloader();
    } catch (err) {
      console.error("Error loading JSON:", err);
      showLoading("⚠ Failed to load asset data.");
      if (loaderImage) loaderImage.src = "system/images/GIF/crash.gif";
    }
  }

  // --- Events ---
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput.addEventListener("input", () => filterAssets(searchInput.value));
  }

  // --- Run ---
  loadAssets();
});
