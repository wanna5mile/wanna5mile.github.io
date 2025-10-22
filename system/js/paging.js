// paging.js — auto-refresh + resilient pagination
function initPaging() {
  const { container, pageIndicator, searchInput, searchBtn } = dom;

  // --- Safe helpers ---
  window.getAllCards = () => Array.from(container.querySelectorAll(".asset-card"));
  window.getFilteredCards = () =>
    getAllCards().filter((c) => c.dataset.filtered === "true");
  window.getPages = () =>
    [...new Set(getFilteredCards().map((c) => parseInt(c.dataset.page)))]
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

  // --- Core render ---
  window.renderPage = () => {
    const pages = getPages();
    const maxPage = Math.max(...pages, 1);
    if (!pages.includes(window.currentPage)) {
      window.currentPage = pages[0] || 1;
    }

    getAllCards().forEach((card) => {
      const shouldShow =
        parseInt(card.dataset.page) === window.currentPage &&
        card.dataset.filtered === "true";
      card.style.display = shouldShow ? "block" : "none";
    });

    if (pageIndicator) {
      pageIndicator.textContent = `Page ${window.currentPage} of ${maxPage}`;
    }

    sessionStorage.setItem("currentPage", window.currentPage);
  };

  // --- Filtering / Search ---
  window.filterAssets = (query) => {
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const match =
        !q ||
        card.dataset.title.includes(q) ||
        card.dataset.author.includes(q);
      card.dataset.filtered = match ? "true" : "false";
    });
    renderPage();
  };

  // --- Paging navigation ---
  window.prevPage = () => {
    const pages = getPages();
    if (!pages.length) return;
    const idx = pages.indexOf(window.currentPage);
    window.currentPage = idx === 0 ? pages.at(-1) : pages[idx - 1];
    renderPage();
  };

  window.nextPage = () => {
    const pages = getPages();
    if (!pages.length) return;
    const idx = pages.indexOf(window.currentPage);
    window.currentPage = idx === pages.length - 1 ? pages[0] : pages[idx + 1];
    renderPage();
  };

  // --- Search bindings ---
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput.addEventListener("input", () => filterAssets(searchInput.value));
  }

  // --- Restore last page ---
  window.currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  // --- Re-render whenever assets load dynamically ---
  const observer = new MutationObserver(() => {
    // Wait a tick to ensure DOM is stable
    clearTimeout(window._pagingDebounce);
    window._pagingDebounce = setTimeout(() => {
      renderPage();
    }, 150);
  });

  observer.observe(container, { childList: true, subtree: false });

  // Initial render once ready
  renderPage();
}

// Auto-init when DOM + container ready
document.addEventListener("DOMContentLoaded", () => {
  const waitForDom = setInterval(() => {
    if (window.dom?.container) {
      clearInterval(waitForDom);
      initPaging();
    }
  }, 100);
});
