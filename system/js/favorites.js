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
  let gamesData = [];
  const jsonPath = "system/json/assets.json";
  const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

  // --- Fallback paths ---
  const fallbackImage =
    "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://theworldpt1.github.io./source/dino/";

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
  function createGameCards(data) {
    if (!container) return;

    // Reset layout styles for normal view
    container.style.display = "";
    container.style.justifyContent = "";
    container.style.alignItems = "";
    container.style.flexDirection = "";
    container.style.textAlign = "";

    // Flatten if JSON is nested by pages
    const allGames = Array.isArray(data[0]) ? data.flat() : data;
    const favoriteGames = allGames.filter((g) => favorites.has(g.title));
    container.innerHTML = "";

    if (favoriteGames.length === 0) {
      container.innerHTML = "<p>⚠ No favorited games found.</p>";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "center";
      container.style.textAlign = "center";
      container.style.minHeight = "60vh";
      return;
    }

    favoriteGames.forEach((game) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();
      card.dataset.filtered = "true"; // for search

      // --- Image + link fallbacks ---
      let imageSrc = game.image?.trim() || "";
      let linkSrc = game.link?.trim() || "";
      if (
        imageSrc === "" ||
        imageSrc.toLowerCase() === "blank" ||
        game.status?.toLowerCase() === "blank"
      )
        imageSrc = fallbackImage;
      if (linkSrc === "") linkSrc = fallbackLink;

      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = game.title || "Game";
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
      link.innerHTML += `<h3>${game.title || "Untitled"}</h3>`;

      const author = document.createElement("p");
      author.textContent = game.author || "Unknown";

      const star = document.createElement("span");
      star.className = "favorite-star";
      star.textContent = "★";
      star.title = "Favorited";

      if (game.status?.toLowerCase() === "soon") {
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
  function filterGames(query) {
    const q = query.toLowerCase().trim();
    const cards = Array.from(container.querySelectorAll(".game-card"));
    let visibleCount = 0;

    cards.forEach((card) => {
      const matches =
        !q ||
        card.dataset.title.includes(q) ||
        card.dataset.author.includes(q);
      card.style.display = matches ? "block" : "none";
      if (matches) visibleCount++;
    });

    // If no matches found, show centered message
    if (visibleCount === 0) {
      container.innerHTML = "<p>⚠ No games found.</p>";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "center";
      container.style.textAlign = "center";
      container.style.minHeight = "60vh";
    }
  }

  if (searchInput)
    searchInput.addEventListener("input", (e) => filterGames(e.target.value));
  if (searchBtn)
    searchBtn.addEventListener("click", () => filterGames(searchInput.value));

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
        container.querySelectorAll(".game-card")
      ).filter((c) => c.style.display !== "none").length;

      fadePlaceholder(searchInput, `${visibleCount} favorited games`, () => {
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
  async function loadGames() {
    showLoading("Loading favorites...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      gamesData = await res.json();

      createGameCards(gamesData);
      startPlaceholderCycle();

      // Wait for images or timeout
      const allImages = Array.from(container.querySelectorAll(".game-card img"));
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

  loadGames();
});
