/**
 * system/js/settings.js
 * Unified logic for handling Settings (Theme, Cloak, Panic, Password)
 * Works globally across all pages, and adds specific interactivity on settings.html.
 */

// ===============================
// Helper: Toast (non-blocking small alert)
// ===============================
function showToast(message, timeout = 2200) {
  const t = document.createElement("div");
  t.textContent = message;
  Object.assign(t.style, {
    position: "fixed",
    bottom: "28px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.8)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontFamily: "monospace",
    zIndex: 99999,
    opacity: "0",
    transition: "opacity 220ms ease",
    pointerEvents: "none",
  });
  document.body.appendChild(t);
  // allow styles to flush
  requestAnimationFrame(() => (t.style.opacity = "1"));
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, timeout);
}

// ===============================
// I. GLOBAL INITIALIZATION
// ===============================
function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  // preserve absolute URLs; allow relative paths too
  link.href = url && url.startsWith("http") ? url : (url ? `system/${url}` : "");
}

/**
 * Apply custom theme variables from localStorage to :root
 */
function applyCustomVarsFromStorage() {
  const root = document.documentElement;
  const uibg = localStorage.getItem("customTheme_uibg");
  const bg = localStorage.getItem("customTheme_bg");
  const text = localStorage.getItem("customTheme_text");
  const accent = localStorage.getItem("customTheme_accent");
  const bgimg = localStorage.getItem("customTheme_bgimg");

  if (uibg) root.style.setProperty("--custom-uibg", uibg);
  if (bg) root.style.setProperty("--custom-bg", bg);
  if (text) root.style.setProperty("--custom-text-color", text);
  if (accent) root.style.setProperty("--custom-accent-color", accent);
  if (bgimg) root.style.setProperty("--custom-bg-image", `url(${bgimg})`);
  if (!bgimg) root.style.setProperty("--custom-bg-image", "none");
}

/**
 * Applies saved theme across the entire site on initial load.
 */
(function applyGlobalTheme() {
  const savedTheme = localStorage.getItem("selectedTheme") || "classic";
  document.body.setAttribute("theme", savedTheme);

  if (savedTheme === "custom") {
    applyCustomVarsFromStorage();
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
 * Listens for cross-tab theme updates and custom variable updates.
 */
window.addEventListener("storage", (e) => {
  if (e.key === "selectedTheme") {
    document.body.setAttribute("theme", e.newValue);
    if (e.newValue === "custom") applyCustomVarsFromStorage();
  }

  // if any customTheme key changes, re-apply vars so other tabs update live
  if (e.key && e.key.startsWith("customTheme")) {
    applyCustomVarsFromStorage();
    // if the theme isn't currently set to custom in this tab, make sure variables are applied anyway
    if (localStorage.getItem("selectedTheme") === "custom") {
      document.body.setAttribute("theme", "custom");
    }
  }

  // cloak updates
  if (e.key === "cloakTitle") {
    document.title = e.newValue || document.title;
  }
  if (e.key === "cloakIcon") {
    if (e.newValue) setFavicon(e.newValue);
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

  // Inputs for custom colors
  const uiBgInput = document.getElementById("uibg");
  const bgInput = document.getElementById("bg");
  const textColorInput = document.getElementById("textcolor");
  const accentInput = document.getElementById("accentcolor");
  const bgImgInput = document.getElementById("bgimg");

  // -------------------------------
  // A. Initialize Settings Form with saved values
  // -------------------------------
  webnameInput.value = localStorage.getItem("cloakTitle") || "";
  webiconInput.value = localStorage.getItem("cloakIcon") || "";
  panicInput.value = localStorage.getItem("panicURL") || "";

  // Populate custom theme inputs from storage so they reflect current saved theme
  if (uiBgInput) uiBgInput.value = localStorage.getItem("customTheme_uibg") || uiBgInput.value;
  if (bgInput) bgInput.value = localStorage.getItem("customTheme_bg") || bgInput.value;
  if (textColorInput) textColorInput.value = localStorage.getItem("customTheme_text") || textColorInput.value;
  if (accentInput) accentInput.value = localStorage.getItem("customTheme_accent") || accentInput.value;
  if (bgImgInput) bgImgInput.value = localStorage.getItem("customTheme_bgimg") || "";

  // -------------------------------
  // B. THEME FUNCTIONS
  // -------------------------------
  window.setTheme = function (name) {
    document.body.setAttribute("theme", name);
    localStorage.setItem("selectedTheme", name);
    console.log(`Theme set to: ${name}`);
    if (name !== "custom") {
      if (customMenu) customMenu.style.display = "none";
    } else {
      // ensure custom vars are applied when switching to custom
      applyCustomVarsFromStorage();
    }
  };

  window.customTheme = function () {
    const isVisible = customMenu.style.display === "block";
    customMenu.style.display = isVisible ? "none" : "block";
    if (!isVisible) setTheme("custom");
  };

  window.applyCustomTheme = function () {
    const uibg = uiBgInput ? uiBgInput.value : null;
    const bg = bgInput ? bgInput.value : null;
    const textcolor = textColorInput ? textColorInput.value : null;
    const accentcolor = accentInput ? accentInput.value : null;

    const root = document.documentElement;
    if (uibg) {
      root.style.setProperty("--custom-uibg", uibg);
      localStorage.setItem("customTheme_uibg", uibg);
    }
    if (bg) {
      root.style.setProperty("--custom-bg", bg);
      localStorage.setItem("customTheme_bg", bg);
    }
    if (textcolor) {
      root.style.setProperty("--custom-text-color", textcolor);
      localStorage.setItem("customTheme_text", textcolor);
    }
    if (accentcolor) {
      root.style.setProperty("--custom-accent-color", accentcolor);
      localStorage.setItem("customTheme_accent", accentcolor);
    }

    // Ensure the theme is flagged as 'custom' globally
    setTheme("custom");

    // Show non-blocking confirmation
    showToast("Custom theme applied!");
    console.log("Custom theme applied and saved.");
  };

  window.applyBackgroundImage = function () {
    const bgImgUrl = bgImgInput ? bgImgInput.value.trim() : "";
    const root = document.documentElement;

    if (bgImgUrl) {
      root.style.setProperty("--custom-bg-image", `url(${bgImgUrl})`);
      localStorage.setItem("customTheme_bgimg", bgImgUrl);
      setTheme("custom");
      showToast("Background image applied!");
      console.log(`Custom background image set: ${bgImgUrl}`);
    } else {
      root.style.setProperty("--custom-bg-image", "none");
      localStorage.removeItem("customTheme_bgimg");
      showToast("Background image removed.");
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

  if (presetCloaksSelect) {
    presetCloaksSelect.addEventListener("change", () => {
      const preset = CLOAK_PRESETS[presetCloaksSelect.value];
      if (preset) {
        webnameInput.value = preset.title;
        webiconInput.value = preset.icon;
      }
    });
  }

  window.setCloakCookie = function (e) {
    if (e) e.preventDefault();
    const title = webnameInput.value.trim() || document.title;
    const icon = webiconInput.value.trim() || (document.querySelector("link[rel~='icon']") || {}).href || "";

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
