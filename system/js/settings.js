/**
 * system/js/settings.js
 * Unified logic for handling Settings (Theme, Cloak, Panic, Password)
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
  requestAnimationFrame(() => (t.style.opacity = "1"));
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, timeout);
}

// ===============================
// GLOBAL INITIALIZATION
// ===============================
function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url && url.startsWith("http") ? url : (url ? `system/${url}` : "");
}

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
  root.style.setProperty("--custom-bg-image", bgimg ? `url(${bgimg})` : "none");
}

// Apply saved theme on page load
(function applyGlobalTheme() {
  const savedTheme = localStorage.getItem("selectedTheme") || "classic";
  document.body.setAttribute("theme", savedTheme);
  if (savedTheme === "custom") applyCustomVarsFromStorage();
})();

// Apply saved tab cloak
(function applyGlobalCloak() {
  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon = localStorage.getItem("cloakIcon");
  if (savedTitle) document.title = savedTitle;
  if (savedIcon) setFavicon(savedIcon);
})();

// Listen for cross-tab updates
window.addEventListener("storage", (e) => {
  if (e.key === "selectedTheme") {
    document.body.setAttribute("theme", e.newValue);
    if (e.newValue === "custom") applyCustomVarsFromStorage();
  }
  if (e.key && e.key.startsWith("customTheme")) applyCustomVarsFromStorage();
  if (e.key === "cloakTitle") document.title = e.newValue || document.title;
  if (e.key === "cloakIcon") if (e.newValue) setFavicon(e.newValue);
});

// ===============================
// SETTINGS PAGE LOGIC
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const settingsPage = document.querySelector(".settings-page");
  if (!settingsPage) return;

  // Cached DOM
  const webnameInput = document.getElementById("webname");
  const webiconInput = document.getElementById("webicon");
  const presetCloaksSelect = document.getElementById("presetCloaks");
  const customMenu = document.getElementById("customThemeMenu");
  const panicInput = document.getElementById("panicURL");
  const passInput = document.getElementById("pass");

  const uiBgInput = document.getElementById("uibg");
  const bgInput = document.getElementById("bg");
  const textColorInput = document.getElementById("textcolor");
  const accentInput = document.getElementById("accentcolor");
  const bgImgInput = document.getElementById("bgimg");

  // Initialize saved values
  webnameInput.value = localStorage.getItem("cloakTitle") || "";
  webiconInput.value = localStorage.getItem("cloakIcon") || "";
  panicInput.value = localStorage.getItem("panicURL") || "";

  if (uiBgInput) uiBgInput.value = localStorage.getItem("customTheme_uibg") || uiBgInput.value;
  if (bgInput) bgInput.value = localStorage.getItem("customTheme_bg") || bgInput.value;
  if (textColorInput) textColorInput.value = localStorage.getItem("customTheme_text") || textColorInput.value;
  if (accentInput) accentInput.value = localStorage.getItem("customTheme_accent") || accentInput.value;
  if (bgImgInput) bgImgInput.value = localStorage.getItem("customTheme_bgimg") || "";

  // -------------------------------
  // THEME FUNCTIONS
  // -------------------------------
  window.setTheme = function (name) {
    document.body.setAttribute("theme", name);
    localStorage.setItem("selectedTheme", name);
    if (name !== "custom" && customMenu) customMenu.style.display = "none";
    else if (name === "custom") applyCustomVarsFromStorage();
  };

  window.customTheme = function () {
    const isVisible = customMenu.style.display === "block";
    customMenu.style.display = isVisible ? "none" : "block";
    if (!isVisible) setTheme("custom");
  };

  window.applyCustomTheme = function () {
    if (uiBgInput) localStorage.setItem("customTheme_uibg", uiBgInput.value);
    if (bgInput) localStorage.setItem("customTheme_bg", bgInput.value);
    if (textColorInput) localStorage.setItem("customTheme_text", textColorInput.value);
    if (accentInput) localStorage.setItem("customTheme_accent", accentInput.value);
    applyCustomVarsFromStorage();
    setTheme("custom");
    showToast("Custom theme applied!");
  };

  window.applyBackgroundImage = function () {
    if (bgImgInput && bgImgInput.value.trim()) {
      localStorage.setItem("customTheme_bgimg", bgImgInput.value.trim());
      showToast("Background image applied!");
    } else localStorage.removeItem("customTheme_bgimg");
    applyCustomVarsFromStorage();
    setTheme("custom");
  };

  // -------------------------------
  // CLOAK FUNCTIONS
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
    localStorage.setItem("cloakTitle", webnameInput.value.trim());
    localStorage.setItem("cloakIcon", webiconInput.value.trim());
    document.title = webnameInput.value || document.title;
    setFavicon(webiconInput.value);
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
  // PANIC MODE
  // -------------------------------
  window.setPanicMode = function (e) {
    if (e) e.preventDefault();
    localStorage.setItem("panicURL", panicInput.value.trim());
    alert(`Panic Mode URL set to: ${panicInput.value.trim()}`);
  };

  // -------------------------------
  // PASSWORD
  // -------------------------------
  window.setPassword = function (e) {
    if (e) e.preventDefault();
    const pw = passInput.value.trim();
    if (!pw) return alert("Please enter a password.");
    localStorage.setItem("accessPassword", pw);
    alert("Access Password Set!");
  };

  window.delPassword = function () {
    localStorage.removeItem("accessPassword");
    passInput.value = "";
    alert("Access Password Deleted!");
  };
});

// ===============================
// GLOBAL PANIC ESCAPE
// ===============================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const panicURL = localStorage.getItem("panicURL");
    if (panicURL) window.location.href = panicURL;
  }
});
