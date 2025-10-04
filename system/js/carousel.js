document.addEventListener("DOMContentLoaded", () => {
  const pageIndicator = document.querySelector(".page-indicator");
  const container = document.getElementById("container");

  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  // Determine JSON path dynamically
  const jsonPath = location.pathname.includes("/system/")
    ? "../json/assets-test.json"
    : "system/json/assets-test.json";

  async function loadGames() {
    // Temporary loading message, centered
    container.textContent = "Loading assets...";
    container.style.textAlign = "center";

    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error(`Failed to load: ${jsonPath}`);
      gamesData = await response.json();

      if (!Array.isArray(gamesData)) {
        throw new Error("Invalid JSON format: expected an array.");
      }

      // Reset alignment for actual game cards
      container.style.textAlign = "";

      // Normalize page numbers
      gamesData.forEach(g => (g.page = parseInt(g.page)));

      // Clear container
      container.innerHTML = "";

      // Build game cards
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
        `;

        // Hidden status element
        const hiddenStatus = document.createElement("span");
        hiddenStatus.className = "status";
        hiddenStatus.style.display = "none";
        hiddenStatus.textContent = game.status || "";
        gameDiv.appendChild(hiddenStatus);

        container.appendChild(gameDiv);
      });

      showPage(currentPage);
    } catch (err) {
      container.textContent = "⚠ Failed to load game data.";
      container.style.textAlign = "center";
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

    container.querySelectorAll(".no-games").forEach(el => el.remove());
    if (visibleCount === 0) {
      const msg = document.createElement("p");
      msg.className = "no-games";
      msg.textContent = "No games on this page.";
      msg.style.textAlign = "center";
      container.appendChild(msg);
    }

    // Update page indicator and make it visible
    pageIndicator.textContent = `Page ${pageNum}`;
    pageIndicator.style.display = "inline"; // ensures it's visible

    sessionStorage.setItem("currentPage", pageNum);
  }

  // Page controls
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
