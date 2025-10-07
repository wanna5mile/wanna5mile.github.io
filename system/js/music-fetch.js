document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");

  // --- Config & State ---
  let musicData = [];
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
  const itemsPerPage = 10;
  const jsonPath = "system/json/music.json";

  // --- Helper: Show loading message in container ---
  function showLoading(text) {
    if (container) {
      container.textContent = text;
      container.style.textAlign = "center";
    }
  }

  // --- Helper: Create music cards ---
  function createMusicCards(data) {
    if (!container) return;
    data.forEach((track, i) => {
      const card = document.createElement("div");
      card.className = "music-card";
      card.dataset.title = (track.title || "").toLowerCase();
      card.dataset.creator = (track.creator || "").toLowerCase();
      card.dataset.page = track.page || Math.floor(i / itemsPerPage) + 1;
      card.dataset.filtered = "true";

      card.innerHTML = `
        <div class="music-cover">
          <img src="${track.cover || "system/images/placeholder.png"}" alt="${track.title || "Track"}">
        </div>
        <div class="music-info">
          <h3>${track.title || "Untitled"}</h3>
          <p>${track.creator || "Unknown"}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // --- Helpers for filtering/pagination ---
  function getAllCards() { return Array.from(container.querySelectorAll(".music-card")); }
  function getFilteredCards() { return getAllCards().filter(c => c.dataset.filtered === "true"); }
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
  function filterMusic(query) {
    const q = query.toLowerCase().trim();
    getAllCards().forEach(card => {
      const matches =
        !q ||
        card.dataset.title.includes(q) ||
        card.dataset.creator.includes(q);
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

      fadePlaceholder(searchInput, `${visibleCount} tracks on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search music...", () => setTimeout(cycle, 4000));
        }, 4000);
      });
    };
    cycle();
  }

  // --- Pagination controls ---
  window.prevPage = function () { currentPage--; renderPage(); };
  window.nextPage = function () { currentPage++; renderPage(); };

  if (searchInput) searchInput.addEventListener("input", e => filterMusic(e.target.value));
  if (searchBtn) searchBtn.addEventListener("click", () => filterMusic(searchInput.value));

  // --- Main: Load JSON (waits for load-fire.gif before fade) ---
  async function loadMusic() {
    showLoading("Loading music...");
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif"; // default loading

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      musicData = await res.json();

      container.innerHTML = "";
      createMusicCards(musicData);

      renderPage();
      startPlaceholderCycle();

      // Wait until all images are fully loaded
      const allImages = Array.from(container.querySelectorAll(".music-card img"));
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
      showLoading("⚠ Failed to load music data.");

      // Failure: switch to fail.gif, keep preloader visible
      if (loaderImage) loaderImage.src = "system/images/GIF/fail.gif";
    }
  }

  // --- Initialize ---
  loadMusic();
});
