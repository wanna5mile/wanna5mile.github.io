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

  const jsonPath = location.pathname.includes("/system/")
    ? "../json/assets.json"
    : "system/json/assets.json";

  async function loadGames() {
    container.textContent = "Loading assets...";
    container.style.textAlign = "center";

    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error(`Failed to load: ${jsonPath}`);
      gamesData = await response.json();

      container.innerHTML = "";
      container.style.textAlign = "";

      // Create cards
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

  function getFilteredCards() {
    return Array.from(container.querySelectorAll(".game-card")).filter(c => c.dataset.filtered === "true");
  }

  function getPagesWithContent() {
    const filteredCards = getFilteredCards();
    const pages = Array.from(new Set(filteredCards.map(c => parseInt(c.dataset.page))));
    return pages.sort((a, b) => a - b);
  }

  function renderPage() {
    const filteredCards = getFilteredCards();
    const pagesWithContent = getPagesWithContent();

    // Ensure currentPage is always valid
    if (currentPage < 1) currentPage = maxAllowedPage;
    if (currentPage > maxAllowedPage) currentPage = 1;

    // Show cards for current page, empty if none exist
    filteredCards.forEach(card => {
      const cardPage = parseInt(card.dataset.page);
      card.style.display = (cardPage === currentPage) ? "block" : "none";
    });

    pageIndicator.textContent = `Page ${currentPage} of ${maxAllowedPage}`;
    sessionStorage.setItem("currentPage", currentPage);

    const visibleCount = filteredCards.filter(c => parseInt(c.dataset.page) === currentPage).length;
    gameCountInfo.textContent = `${visibleCount} Games on page ${currentPage}`;
  }

  function filterGames(query) {
    const q = query.toLowerCase();
    const allCards = Array.from(container.querySelectorAll(".game-card"));

    allCards.forEach(card => {
      card.dataset.filtered = (!q || card.dataset.title.includes(q) || card.dataset.author.includes(q)) ? "true" : "false";
    });

    const pagesWithContent = getPagesWithContent();

    // If current page has no visible cards, move to nearest page in-between or closest content
    if (!pagesWithContent.includes(currentPage)) {
      // Find nearest page lower or higher
      let nearest = pagesWithContent.find(p => p > currentPage);
      if (!nearest) nearest = pagesWithContent[0]; // wrap forward
      currentPage = nearest || 1;
    }

    renderPage();
  }

  function prevPage() {
    const pagesWithContent = getPagesWithContent();
    let newPage = currentPage - 1;

    // Wrap backward if needed
    if (newPage < 1) newPage = maxAllowedPage;

    // If the page is empty but in-between or corner, still allow it
    currentPage = newPage;
    renderPage();
  }

  function nextPage() {
    const pagesWithContent = getPagesWithContent();
    let newPage = currentPage + 1;

    // Wrap forward if needed
    if (newPage > maxAllowedPage) newPage = 1;

    // If the page is empty but in-between or corner, still allow it
    currentPage = newPage;
    renderPage();
  }

  // Placeholder cycle
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
