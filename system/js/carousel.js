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

        // Build visible card (no status shown)
        gameDiv.innerHTML = `
          <a href="${game.link}" target="_blank">
            <img src="${game.image}" alt="${game.title}">
            <h3>${game.title}</h3>
          </a>
          <p>${game.author}</p>
        `;

        // Add status element (kept hidden in DOM for data completeness)
        const hiddenStatus = document.createElement("span");
        hiddenStatus.className = "status";
        hiddenStatus.style.display = "none"; // fully hidden
        hiddenStatus.textContent = game.status || "";
        gameDiv.appendChild(hiddenStatus);

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

    // If no games on that page, show message
    container.querySelectorAll(".no-games").forEach(el => el.remove());
    if (visibleCount === 0) {
      const msg = document.createElement("p");
      msg.className = "no-games";
      msg.textContent = `No games on this page.`;
      container.appendChild(msg);
    }

    // Hide the page indicator text entirely
    pageIndicator.textContent = "";
    pageIndicator.style.display = "none";

    // Save last page to session
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
