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
  const maxAllowedPage = 10;
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
    } catch (err) {
      showLoading("⚠ Failed to load game data.");
      console.error(err);
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
    data.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();
      card.dataset.page = game.page || 1;
      card.dataset.filtered = "true";

      card.innerHTML = `
        <a href="${game.link || "#"}" target="_blank">
          <img src="${game.image}" alt="${game.title || "Game"}">
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
    const pages = Array.from(new Set(getFilteredCards().map(c => parseInt(c.dataset.page))));
    return pages.sort((a, b) => a - b);
  }

  // --- Render Page ---
  function renderPage() {
    const filteredCards = getFilteredCards();

    if (currentPage < 1) currentPage = maxAllowedPage;
    if (currentPage > maxAllowedPage) currentPage = 1;

    filteredCards.forEach(card => {
      card.style.display = parseInt(card.dataset.page) === currentPage ? "block" : "none";
    });

    if (pageIndicator) pageIndicator.textContent = `Page ${currentPage} of ${maxAllowedPage}`;
    sessionStorage.setItem("currentPage", currentPage);
  }

  // --- Search / Filter ---
  function filterGames(query) {
    const q = query.toLowerCase();
    getAllCards().forEach(card => {
      card.dataset.filtered =
        !q || card.dataset.title.includes(q) || card.dataset.author.includes(q)
          ? "true"
          : "false";
    });

    const pagesWithContent = getPagesWithContent();
    if (!pagesWithContent.includes(currentPage)) {
      currentPage = pagesWithContent.find(p => p > currentPage) || pagesWithContent[0] || 1;
    }

    renderPage();
  }

  searchInput?.addEventListener("keyup", () => filterGames(searchInput.value));
  searchBtn?.addEventListener("click", () => filterGames(searchInput.value));

  // --- Pagination ---
  function prevPage() {
    currentPage = currentPage - 1 < 1 ? maxAllowedPage : currentPage - 1;
    renderPage();
  }

  function nextPage() {
    currentPage = currentPage + 1 > maxAllowedPage ? 1 : currentPage + 1;
    renderPage();
  }

  window.prevPage = prevPage;
  window.nextPage = nextPage;

  // --- Placeholder Fade Cycle ---
  function fadePlaceholder(input, text, cb) {
    input.classList.add("fade-out");
    setTimeout(() => {
      input.placeholder = text;
      input.classList.remove("fade-out");
      input.classList.add("fade-in");
      setTimeout(() => {
        input.classList.remove("fade-in");
        if (cb) cb();
      }, 500);
    }, 500);
  }

  function startPlaceholderCycle() {
    const cycle = () => {
      const visibleCount = getFilteredCards().filter(
        c => parseInt(c.dataset.page) === currentPage
      ).length;

      fadePlaceholder(searchInput, `${visibleCount} Games on page ${currentPage}`, () => {
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
