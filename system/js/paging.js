function initPaging() {
  const { container, pageIndicator, searchInput, searchBtn } = dom;
  window.getAllCards = () => Array.from(container.querySelectorAll(".asset-card"));
  window.getFilteredCards = () => getAllCards().filter((c) => c.dataset.filtered === "true");
  window.getPages = () =>
    [...new Set(getFilteredCards().map((c) => parseInt(c.dataset.page)))].sort((a, b) => a - b);
  window.renderPage = () => {
    const pages = getPages();
    const maxPage = Math.max(...pages, 1);
    if (!pages.includes(window.currentPage)) window.currentPage = pages[0] || 1;
    getAllCards().forEach((card) => {
      card.style.display =
        parseInt(card.dataset.page) === window.currentPage && card.dataset.filtered === "true"
          ? "block"
          : "none";
    });
    if (pageIndicator) pageIndicator.textContent = `Page ${window.currentPage} of ${maxPage}`;
    sessionStorage.setItem("currentPage", window.currentPage);
  };
  window.filterAssets = (query) => {
    const q = query.toLowerCase().trim();
    getAllCards().forEach((card) => {
      const match = !q || card.dataset.title.includes(q) || card.dataset.author.includes(q);
      card.dataset.filtered = match ? "true" : "false";
    });
    renderPage();
  };
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", () => filterAssets(searchInput.value));
    searchInput.addEventListener("input", () => filterAssets(searchInput.value));
  }
  window.currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;
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
}