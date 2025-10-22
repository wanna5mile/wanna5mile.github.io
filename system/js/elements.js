// ✅ elements.js — Safe element init, lazy retries, and defaults
function initElements() {
  const getEl = (idOrSel) =>
    document.getElementById(idOrSel) || document.querySelector(idOrSel);

  // Define DOM references globally
  window.dom = {
    container: getEl("container"),
    preloader: getEl("preloader"),
    loaderImage: getEl("loaderImage"),
    pageIndicator: getEl(".page-indicator"),
    searchInput: getEl("searchInputHeader"),
    searchBtn: getEl("searchBtnHeader"),
  };

  // Retry if DOM not ready
  if (!dom.container) {
    console.warn("⚠️ Elements not ready yet — retrying initElements...");
    setTimeout(initElements, 200);
    return;
  }

  // Define global config constants
  window.config = {
    fallbackImage:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
    fallbackLink: "https://wanna5mile.github.io/source/dino/",
    gifBase:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
    sheetUrl:
      "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec",
  };

  console.log("✅ Elements initialized:", dom);
}

// Auto-run after DOM is ready
document.addEventListener("DOMContentLoaded", initElements);
