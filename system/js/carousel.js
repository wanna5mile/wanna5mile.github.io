document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");

  // --- Config & State ---
  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
  const gamesPerPage = 10;
  const jsonPath = "system/json/assets.json";
  const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

  // --- Fallback paths ---
  const fallbackImage =
    "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://theworldpt1.github.io./source/dino/";

  // --- Utility Functions ---
  function showLoading(text) {
    if (container) {
      container.textContent = text;
      container.style.textAlign = "center";
    }
  }

  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
  }

  // --- Card Creation (respects JSON page numbers) ---
  function createGameCards(data) {
    if (!container) return;

    const sortedData = [...data].sort((a, b) => {
      const aFav = favorites.has(a.title);
      const bFav = favorites.has(b.title);
      if (aFav !== bFav) return bFav - aFav; // Favorites first
      return (a.page || 1) - (b.page || 1); // Then by JSON page
    });

    sortedData.forEach((game, i) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();

      // ✅ Use JSON-defined page if available, else fallback
      card.dataset.page = game.page
        ? parseInt(game.page)
        : Math.floor(i / gamesPerPage) + 1;
      card.dataset.filtered = "true";

      // --- Image & Link Setup ---
      let imageSrc = game.image?.trim() || "";
      let linkSrc = game.link?.trim() || "";

      if (
        imageSrc === "" ||
        imageSrc.toLowerCase() === "blank" ||
        game.status?.toLowerCase() === "blank" ||
        imageSrc ===
          "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/assets/images/"
      ) {
        imageSrc = fallbackImage;
      }
      if (linkSrc === "") linkSrc = fallbackLink;

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
      author.textContent = game.author || "Unknown";

      // --- Favorite Star ---
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

      // --- Status: "soon" disables link ---
      if (game.status?.toLowerCase() === "soon") {
        card.classList.add("soon");
        link.removeAttribute("href");
        link.style.pointerEvents = "none";
        link.style.cursor = "default";
      }

      // --- Assemble Card ---
      card.appendChild(link);
      card.appendChild(author);
      card.appendChild(star);
      container.appendChild(card);
    });
  }

  // --- Paging & Filtering ---
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
    currentPage = Math.min(Math.max(1, currentPage), maxPage);

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

  function filterGames(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const matches =
        !q ||
        card.dataset.title.includes(q) ||
        card.dataset.author.includes(q);
      card.dataset.filtered = matches ? "true" : "false";
    });

    const pagesWithContent = getPagesWithContent();
    if (!pagesWithContent.includes(currentPage)) {
      currentPage = pagesWithContent[0] || 1;
    }

    renderPage();
  }

  function refreshCards() {
    container.innerHTML = "";
    createGameCards(gamesData);
    filterGames(searchInput?.value || "");
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
      fadePlaceholder(searchInput, `${visibleCount} games on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search games...", () =>
            setTimeout(cycle, 4000)
          );
        }, 4000);
      });
    };
    cycle();
  }

  // --- Paging Buttons ---
  window.prevPage = () => {
    currentPage = Math.max(1, currentPage - 1);
    renderPage();
  };

  window.nextPage = () => {
    const maxPage = Math.max(...getPagesWithContent(), 1);
    currentPage = Math.min(maxPage, currentPage + 1);
    renderPage();
  };

  // --- Event Listeners ---
  if (searchInput)
    searchInput.addEventListener("input", (e) => filterGames(e.target.value));
  if (searchBtn)
    searchBtn.addEventListener("click", () => filterGames(searchInput.value));

  // --- Initialization ---
  async function loadGames() {
    showLoading("Loading assets...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      gamesData = await res.json();

      // --- Build UI immediately ---
      container.innerHTML = "";
      createGameCards(gamesData);
      renderPage();
      startPlaceholderCycle();

      // --- Switch Preloader Quickly ---
      if (loaderImage) loaderImage.src = "system/images/GIF/load-fire.gif";
      if (preloader) {
        setTimeout(() => {
          preloader.classList.add("fade");
          setTimeout(() => (preloader.style.display = "none"), 600);
        }, 400);
      }

      // --- Preload images silently ---
      const allImages = Array.from(container.querySelectorAll(".game-card img"));
      Promise.allSettled(
        allImages.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
            })
        )
      );
    } catch (err) {
      console.error("Error loading JSON:", err);
      showLoading("⚠ Failed to load game data.");
      if (loaderImage) loaderImage.src = "system/images/GIF/fail.gif";
      if (preloader) {
        preloader.classList.add("fade");
        setTimeout(() => (preloader.style.display = "none"), 600);
      }
    }
  }

  loadGames();
});
