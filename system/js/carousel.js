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

  // --- Fallback paths ---
  const fallbackImage =
    "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://theworldpt1.github.io./source/dino/";

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
    data.forEach((game, i) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();
      card.dataset.page = game.page || Math.floor(i / gamesPerPage) + 1;
      card.dataset.filtered = "true";

      // --- Image and link fallback logic ---
      let imageSrc = game.image?.trim() || "";
      let linkSrc = game.link?.trim() || "";

      if (
        imageSrc === "" ||
        imageSrc.toLowerCase() === "blank" ||
        imageSrc.toLowerCase().includes("404")
      ) {
        imageSrc = fallbackImage;
      }

      if (linkSrc === "") linkSrc = fallbackLink;

      // --- Create the card HTML ---
      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = game.title || "Game";

      // --- NEW: handle broken image fallback ---
      img.addEventListener("error", () => {
        if (!img.dataset.fallbackApplied) {
          img.src = fallbackImage;
          img.dataset.fallbackApplied = "true";
        }
      });

      const link = document.createElement("a");
      link.href = linkSrc;
      link.target = "_blank";
      link.rel = "noopener";
      link.appendChild(img);
      link.innerHTML += `<h3>${game.title || "Untitled"}</h3>`;

      const author = document.createElement("p");
      author.textContent = game.author || "Unknown";

      // --- ✅ NEW: Handle "coming soon" games ---
      if (game.status?.toLowerCase() === "soon") {
        card.classList.add("soon");
        link.removeAttribute("href"); // make non-clickable
        link.style.pointerEvents = "none";
        link.style.cursor = "default";
      }

      card.appendChild(link);
      card.appendChild(author);
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
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      gamesData = await res.json();

      container.innerHTML = "";
      createGameCards(gamesData);

      renderPage();
      startPlaceholderCycle();

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

      await new Promise(r => setTimeout(r, 800));

      if (loaderImage) {
        await new Promise(resolve => {
          loaderImage.onload = resolve;
          loaderImage.onerror = resolve;
          loaderImage.src = "system/images/GIF/load-fire.gif";
        });
      }

      if (preloader) {
        preloader.classList.add("fade");
        setTimeout(() => (preloader.style.display = "none"), 600);
      }
    } catch (err) {
      console.error("Error loading JSON:", err);
      showLoading("⚠ Failed to load game data.");
      if (loaderImage) loaderImage.src = "system/images/GIF/fail.gif";
    }
  }

  // --- Initialize ---
  loadGames();
});
