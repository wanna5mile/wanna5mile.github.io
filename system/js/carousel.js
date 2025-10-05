document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");

  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
  const gamesPerPage = 10;

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

  function renderPage() {
    const allCards = Array.from(container.querySelectorAll(".game-card"));
    const filteredCards = allCards.filter(card => card.dataset.filtered !== "false");

    // Use max page from JSON instead of filtered length
    const maxPage = Math.max(...gamesData.map(g => g.page || 1), 1);
    if (currentPage > maxPage) currentPage = maxPage;

    filteredCards.forEach(card => {
      card.style.display = (parseInt(card.dataset.page) === currentPage) ? "block" : "none";
    });

    pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;
    sessionStorage.setItem("currentPage", currentPage);

    updateGameCount();
  }

  function updateGameCount() {
    const visible = Array.from(container.querySelectorAll(".game-card"))
      .filter(c => c.style.display !== "none");
    const info = document.getElementById("gameCountInfo");
    if (info) info.textContent = `${visible.length} Games on page ${currentPage}`;
  }

  function filterGames(query) {
    const q = query.toLowerCase();
    const allCards = Array.from(container.querySelectorAll(".game-card"));
    allCards.forEach(card => {
      if (!q || card.dataset.title.includes(q) || card.dataset.author.includes(q)) {
        card.dataset.filtered = "true";
      } else {
        card.dataset.filtered = "false";
      }
    });
    currentPage = 1;
    renderPage();
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  }

  function nextPage() {
    const maxPage = Math.max(...gamesData.map(g => g.page || 1), 1);
    if (currentPage < maxPage) {
      currentPage++;
      renderPage();
    }
  }

  searchInput.addEventListener("keyup", () => filterGames(searchInput.value));
  searchBtn.addEventListener("click", () => filterGames(searchInput.value));

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
    const input = searchInput;
    function cycle() {
      fadePlaceholder(input, `${container.querySelectorAll(".game-card:not([style*='display: none'])").length} Games on page ${currentPage}`, () => {
        setTimeout(() => {
          fadePlaceholder(input, "Search games...", () => setTimeout(cycle, 4000));
        }, 4000);
      });
    }
    cycle();
  }

  window.prevPage = prevPage;
  window.nextPage = nextPage;

  loadGames();
});
