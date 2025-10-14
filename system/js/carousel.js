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
  const jsonPath = "system/json/assets.json";
  const favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

  // --- Fallbacks ---
  const fallbackImage =
    "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/system/images/404_blank.png";
  const fallbackLink = "https://theworldpt1.github.io./source/dino/";

  // --- Helpers ---
  function showLoading(text) {
    container.textContent = text;
    container.style.textAlign = "center";
  }

  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
  }

  // --- Card Creation ---
  function createGameCards(data) {
    if (!container) return;
    const sortedData = [...data].sort((a, b) => {
      const aFav = favorites.has(a.title);
      const bFav = favorites.has(b.title);
      if (aFav !== bFav) return bFav - aFav;
      return (a.page || 1) - (b.page || 1);
    });

    sortedData.forEach((game) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.dataset.title = (game.title || "").toLowerCase();
      card.dataset.author = (game.author || "").toLowerCase();
      card.dataset.page = game.page ? parseInt(game.page) : 1;
      card.dataset.filtered = "true";

      // --- Image + Link ---
      let imageSrc = game.image?.trim() || "";
      let linkSrc = game.link?.trim() || "";
      if (!imageSrc || imageSrc === "blank" || game.status?.toLowerCase() === "blank")
        imageSrc = fallbackImage;
      if (!linkSrc) linkSrc = fallbackLink;

      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = game.title || "Game";
      img.loading = "lazy";
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
      author.textContent = game.author || " ";

      const star = document.createElement("span");
      star.className = "favorite-star";
      star.textContent = favorites.has(game.title) ? "★" : "☆";
      star.title = "Toggle favorite";
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (favorites.has(game.title)) {
          favorites.delete(game.title);
          star.textContent = "☆";
        } else {
          favorites.add(game.title);
          star.textContent = "★";
        }
        saveFavorites();
        refreshCards();
      });

      // --- Handle special statuses ---
      const status = game.status?.toLowerCase();
      if (status === "soon") {
        card.classList.add("soon");
        link.removeAttribute("href");
        link.style.pointerEvents = "none";
      } else if (status === "featured" || status === "fixed") {
        // Add overlay badge image
        const overlay = document.createElement("img");
        overlay.className = `status-overlay ${status}`;
        overlay.src = `system/images/${status}.png`;
        overlay.alt = status;
        overlay.loading = "lazy";
        card.appendChild(overlay);
      }

      card.appendChild(link);
      card.appendChild(author);
      card.appendChild(star);
      container.appendChild(card);
    });
  }

  // --- Page + Filter Logic ---
  function getAllCards() {
    return Array.from(container.querySelectorAll(".game-card"));
  }

  function getFilteredCards() {
    return getAllCards().filter((c) => c.dataset.filtered === "true");
  }

  function getPagesWithContent() {
    const pages = new Set(getFilteredCards().map((c) => parseInt(c.dataset.page)));
    return [...pages].sort((a, b) => a - b);
  }

  function renderPage() {
    const pagesWithContent = getPagesWithContent();
    const maxPage = Math.max(...pagesWithContent, 1);
    if (!pagesWithContent.includes(currentPage)) {
      currentPage = pagesWithContent[0] || 1;
    }

    getAllCards().forEach((card) => {
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

  function filterGames(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const matches = !q || card.dataset.title.includes(q) || card.dataset.author.includes(q);
      card.dataset.filtered = matches ? "true" : "false";
    });
    renderPage();
  }

  function refreshCards() {
    container.innerHTML = "";
    createGameCards(gamesData);
    filterGames(searchInput?.value || "");
  }

  // --- Placeholder Animation ---
  function fadePlaceholder(input, text, cb) {
    if (!input) return;
    input.classList.add("fade-out");
    setTimeout(() => {
      input.placeholder = text;
      input.classList.remove("fade-out");
      input.classList.add("fade-in");
      setTimeout(() => {
        input.classList.remove("fade-in");
        cb && cb();
      }, 400);
    }, 400);
  }

  function startPlaceholderCycle() {
    if (!searchInput) return;
    const cycle = () => {
      const visibleCount = getFilteredCards().filter(
        (c) => parseInt(c.dataset.page) === currentPage
      ).length;
      fadePlaceholder(searchInput, `${visibleCount} games on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search games...", () => setTimeout(cycle, 4000));
        }, 4000);
      });
    };
    cycle();
  }

  // --- Carousel Page Navigation ---
  window.prevPage = () => {
    const pagesWithContent = getPagesWithContent();
    if (pagesWithContent.length === 0) return;

    const index = pagesWithContent.indexOf(currentPage);
    currentPage =
      index === 0 ? pagesWithContent[pagesWithContent.length - 1] : pagesWithContent[index - 1];
    renderPage();
  };

  window.nextPage = () => {
    const pagesWithContent = getPagesWithContent();
    if (pagesWithContent.length === 0) return;

    const index = pagesWithContent.indexOf(currentPage);
    currentPage =
      index === pagesWithContent.length - 1 ? pagesWithContent[0] : pagesWithContent[index + 1];
    renderPage();
  };

  // --- Initialization ---
  async function loadGames() {
    showLoading("Loading assets...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      gamesData = await res.json();

      container.innerHTML = "";
      createGameCards(gamesData);
      renderPage();
      startPlaceholderCycle();

      // --- Wait for all images before hiding preloader ---
      const allImages = Array.from(container.querySelectorAll(".game-card img"));
      const imagePromises = allImages.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }
          })
      );

      await Promise.allSettled(imagePromises);

      setTimeout(() => {
        if (loaderImage) loaderImage.src = "system/images/GIF/load-fire.gif";
        if (preloader) {
          preloader.classList.add("fade");
          setTimeout(() => (preloader.style.display = "none"), 600);
        }
      }, 400);

    } catch (err) {
      console.error("Error loading JSON:", err);
      showLoading("⚠ Failed to load game data.");

      // 🔥💥☠️ Sequential error animation logic:
      if (loaderImage) {
        loaderImage.src = "system/images/GIF/crash.gif";

        loaderImage.addEventListener(
          "load",
          () => {
            const crashDuration = 2800; // adjust to match crash.gif duration
            setTimeout(() => {
              loaderImage.src = "system/images/GIF/ded.gif";
            }, crashDuration);
          },
          { once: true }
        );
      }

      // Keep preloader visible so ded.gif loops
      if (preloader) {
        preloader.classList.remove("fade");
        preloader.style.display = "flex";
      }
    }
  }

  loadGames();
});
