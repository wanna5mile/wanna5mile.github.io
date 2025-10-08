document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");

  // --- Config & State ---
  let gamesData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
  const gamesPerPage = 10;
  const jsonPath = "system/json/assets.json";

  // --- Helper: Show loading message in container ---
  function showLoading(text) {
    if (container) {
      container.textContent = text;
      container.style.textAlign = "center";
    }
  }

  // --- Helper: Create game cards ---
  function createGameCards(data) {
    if (!container) return;

    const fallbackImage =
      "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/icons/blank_404.png";
    const fallbackLink = "https://theworldpt1.github.io/source/dino/";

    data.forEach((game, i) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();
      card.dataset.page = game.page || Math.floor(i / gamesPerPage) + 1;
      card.dataset.filtered = "true";

      // --- Logic for fallback image and link ---
      let imageSrc = game.image || "";
      let linkSrc = game.link || "";

      // If image is "" and status is "blank", use fallback image
      if (
        imageSrc.trim() === "" &&
        game.status &&
        game.status.trim().toLowerCase() === "blank"
      ) {
        imageSrc = fallbackImage;
      }

      // Otherwise, if image is missing/blank string, keep as-is or use fallback
      if (imageSrc.trim() === "" || imageSrc.trim().toLowerCase() === "blank") {
        imageSrc = fallbackImage;
      }

      // If link is empty, use the fallback dino link
      if (linkSrc.trim() === "") {
        linkSrc = fallbackLink;
      }

      // --- Create the card HTML ---
      card.innerHTML = `
        <a href="${linkSrc}" target="_blank" rel="noopener">
          <img 
            src="${imageSrc}" 
            alt="${game.title || "Game"}"
            style="image-rendering: pixelated;"
          >
          <h3>${game.title || "Untitled"}</h3>
        </a>
        <p>${game.author || "Unknown"}</p>
      `;
      container.appendChild(card);
    });
  }

  // --- Helpers for filtering/pagination ---
  function getAllCards() {
    return Array.from(container.querySelectorAll(".game-card"));
  }
  function getFilteredCards() {
    return getAllCards().filter(c => c.dataset.filtered === "true");
  }
  function getPagesWithContent() {
    const pages = new Set(getFilteredCards().map(c => parseInt(c.dataset.page)));
    return [...pages].sort((a, b) => a - b);
  }

  // --- Render page ---
  function renderPage() {
    const filteredCards = getFilteredCards();
    const pagesWithContent = getPagesWithContent();
    const maxPage = Math.max(...pagesWithContent, 1);

    if (currentPage < 1) currentPage = maxPage;
    if (currentPage > maxPage) currentPage = 1;

    getAllCards().forEach(card => {
      card.style.display =
        parseInt(card.dataset.page) === currentPage &&
        card.dataset.filtered === "true"
          ? "block"
          : "none";
    });

    if (pageIndicator)
      pageIndicator.textContent = `Page ${currentPage} of ${maxPage}`;

    sessionStorage.setItem("currentPage", currentPage);
  }

  // --- Search/filter ---
  function filterGames(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach(card => {
      const matches =
        !q ||
        card.dataset.title.includes(q) ||
        card.dataset.author.includes(q);
      card.dataset.filtered = matches ? "true" : "false";
    });

    const pagesWithContent = getPagesWithContent();
    if (!pagesWithContent.includes(currentPage)) {
      currentPage = pagesWithContent[0] || 1;
    }

    renderPage();
  }

  // --- Placeholder cycle ---
  function fadePlaceholder(input, text, cb) {
    if (!input) return;
    input.classList.add("fade-out");
    setTimeout(() => {
      input.placeholder = text;
      input.classList.remove("fade-out");
      input.classList.add("fade-in");
      setTimeout(() => {
        input.classList.remove("fade-in");
        if (cb) cb();
      }, 400);
    }, 400);
  }

  function startPlaceholderCycle() {
    if (!searchInput) return;
    const cycle = () => {
      const visibleCount = getFilteredCards().filter(
        c => parseInt(c.dataset.page) === currentPage
      ).length;

      fadePlaceholder(searchInput, `${visibleCount} games on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search games...", () =>
            setTimeout(cycle, 4000)
          );
        }, 4000);
      });
    };
    cycle();
  }

  // --- Pagination controls ---
  window.prevPage = function () {
    currentPage--;
    renderPage();
  };
  window.nextPage = function () {
    currentPage++;
    renderPage();
  };

  if (searchInput)
    searchInput.addEventListener("input", e => filterGames(e.target.value));
  if (searchBtn)
    searchBtn.addEventListener("click", () => filterGames(searchInput.value));

  // --- Main: Load JSON (waits for load-fire.gif before fade) ---
  async function loadGames() {
    showLoading("Loading assets...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif"; // default loading

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      gamesData = await res.json();

      container.innerHTML = "";
      createGameCards(gamesData);

      renderPage();
      startPlaceholderCycle();

      // Wait until all images are fully loaded
      const allImages = Array.from(container.querySelectorAll(".game-card img"));
      await Promise.allSettled(
        allImages.map(
          img =>
            new Promise(resolve => {
              if (img.complete) return resolve();
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
            })
        )
      );

      // Small delay for smoother transition
      await new Promise(r => setTimeout(r, 800));

      // Success: switch to load-fire.gif and wait until it fully loads
      if (loaderImage) {
        await new Promise(resolve => {
          loaderImage.onload = resolve;
          loaderImage.onerror = resolve;
          loaderImage.src = "system/images/GIF/load-fire.gif";
        });
      }

      // Once load-fire.gif is fully shown, fade preloader
      if (preloader) {
        preloader.classList.add("fade");
        setTimeout(() => (preloader.style.display = "none"), 600);
      }
    } catch (err) {
      console.error("Error loading JSON:", err);
      showLoading("⚠ Failed to load game data.");

      // Failure: switch to fail.gif, keep preloader visible
      if (loaderImage) loaderImage.src = "system/images/GIF/fail.gif";
    }
  }

  // --- Initialize ---
  loadGames();
});
