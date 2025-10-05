document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const gameCountInfo = document.getElementById("gameCountInfo");

  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
  const gamesPerPage = 10;
  const maxAllowedPage = 10;

  // JSON source: local or GitHub link
  const jsonPath = "system/json/assets.json";
  // const jsonPath = "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/json/assets.json";

  // Load games from JSON
  async function loadGames() {
    container.textContent = "Loading assets...";
    container.style.textAlign = "center";

    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error(`Failed to fetch JSON: ${response.status}`);
      gamesData = await response.json();

      container.innerHTML = "";
      container.style.textAlign = "";

      // Create game cards
      gamesData.forEach(game => {
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

      renderPage();
      startPlaceholderCycle();
    } catch (err) {
      container.textContent = "⚠ Failed to load game data.";
      console.error(err);
    }
  }

  // Helper: get only visible/filtered cards
  function getFilteredCards() {
    return Array.from(container.querySelectorAll(".game-card"))
                .filter(c => c.dataset.filtered === "true");
  }

  function getPagesWithContent() {
    const filteredCards = getFilteredCards();
    const pages = Array.from(new Set(filteredCards.map(c => parseInt(c.dataset.page))));
    return pages.sort((a, b) => a - b);
  }

  // Render current page
  function renderPage() {
    const filteredCards = getFilteredCards();

    if (currentPage < 1) currentPage = maxAllowedPage;
    if (currentPage > maxAllowedPage) currentPage = 1;

    filteredCards.forEach(card => {
      const cardPage = parseInt(card.dataset.page);
      card.style.display = (cardPage === currentPage) ? "block" : "none";
    });

    pageIndicator.textContent = `Page ${currentPage} of ${maxAllowedPage}`;
    sessionStorage.setItem("currentPage", currentPage);

    const visibleCount = filteredCards.filter(c => parseInt(c.dataset.page) === currentPage).length;
    gameCountInfo.textContent = `${visibleCount} Games on page ${currentPage}`;
  }

  // Filter games by search query
  function filterGames(query) {
    const q = query.toLowerCase();
    const allCards = Array.from(container.querySelectorAll(".game-card"));

    allCards.forEach(card => {
      card.dataset.filtered = (!q || card.dataset.title.includes(q) || card.dataset.author.includes(q)) ? "true" : "false";
    });

    const pagesWithContent = getPagesWithContent();
    if (!pagesWithContent.includes(currentPage)) {
      // Jump to nearest page with content
      let nearest = pagesWithContent.find(p => p > currentPage) || pagesWithContent[0];
      currentPage = nearest || 1;
    }

    renderPage();
  }

  // Pagination
  function prevPage() {
    currentPage = currentPage - 1 < 1 ? maxAllowedPage : currentPage - 1;
    renderPage();
  }

  function nextPage() {
    currentPage = currentPage + 1 > maxAllowedPage ? 1 : currentPage + 1;
    renderPage();
  }

  // Placeholder fade effect
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
    function cycle() {
      const visibleCount = getFilteredCards().filter(c => parseInt(c.dataset.page) === currentPage).length;
      fadePlaceholder(searchInput, `${visibleCount} Games on page ${currentPage}`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search games...", () => setTimeout(cycle, 4000));
        }, 4000);
      });
    }
    cycle();
  }

  searchInput.addEventListener("keyup", () => filterGames(searchInput.value));
  searchBtn.addEventListener("click", () => filterGames(searchInput.value));

  window.prevPage = prevPage;
  window.nextPage = nextPage;

  loadGames();
});
