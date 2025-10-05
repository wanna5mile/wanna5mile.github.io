document.addEventListener("DOMContentLoaded", () => {
  const pageIndicator = document.querySelector(".page-indicator");
  const container = document.getElementById("container");
  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

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

      container.style.textAlign = "";
      container.innerHTML = "";

      gamesData.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";
        card.dataset.page = game.page;

        card.innerHTML = `
          <a href="${game.link}" target="_blank">
            <img src="${game.image}" alt="${game.title}">
            <h3>${game.title}</h3>
          </a>
          <p>${game.author}</p>
        `;

        const hiddenStatus = document.createElement("span");
        hiddenStatus.className = "status";
        hiddenStatus.style.display = "none";
        hiddenStatus.textContent = game.status || "";
        card.appendChild(hiddenStatus);

        container.appendChild(card);
      });

      showPage(currentPage);
    } catch (err) {
      container.textContent = "⚠ Failed to load game data.";
      container.style.textAlign = "center";
      console.error(err);
    }
  }

  function showPage(pageNum) {
    const allGames = Array.from(container.querySelectorAll(".game-card"));
    const filteredGames = allGames.filter(card => card.style.display !== "none" || card.dataset.filtered === undefined);

    const maxPage = Math.max(...gamesData.map(g => g.page));
    currentPage = Math.min(pageNum, maxPage);

    allGames.forEach(card => {
      card.style.display = parseInt(card.dataset.page) === currentPage ? "block" : "none";
    });

    // Page indicator
    pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;
    pageIndicator.style.display = "inline";

    sessionStorage.setItem("currentPage", currentPage);
  }

  window.nextPage = function () {
    const maxPage = Math.max(...gamesData.map(g => g.page));
    currentPage = currentPage >= maxPage ? 1 : currentPage + 1;
    showPage(currentPage);
  };

  window.prevPage = function () {
    const maxPage = Math.max(...gamesData.map(g => g.page));
    currentPage = currentPage <= 1 ? maxPage : currentPage - 1;
    showPage(currentPage);
  };

  // --- Search ---
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");

  function filterGames(query) {
    const input = query.toLowerCase();
    const allGames = container.querySelectorAll(".game-card");
    allGames.forEach(card => {
      const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const author = card.querySelector("p")?.textContent.toLowerCase() || "";
      if (title.includes(input) || author.includes(input)) {
        card.dataset.filtered = "true";
      } else {
        card.dataset.filtered = "false";
      }
    });
    // Reset to first page after search
    currentPage = 1;
    showFilteredPage();
  }

  function showFilteredPage() {
    const allGames = Array.from(container.querySelectorAll(".game-card"));
    const filteredGames = allGames.filter(card => card.dataset.filtered === "true");

    filteredGames.forEach(card => card.style.display = "block");
    allGames.filter(card => card.dataset.filtered !== "true").forEach(card => card.style.display = "none");

    // Update page indicator
    pageIndicator.textContent = `Page ${currentPage} of ${Math.max(...gamesData.map(g => g.page))}`;
  }

  searchInput.addEventListener("keyup", () => filterGames(searchInput.value));
  searchBtn.addEventListener("click", () => filterGames(searchInput.value));

  loadGames();
});
