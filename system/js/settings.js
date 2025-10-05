// --- Helper: set favicon ---
function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

// --- Apply cloak mode globally ---
(function applyCloak() {
  const cloakState = localStorage.getItem("cloakToggle");
  if (cloakState === "on") {
    document.title = "Google Docs";
    setFavicon("icons/docs.png");
  } else {
    document.title = "Bguhm.GuiHub.io";
    setFavicon("icons/default.png");
  }
})();

// --- Apply theme globally ---
(function applyTheme() {
  const themeState = localStorage.getItem("themeToggle");

  // Reset classes
  document.body.classList.remove("dark", "light");

  // Apply based on saved state
  if (themeState === "off") {
    document.body.classList.add("light");
  } else {
    document.body.classList.add("dark");
  }
})();

// --- Apply background globally ---
(function applyBackground() {
  const bgState = localStorage.getItem("bgToggle");
  const customBg = localStorage.getItem("bgUrl");

  document.body.style.backgroundImage = "none"; // reset first

  if (bgState === "on" && customBg) {
    document.body.style.backgroundImage = `url('${customBg}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
  } else if (bgState === "on") {
    document.body.style.backgroundImage = "url('images/bg1.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
  }
})();
