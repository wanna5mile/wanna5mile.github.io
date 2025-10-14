document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");

  // --- Config & State ---
  const totalPages = 10; // fallback for static total pages
  const gamesPerPage = 10;
  const jsonPath = "system/json/assets.json";
  const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
  const fallbackImage =
    "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://theworldpt1.github.io./source/dino/";
  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  // --- Helpers ---
  function showLoading(text) {
    container.textContent = text;
    container.style.textAlign = "center";
  }

  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
  }

  // --- Card Creation ---
  function createGameCards(data) {
    if (!container) return;
    container.innerHTML = "";

    const sortedData = [...data].sort((a, b) => {
      const aFav = favorites.has(a.title);
      const bFav = favorites.has(b.title);
      if (aFav !== bFav) return bFav - aFav;
      return (a.page || 1) - (b.page || 1);
    });

    sortedData.forEach((game, i) => {
      const card = document.createElement("div");
      card.className = `game-card page-${Math.floor(i / gamesPerPage) + 1}`;
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();

      // --- Image + Link ---
      let imageSrc = game.image?.trim() || "";
      let linkSrc = game.link?.trim() || "";
      if (!imageSrc || imageSrc === "blank" || game.status?.toLowerCase() === "blank")
        imageSrc = fallbackImage;
      if (!linkSrc) linkSrc = fallbackLink;

      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = game.title || "Game";
      img.loading = "lazy";
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
      author.textContent = game.author || " ";

      // --- Favorite toggle ---
      const star = document.createElement("span");
      star.className = "favorite-star";
      star.textContent = favorites.has(game.title) ? "★" : "☆";
      star.title = "Toggle favorite";
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (favorites.has(game.title)) {
          favorites.delete(game.title);
          star.textContent = "☆";
        } else {
          favorites.add(game.title);
          star.textContent = "★";
        }
        saveFavorites();
        createGameCards(gamesData);
        showPage(currentPage);
      });

      if (game.status?.toLowerCase() === "soon") {
        card.classList.add("soon");
        link.removeAttribute("href");
        link.style.pointerEvents = "none";
      }

      card.appendChild(link);
      card.appendChild(author);
      card.appendChild(star);
      container.appendChild(card);
    });
  }

  // --- Page Logic (old version restored) ---
  function showPage(pageNum) {
    const allItems = document.querySelectorAll('[class*="page-"]');
    allItems.forEach((item) => {
      if (item.classList.contains(`page-${pageNum}`)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });

    if (pageIndicator)
      pageIndicator.textContent = `Page ${pageNum}`;

    sessionStorage.setItem("currentPage", pageNum);
  }

  window.nextPage = function () {
    currentPage = currentPage >= totalPages ? 1 : currentPage + 1;
    showPage(currentPage);
  };

  window.prevPage = function () {
    currentPage = currentPage <= 1 ? totalPages : currentPage - 1;
    showPage(currentPage);
  };

  // --- Search Filter ---
  function filterGames(query) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll(".game-card");
    cards.forEach((card) => {
      const match =
        !q ||
        card.dataset.title.includes(q) ||
        card.dataset.author.includes(q);
      card.style.display = match ? "block" : "none";
    });

    if (![...cards].some((c) => c.style.display === "block")) {
      container.innerHTML = `<p style="text-align:center;">No games found.</p>`;
    }
  }

  if (searchInput)
    searchInput.addEventListener("input", (e) => filterGames(e.target.value));
  if (searchBtn)
    searchBtn.addEventListener("click", () => filterGames(searchInput.value));

  // --- Centralized Preloader Logic ---
  function hidePreloader(finalGif) {
    if (loaderImage) loaderImage.src = finalGif;
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add("fade");
        setTimeout(() => (preloader.style.display = "none"), 600);
      }, 500);
    }
  }

  // --- Initialization ---
  async function loadGames() {
    showLoading("Loading assets...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);

      gamesData = await res.json();
      container.innerHTML = "";
      createGameCards(gamesData);
      showPage(currentPage);

      // Wait for all images to finish (even cached ones)
      const allImages = Array.from(container.querySelectorAll(".game-card img"));
      await Promise.allSettled(
        allImages.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
            })
        )
      );

      hidePreloader("system/images/GIF/load-fire.gif");
    } catch (err) {
      console.error("Error loading JSON:", err);
      showLoading("⚠ Failed to load game data.");
      hidePreloader("system/images/GIF/fail.gif");
    }
  }

  // ✅ Wait until the full window (not just DOM) is loaded
  window.addEventListener("load", loadGames);
});
