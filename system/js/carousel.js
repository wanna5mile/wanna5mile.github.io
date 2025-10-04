document.addEventListener("DOMContentLoaded", () => {
  const pageIndicator = document.querySelector(".page-indicator");
  const container = document.getElementById("container");

  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  // Add one or more remote JSON URLs here
  const jsonSources = [
    "https://theworldpt1.github.io/system/json/assets-test.json"
  ];

  async function loadGames() {
    container.textContent = "Loading assets...";

    try {
      // Fetch all JSON sources in parallel
      const allResponses = await Promise.all(
        jsonSources.map(url =>
          fetch(url).then(r => {
            if (!r.ok) throw new Error(`Failed to load: ${url}`);
            return r.json();
          })
        )
      );

      // Merge all loaded arrays into one
      gamesData = allResponses.flat();

      // Normalize and build UI
      gamesData.forEach(g => (g.page = parseInt(g.page)));

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
        `;

        // Hidden status element for internal data
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
      container.appendChild(msg);
    }

    // Hide page indicator
    pageIndicator.textContent = "";
    pageIndicator.style.display = "none";

    // Save last page
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
