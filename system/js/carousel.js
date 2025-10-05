document.addEventListener("DOMContentLoaded", () => {
  const pageIndicator = document.querySelector(".page-indicator");
  const container = document.getElementById("container");

  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  // Determine JSON path dynamically
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

      if (!Array.isArray(gamesData)) throw new Error("Invalid JSON: expected array");

      container.style.textAlign = "";
      container.innerHTML = "";

      // Create game cards
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
    const allGames = container.querySelectorAll(".game-card");
    let visibleCount = 0;

    allGames.forEach(card => {
      if (parseInt(card.dataset.page) === pageNum) {
        card.style.display = "block";
        visibleCount++;
      } else {
        card.style.display = "none";
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

    // Update page indicator
    const maxPage = Math.max(...gamesData.map(g => g.page));
    pageIndicator.textContent = `Page ${pageNum} of ${maxPage}`;
    pageIndicator.style.display = "inline";

    sessionStorage.setItem("currentPage", pageNum);
  }

  // Expose navigation functions
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
