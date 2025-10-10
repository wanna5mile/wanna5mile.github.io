document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const container = document.getElementById("container");
  const pageIndicator = document.querySelector(".page-indicator");
  const searchInput = document.getElementById("searchInputHeader");
  const searchBtn = document.getElementById("searchBtnHeader");
  const preloader = document.getElementById("preloader");
  const loaderImage = document.getElementById("loaderImage");

  // --- Config & State ---
  let albumsData = []; // Renamed from gamesData
  let currentPage = parseInt(sessionStorage.getItem("currentAlbumPage")) || 1; // Unique session key
  const albumsPerPage = 10;
  const jsonPath = "system/json/albums.json"; // Assumes a new JSON file for albums
  const favorites = new Set(JSON.parse(localStorage.getItem("favoriteAlbums") || "[]")); // Unique favorite key

  // --- Fallback paths ---
  // Updated to the requested 404 cover image
  const fallbackImage =
    "https://raw.githubusercontent.com/theworldpt1/theworldpt1.github.io/main/404/404_blank-cover.png";
  // The fallback link should point to a default music player or album
  const fallbackLink = "system/pages/music-player.html"; 

  // --- Utility Functions ---
  function showLoading(text) {
    if (container) {
      container.textContent = text;
      container.style.textAlign = "center";
    }
  }

  function saveFavorites() {
    localStorage.setItem("favoriteAlbums", JSON.stringify([...favorites]));
  }

  // --- Card Creation and Rendering ---
  function createAlbumCards(data) {
    if (!container) return;

    // Sort: Favorites first, then alphabetical (by album title)
    const sortedData = [...data].sort((a, b) => {
      const aFav = favorites.has(a.title);
      const bFav = favorites.has(b.title);
      return aFav === bFav ? 0 : aFav ? -1 : 1;
    });

    sortedData.forEach((album, i) => {
      const card = document.createElement("div");
      // Use the existing 'game-card' class for styling consistency, or 'album-card' if you define new CSS
      card.className = "game-card album-card"; 
      card.dataset.title = (album.title || "").toLowerCase();
      card.dataset.artist = (album.artist || "").toLowerCase(); // Used 'artist' instead of 'author'
      // Calculate page based on sorted index
      card.dataset.page = Math.floor(i / albumsPerPage) + 1; 
      card.dataset.filtered = "true";

      let imageSrc = album.cover?.trim() || ""; // Used 'cover' instead of 'image'
      let linkSrc = album.link?.trim() || ""; // Link to the specific music player for the album
      
      // Fallback logic for image/link
      if (imageSrc === "" || imageSrc.toLowerCase() === "blank") {
        imageSrc = fallbackImage;
      }
      if (linkSrc === "") linkSrc = fallbackLink;

      // Image element setup
      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = album.title || "Album Cover";
      img.loading = "lazy";
      img.addEventListener("error", () => {
        if (!img.dataset.fallbackApplied) {
          img.src = fallbackImage;
          img.dataset.fallbackApplied = "true";
        }
      });

      // Link wrapper
      const link = document.createElement("a");
      link.href = linkSrc;
      link.target = "_blank"; // Albums usually open in a new music player page
      link.rel = "noopener";
      
      // Content assembly
      link.appendChild(img);
      // Album title
      link.innerHTML += `<h3>${album.title || "Untitled Album"}</h3>`;

      // Artist name
      const artist = document.createElement("p");
      artist.textContent = album.artist || "Unknown Artist";

      // Favorite Star element (now for albums)
      const star = document.createElement("span");
      star.className = "favorite-star";
      star.textContent = favorites.has(album.title) ? "★" : "☆";
      star.title = "Toggle favorite album";

      // Favorite click handler
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (favorites.has(album.title)) {
          favorites.delete(album.title);
          star.textContent = "☆";
        } else {
          favorites.add(album.title);
          star.textContent = "★";
        }
        saveFavorites();
        refreshCards(); 
      });

      // Status handling (used 'unreleased' instead of 'soon')
      if (album.status?.toLowerCase() === "unreleased") {
        card.classList.add("soon");
        link.removeAttribute("href");
        link.style.pointerEvents = "none";
        link.style.cursor = "default";
      }

      // Final Card Assembly
      card.appendChild(link);
      card.appendChild(artist);
      card.appendChild(star);

      container.appendChild(card);
    });
  }

  // --- Filtering and Paging Logic ---
  function getAllCards() {
    return Array.from(container.querySelectorAll(".album-card"));
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

    if (currentPage < 1) currentPage = 1; 
    if (currentPage > maxPage) currentPage = maxPage;
    
    getAllCards().forEach((card) => {
      card.style.display =
        parseInt(card.dataset.page) === currentPage &&
        card.dataset.filtered === "true"
          ? "block"
          : "none";
    });

    if (pageIndicator)
      // Renamed "games" to "albums" here as requested
      pageIndicator.textContent = `Albums ${currentPage} of ${maxPage}`; 

    sessionStorage.setItem("currentAlbumPage", currentPage);
  }

  function filterAlbums(query) { // Renamed filterGames to filterAlbums
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const matches =
        !q ||
        card.dataset.title.includes(q) ||
        card.dataset.artist.includes(q); // Search by artist name
      card.dataset.filtered = matches ? "true" : "false";
    });

    const pagesWithContent = getPagesWithContent();
    if (!pagesWithContent.includes(currentPage)) {
      currentPage = pagesWithContent[0] || 1; 
    }

    renderPage();
  }

  function refreshCards() {
    container.innerHTML = "";
    createAlbumCards(albumsData);
    filterAlbums(searchInput.value); 
  }
  
  // --- Header/Search Interaction Logic ---
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
        (c) => parseInt(c.dataset.page) === currentPage
      ).length;

      fadePlaceholder(searchInput, `${visibleCount} albums on this page`, () => { // Updated text
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search albums...", () => // Updated text
            setTimeout(cycle, 4000)
          );
        }, 4000);
      });
    };
    cycle();
  }

  // --- Global Paging Functions (Needed by your HTML buttons) ---
  window.prevPage = function () {
    currentPage = Math.max(1, currentPage - 1); 
    renderPage();
  };
  window.nextPage = function () {
    const maxPage = Math.max(...getPagesWithContent(), 1);
    currentPage = Math.min(maxPage, currentPage + 1); 
    renderPage();
  };

  // --- Event Listeners ---
  if (searchInput)
    searchInput.addEventListener("input", (e) => filterAlbums(e.target.value)); // Changed to filterAlbums
  if (searchBtn)
    searchBtn.addEventListener("click", () => filterAlbums(searchInput.value)); // Changed to filterAlbums

  // --- Initialization ---
  async function loadAlbums() { // Renamed loadGames to loadAlbums
    showLoading("Loading album list..."); // Updated text
    if (loaderImage) loaderImage.src = "system/images/GIF/loading.gif";

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch JSON: ${res.status}`);
      albumsData = await res.json(); // Renamed gamesData to albumsData

      container.innerHTML = "";
      createAlbumCards(albumsData);
      renderPage();
      startPlaceholderCycle();

      // Preloader image load logic
      const allImages = Array.from(container.querySelectorAll(".album-card img"));
      await Promise.allSettled(
        allImages.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
            })
        )
      );

      await new Promise((r) => setTimeout(r, 800));

      if (loaderImage) {
        await new Promise((resolve) => {
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
      console.error("Error loading album JSON:", err);
      showLoading("⚠ Failed to load album data.");
      if (loaderImage) loaderImage.src = "system/images/GIF/fail.gif";
    }
  }

  loadAlbums();
});
