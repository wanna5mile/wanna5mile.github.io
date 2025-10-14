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
  const gamesPerPage = 10;
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

  // --- Card Creation (yesterday logic restored) ---
  function createGameCards(data) {
    if (!container) return;

    const sortedData = [...data].sort((a, b) => {
      const aFav = favorites.has(a.title);
      const bFav = favorites.has(b.title);
      if (aFav !== bFav) return bFav - aFav;
      return (a.page || 1) - (b.page || 1);
    });

    sortedData.forEach((game, i) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();
      card.dataset.page = game.page ? parseInt(game.page) : Math.floor(i / gamesPerPage) + 1;
      card.dataset.filtered = "true";

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
        refreshCards();
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

  // --- Page Logic (yesterday logic restored) ---
  function getAllCards() {
    return Array.from(container.querySelectorAll(".game-card"));
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
        parseInt(card.dataset.page) === currentPage &&
        card.dataset.filtered === "true"
          ? "block"
          : "none";
    });

    if (pageIndicator)
      pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;
    sessionStorage.setItem("currentPage", currentPage);
  }

  window.prevPage = () => {
    const pages = getPagesWithContent();
    if (!pages.length) return;
    const i = pages.indexOf(currentPage);
    currentPage = i === 0 ? pages[pages.length - 1] : pages[i - 1];
    renderPage();
  };

  window.nextPage = () => {
    const pages = getPagesWithContent();
    if (!pages.length) return;
    const i = pages.indexOf(currentPage);
    currentPage = i === pages.length - 1 ? pages[0] : pages[i + 1];
    renderPage();
  };

  // --- Filtering ---
  function filterGames(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const matches = !q || card.dataset.title.includes(q) || card.dataset.author.includes(q);
      card.dataset.filtered = matches ? "true" : "false";
    });
    renderPage();
  }

  if (searchInput)
    searchInput.addEventListener("input", (e) => filterGames(e.target.value));
  if (searchBtn)
    searchBtn.addEventListener("click", () => filterGames(searchInput.value));

  function refreshCards() {
    container.innerHTML = "";
    createGameCards(gamesData);
    filterGames(searchInput?.value || "");
  }

  // --- Preloader Logic (new fix kept) ---
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
      renderPage();

      // Wait for all images to load before hiding preloader
      const imgs = Array.from(container.querySelectorAll(".game-card img"));
      await Promise.allSettled(
        imgs.map(
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

  window.addEventListener("load", loadGames);
});
