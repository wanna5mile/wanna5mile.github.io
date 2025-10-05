document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");

  // --- Config & State ---
  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
  const gamesPerPage = 10;
  const jsonPath = "system/json/assets.json";

  // --- Load JSON and create cards ---
async function loadGames() {
  showLoading("Loading assets...");
  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
    gamesData = await res.json();

    container.innerHTML = "";
    createGameCards(gamesData);

    renderPage();
    startPlaceholderCycle();

    // ✅ Hide preloader
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.classList.add("fade");
      setTimeout(() => preloader.style.display = "none", 500); // matches CSS transition
    }
  } catch (err) {
    showLoading("⚠ Failed to load game data.");
    console.error("Error loading JSON:", err);
  }
}

  function showLoading(text) {
    if (container) {
      container.textContent = text;
      container.style.textAlign = "center";
    }
  }

  function createGameCards(data) {
    if (!container) return;
    data.forEach((game, i) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();
      card.dataset.page = game.page || Math.floor(i / gamesPerPage) + 1;
      card.dataset.filtered = "true";

      card.innerHTML = `
        <a href="${game.link || "#"}" target="_blank" rel="noopener">
          <img src="${game.image || "system/images/placeholder.png"}" alt="${game.title || "Game"}">
          <h3>${game.title || "Untitled"}</h3>
        </a>
        <p>${game.author || "Unknown"}</p>
      `;
      container.appendChild(card);
    });
  }

  // --- Helpers ---
  function getAllCards() {
    return Array.from(container.querySelectorAll(".game-card"));
  }

  function getFilteredCards() {
    return getAllCards().filter(c => c.dataset.filtered === "true");
  }

  function getPagesWithContent() {
    const pages = new Set(getFilteredCards().map(c => parseInt(c.dataset.page)));
    return [...pages].sort((a, b) => a - b);
  }

  // --- Render Page ---
  function renderPage() {
    const filteredCards = getFilteredCards();
    const pagesWithContent = getPagesWithContent();
    const maxPage = Math.max(...pagesWithContent, 1);

    if (currentPage < 1) currentPage = maxPage;
    if (currentPage > maxPage) currentPage = 1;

    getAllCards().forEach(card => {
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

  // --- Search / Filter ---
  function filterGames(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach(card => {
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

  // --- Events ---
  if (searchInput) {
    searchInput.addEventListener("input", e => filterGames(e.target.value));
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", () => filterGames(searchInput.value));
  }

  // --- Pagination ---
  window.prevPage = function () {
    currentPage--;
    renderPage();
  };

  window.nextPage = function () {
    currentPage++;
    renderPage();
  };

  // --- Placeholder Cycle ---
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
      const visibleCount = getFilteredCards().filter(
        c => parseInt(c.dataset.page) === currentPage
      ).length;

      fadePlaceholder(searchInput, `${visibleCount} games on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search games...", () => setTimeout(cycle, 4000));
        }, 4000);
      });
    };
    cycle();
  }

  // --- Initialize ---
  loadGames();
});
