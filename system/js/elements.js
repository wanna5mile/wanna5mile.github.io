function initElements() {
  window.dom = {
    container: document.getElementById("container"),
    pageIndicator: document.querySelector(".page-indicator"),
    searchInput: document.getElementById("searchInputHeader"),
    searchBtn: document.getElementById("searchBtnHeader"),
    preloader: document.getElementById("preloader"),
    loaderImage: document.getElementById("loaderImage"),
  };

  window.config = {
    jsonPath: "system/json/assets.json",
    fallbackImage:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
    fallbackLink: "https://wanna5mile.github.io./source/dino/",
    gifBase:
      "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
  };
}