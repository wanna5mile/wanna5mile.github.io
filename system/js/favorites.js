document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");
  const pageIndicator = document.querySelector(".page-indicator");
  if (pageIndicator) pageIndicator.style.display = "none"; // hide it

  // --- Config & State ---
  let assetsData = [];
  const jsonPath = "system/json/assets.json";
  const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

  // --- Fallback paths ---
  const fallbackImage =
    "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://theworldpt1.github.io/source/dino/";

  // --- Helper: Show loading message ---
  function showLoading(text) {
    if (container) {
      container.textContent = text;
      container.style.textAlign = "center";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "center";
      container.style.minHeight = "60vh";
      container.style.flexDirection = "column";
    }
  }

  // --- Create Favorite Cards Only ---
  function createAssetCards(data) {
    if (!container) return;

    // Reset layout styles for normal view
    container.style.display = "";
    container.style.justifyContent = "";
    container.style.alignItems = "";
    container.style.flexDirection = "";
    container.style.textAlign = "";

    // Flatten if JSON is nested by pages
    const allAssets = Array.isArray(data[0]) ? data.flat() : data;
    const favoriteAssets = allAssets.filter((a) => favorites.has(a.title));
    container.innerHTML = "";

    if (favoriteAssets.length === 0) {
      container.innerHTML = "<p>⚠ No favorited assets found.</p>";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "center";
      container.style.textAlign = "center";
      container.style.minHeight = "60vh";
      return;
    }

    favoriteAssets.forEach((asset) => {
      const card = document.createElement("div");
      card.className = "asset-card";
      card.dataset.title = (asset.title || "").toLowerCase();
      card.dataset.author = (asset.author || "").toLowerCase();
      card.dataset.filtered = "true"; // for search

      // --- Image + link fallbacks ---
      let imageSrc = asset.image?.trim() || "";
      let linkSrc = asset.link?.trim() || "";
      if (
        imageSrc === "" ||
        imageSrc.toLowerCase() === "blank" ||
        asset.status?.toLowerCase() === "blank"
      )
        imageSrc = fallbackImage;
      if (linkSrc === "") linkSrc = fallbackLink;

      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = asset.title || "Asset";
      img.addEventListener("error", () => {
        if (!img.dataset.fallbackApplied) {
          img.src = fallbackImage;
          img.dataset.fallbackApplied = "true";
        }
      });

      const link = document.createElement("a");
      link.href = linkSrc;
      link.target = "_blank";
      link.rel = "noopener";
      link.appendChild(img);
      link.innerHTML += `<h3>${asset.title || "Untitled"}</h3>`;

      const author = document.createElement("p");
      author.textContent = asset.author || "Unknown";

      const star = document.createElement("span");
      star.className = "favorite-star";
      star.textContent = "★";
      star.title = "Favorited";

      if (asset.status?.toLowerCase() === "soon") {
        card.classList.add("soon");
        link.removeAttribute("href");
        link.style.pointerEvents = "none";
        link.style.cursor = "default";
      }

      card.appendChild(link);
      card.appendChild(author);
      card.appendChild(star);

      container.appendChild(card);
    });
  }

  // --- Search/filter (works on all favorites) ---
  function filterAssets(query) {
    const q = query.toLowerCase().trim();
    const cards = Array.from(container.querySelectorAll(".asset-card"));
    let visibleCount = 0;

    cards.forEach((card) => {
      const matches =
        !q || card.dataset.title.includes(q) || card.dataset.author.includes(q);
      card.style.display = matches ? "block" : "none";
      if (matches) visibleCount++;
    });

    // If no matches found, show centered message
    if (visibleCount === 0) {
      container.innerHTML = "<p>⚠ No assets found.</p>";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "center";
      container.style.textAlign = "center";
      container.style.minHeight = "60vh";
    }
  }

  if (searchInput)
    searchInput.addEventListener("input", (e) => filterAssets(e.target.value));
  if (searchBtn)
    searchBtn.addEventListener("click", () => filterAssets(searchInput.value));

  // --- Placeholder cycle ---
  function fadePlaceholder(input, text, cb) {
    if (!input) return;
    input.classList.add("fade-out");
    setTimeout(() => {
      input.placeholder = text;
      input.classList.remove("fade-out");
      input.classList.add("fade-in");
      setTimeout(() => {
        input.classList.remove("fade-in");
        if (cb) cb();
      }, 400);
    }, 400);
  }

  function startPlaceholderCycle() {
    if (!searchInput) return;
    const cycle = () => {
      const visibleCount = Array.from(
        container.querySelectorAll(".asset-card")
      ).filter((c) => c.style.display !== "none").length;

      fadePlaceholder(searchInput, `${visibleCount} favorited assets`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search favorites...", () =>
            setTimeout(cycle, 4000)
          );
        }, 4000);
      });
    };
    cycle();
  }

  // --- Hide preloader safely ---
  function hidePreloader(success = true) {
    if (!preloader) return;
    if (loaderImage) {
      loaderImage.src = success
        ? "system/images/GIF/load-fire.gif"
        : "system/images/GIF/fail.gif";
    }
    preloader.classList.add("fade");
    setTimeout(() => (preloader.style.display = "none"), 800);
  }

  // --- Load and Display Favorites ---
  async function loadAssets() {
    showLoading("Loading favorites...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      assetsData = await res.json();

      createAssetCards(assetsData);
      startPlaceholderCycle();

      // Wait for images or timeout
      const allImages = Array.from(container.querySelectorAll(".asset-card img"));
      await Promise.race([
        Promise.allSettled(
          allImages.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) return resolve();
                img.addEventListener("load", resolve);
                img.addEventListener("error", resolve);
              })
          )
        ),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);

      hidePreloader(true);
    } catch (err) {
      console.error("Error loading favorites:", err);
      showLoading("⚠ Failed to load favorites.");
      hidePreloader(false);
    }
  }

  loadAssets();
});
