document.addEventListener("DOMContentLoaded", () => {
  const pageIndicator = document.querySelector(".page-indicator");
  const container = document.getElementById("container");

  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  async function loadGames() {
    container.textContent = "Loading assets...";

    try {
      const response = await fetch("system/json/assets-test.json");
      if (!response.) throw new Error("Failed to load JSON");
      gamesData = await response.json();

      // Normalize page numbers (force them to integers)
      gamesData.forEach(g => g.page = parseInt(g.page));

      showPage(currentPage);
    } catch (err) {
      container.textContent = "⚠ Failed to load.";
      console.error("Error loading games:", err);
    }
  }

  function showPage(pageNum) {
    container.innerHTML = "";

    const pageItems = gamesData.filter(game => game.page === pageNum);

    if (pageItems.length === 0) {
      container.textContent = "No games on this page.";
    } else {
      pageItems.forEach(game => {
        const gameDiv = document.createElement("div");
        gameDiv.className = "game-card";
        gameDiv.innerHTML = `
          <a href="${game.link}" target="_blank">
            <img src="${game.image}" alt="${game.title}">
            <h3>${game.title}</h3>
          </a>
          <p>${game.author}</p>
          <span class="status">${game.status || ""}</span>
        `;
        container.appendChild(gameDiv);
      });
    }

    pageIndicator.textContent = `Page ${pageNum}`;
    sessionStorage.setItem("currentPage", pageNum);
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

  loadGames();
});
