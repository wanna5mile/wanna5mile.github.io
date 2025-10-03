document.addEventListener("DOMContentLoaded", () => {
  const totalPages = 10; // adjust if needed
  const pageIndicator = document.querySelector(".page-indicator");

  // Load saved page for this session, or default to 1
  let currentPage = parseInt(sessionStorage.getItem("currentPage")) || 1;

  function showPage(pageNum) {
    const allItems = document.querySelectorAll('[class*="page-"]');

    allItems.forEach(item => {
      if (item.classList.contains(`page-${pageNum}`)) {
        item.style.display = "block"; // visible
      } else {
        item.style.display = "none"; // hidden
      }
    });

    // Update span text
    pageIndicator.textContent = `Page ${pageNum}`;

    // Save page for this session only
    sessionStorage.setItem("currentPage", pageNum);
  }

  // Expose controls to HTML buttons
  window.nextPage = function () {
    currentPage = currentPage >= totalPages ? 1 : currentPage + 1;
    showPage(currentPage);
  };

  window.prevPage = function () {
    currentPage = currentPage <= 1 ? totalPages : currentPage - 1;
    showPage(currentPage);
  };

  // Show the stored (or first) page
  showPage(currentPage);
});
