document.addEventListener("DOMContentLoaded", () => {
  const pageIndicator = document.querySelector(".page-indicator");
  const container = document.getElementById("container");

  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  async function loadGames() {
    container.textContent = "Loading assets...";

    try {
      const response = await fetch("system/json/assets-test.json");
      if (!response.ok) throw new Error("Failed to load JSON");
      gamesData = await response.json();

      // Normalize page numbers
      gamesData.forEach(g => g.page = parseInt(g.page));

      // Build all cards once
      container.innerHTML = "";
      gamesData.forEach(game => {
        const gameDiv = document.createElement("div");
        gameDiv.className = "game-card";
        gameDiv.dataset.page = game.page;
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

      showPage(currentPage);
    } catch (err) {
      container.textContent = "⚠ Failed to load.";
      console.error("Error loading games:", err);
    }
  }

  function showPage(pageNum) {
    const allGames = container.querySelectorAll(".game-card");
    let visibleCount = 0;

    allGames.forEach(gameDiv => {
      if (parseInt(gameDiv.dataset.page) === pageNum) {
        gameDiv.style.display = "block";
        visibleCount++;
      } else {
        gameDiv.style.display = "none";
      }
    });

    // If no games on that page, just show a message (without destroying the DOM)
    if (visibleCount === 0) {
      container.querySelectorAll(".no-games").forEach(el => el.remove());
      const msg = document.createElement("p");
      msg.className = "no-games";
      msg.textContent = `No games on page ${pageNum}.`;
      container.appendChild(msg);
    } else {
      container.querySelectorAll(".no-games").forEach(el => el.remove());
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
