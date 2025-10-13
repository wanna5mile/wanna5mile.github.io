/**
 * system/js/settings.js
 * Unified logic for handling Settings (Theme, Cloak, Panic, Password)
 * Works globally across all pages, and adds specific interactivity on settings.html.
 */

// ===============================
// I. GLOBAL INITIALIZATION
// ===============================

/**
 * Safely updates the page favicon.
 * @param {string} url - Path or full URL to the favicon.
 */
function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url.startsWith("http") ? url : `system/${url}`;
}

/**
 * Applies saved theme across the entire site.
 */
(function applyGlobalTheme() {
  const savedTheme = localStorage.getItem("selectedTheme") || "classic";
  document.body.setAttribute("theme", savedTheme);

  // Apply custom colors if theme is 'custom'
  if (savedTheme === "custom") {
    const root = document.documentElement;
    root.style.setProperty("--custom-uibg", localStorage.getItem("customTheme_uibg") || "#222");
    root.style.setProperty("--custom-bg", localStorage.getItem("customTheme_bg") || "#111");
    root.style.setProperty("--custom-text-color", localStorage.getItem("customTheme_text") || "#fff");
    root.style.setProperty("--custom-accent-color", localStorage.getItem("customTheme_accent") || "#f0f");
    root.style.setProperty(
      "--custom-bg-image",
      localStorage.getItem("customTheme_bgimg")
        ? `url(${localStorage.getItem("customTheme_bgimg")})`
        : "none"
    );
  }
})();

/**
 * Applies saved tab cloak (title + icon) globally.
 */
(function applyGlobalCloak() {
  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon = localStorage.getItem("cloakIcon");

  if (savedTitle) document.title = savedTitle;
  if (savedIcon) setFavicon(savedIcon);
})();

/**
 * Listens for cross-tab theme updates.
 */
window.addEventListener("storage", (e) => {
  if (e.key === "selectedTheme") {
    document.body.setAttribute("theme", e.newValue);
  }
});

// ===============================
// II. SETTINGS PAGE LOGIC
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".settings-page")) return;

  // Cached DOM elements
  const webnameInput = document.getElementById("webname");
  const webiconInput = document.getElementById("webicon");
  const presetCloaksSelect = document.getElementById("presetCloaks");
  const customMenu = document.getElementById("customThemeMenu");
  const panicInput = document.getElementById("panicURL");
  const passInput = document.getElementById("pass");

  // -------------------------------
  // A. Initialize Settings Form
  // -------------------------------
  webnameInput.value = localStorage.getItem("cloakTitle") || "";
  webiconInput.value = localStorage.getItem("cloakIcon") || "";
  panicInput.value = localStorage.getItem("panicURL") || "";

  // -------------------------------
  // B. THEME FUNCTIONS
  // -------------------------------

  /**
   * Applies and saves a theme by name.
   * @param {string} name - Theme name (e.g., 'classic', 'dark', 'custom')
   */
  window.setTheme = function (name) {
    document.body.setAttribute("theme", name);
    localStorage.setItem("selectedTheme", name);
    console.log(`Theme set to: ${name}`);
    if (name !== "custom") customMenu.style.display = "none";
  };

  /**
   * Toggles visibility of the custom theme UI.
   */
  window.customTheme = function () {
    const isVisible = customMenu.style.display === "block";
    customMenu.style.display = isVisible ? "none" : "block";
    if (!isVisible) setTheme("custom");
  };

  /**
   * Applies and saves custom theme colors.
   */
  window.applyCustomTheme = function () {
    const uibg = document.getElementById("uibg").value;
    const bg = document.getElementById("bg").value;
    const textcolor = document.getElementById("textcolor").value;
    const accentcolor = document.getElementById("accentcolor").value;

    const root = document.documentElement;
    root.style.setProperty("--custom-uibg", uibg);
    root.style.setProperty("--custom-bg", bg);
    root.style.setProperty("--custom-text-color", textcolor);
    root.style.setProperty("--custom-accent-color", accentcolor);

    localStorage.setItem("customTheme_uibg", uibg);
    localStorage.setItem("customTheme_bg", bg);
    localStorage.setItem("customTheme_text", textcolor);
    localStorage.setItem("customTheme_accent", accentcolor);

    setTheme("custom");
    console.log("Custom theme applied and saved.");
  };

  /**
   * Applies and saves a custom background image.
   */
  window.applyBackgroundImage = function () {
    const bgImgUrl = document.getElementById("bgimg").value.trim();
    const root = document.documentElement;

    if (bgImgUrl) {
      root.style.setProperty("--custom-bg-image", `url(${bgImgUrl})`);
      localStorage.setItem("customTheme_bgimg", bgImgUrl);
      setTheme("custom");
      console.log(`Custom background image set: ${bgImgUrl}`);
    } else {
      root.style.setProperty("--custom-bg-image", "none");
      localStorage.removeItem("customTheme_bgimg");
    }
  };

  // -------------------------------
  // C. CLOAK FUNCTIONS
  // -------------------------------

  const CLOAK_PRESETS = {
    google: { title: "Google", icon: "icons/google.png" },
    drive: { title: "My Drive - Google Drive", icon: "icons/drive.png" },
    classroom: { title: "Classes", icon: "icons/classroom.png" },
    newtab: { title: "New Tab", icon: "icons/newtab.png" },
    docs: { title: "Untitled document - Google Docs", icon: "icons/docs.png" },
    schoology: { title: "Schoology", icon: "icons/schoology.png" },
  };

  presetCloaksSelect.addEventListener("change", () => {
    const preset = CLOAK_PRESETS[presetCloaksSelect.value];
    if (preset) {
      webnameInput.value = preset.title;
      webiconInput.value = preset.icon;
    }
  });

  window.setCloakCookie = function (e) {
    if (e) e.preventDefault();
    const title = webnameInput.value.trim() || document.title;
    const icon = webiconInput.value.trim() || document.querySelector("link[rel~='icon']").href;

    localStorage.setItem("cloakTitle", title);
    localStorage.setItem("cloakIcon", icon);

    document.title = title;
    setFavicon(icon);
    alert("Tab Cloak Set Successfully!");
  };

  window.clearCloak = function () {
    localStorage.removeItem("cloakTitle");
    localStorage.removeItem("cloakIcon");
    document.title = "Settings | 10x76 Test 005";
    setFavicon("images/10x76.png");
    webnameInput.value = "";
    webiconInput.value = "";
    alert("Tab Cloak Cleared!");
  };

  // -------------------------------
  // D. PANIC MODE
  // -------------------------------
  window.setPanicMode = function (e) {
    if (e) e.preventDefault();
    const url = panicInput.value.trim();
    localStorage.setItem("panicURL", url);
    alert(`Panic Mode URL set to: ${url}`);
  };

  // -------------------------------
  // E. PASSWORD FUNCTIONS
  // -------------------------------
  window.setPassword = function (e) {
    if (e) e.preventDefault();
    const password = passInput.value.trim();
    if (!password) return alert("Please enter a password.");
    localStorage.setItem("accessPassword", password);
    alert("Access Password Set!");
  };

  window.delPassword = function () {
    localStorage.removeItem("accessPassword");
    passInput.value = "";
    alert("Access Password Deleted!");
  };
});

// ===============================
// III. OPTIONAL: GLOBAL PANIC SHORTCUT
// ===============================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const panicURL = localStorage.getItem("panicURL");
    if (panicURL) window.location.href = panicURL;
  }
});
