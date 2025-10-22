// ✅ elements.js — safe init, lazy retries, and defaults
function initElements() {
  // Helper to safely get elements, retrying if DOM not ready yet
  const getEl = (idOrSel) =>
    document.getElementById(idOrSel) || document.querySelector(idOrSel);

  // Define dom references globally for easy access
  window.dom = {
    container: getEl("container"),
    pageIndicator: getEl(".page-indicator"),
    searchInput: getEl("searchInputHeader"),
    searchBtn: getEl("searchBtnHeader"),
    preloader: getEl("preloader"),
    loaderImage: getEl("loaderImage"),
  };

  // If critical elements aren’t loaded yet, retry shortly
  if (!dom.container) {
    console.warn("⚠️ Elements not ready yet — retrying initElements...");
    setTimeout(initElements, 200);
    return;
  }

  // Define configuration constants globally
  window.config = {
    jsonPath: "system/json/assets.json",
    fallbackImage:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
    fallbackLink: "https://wanna5mile.github.io/source/dino/",
    gifBase:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
  };

  console.log("✅ Elements initialized:", dom);
}

// Auto-run once DOM is ready
document.addEventListener("DOMContentLoaded", initElements);
