/**
 * system/js/settings.js
 * Unified logic for handling Settings (Theme, Cloak, Panic, Password)
 */

// ============================================================
// TOAST (non-blocking small alert)
// ============================================================
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

// ============================================================
// GLOBAL HELPERS
// ============================================================
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

// ============================================================
// AUTO-APPLY THEME + CLOAK ON LOAD
// ============================================================
(async function applyGlobalThemeAndCloak() {
  const savedTheme = localStorage.getItem("selectedTheme") || "classic";

  if (savedTheme === "custom") {
    applyCustomVarsFromStorage();
  } else if (typeof applyTheme === "function") {
    await applyTheme(savedTheme);
  }

  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon = localStorage.getItem("cloakIcon");
  if (savedTitle) document.title = savedTitle;
  if (savedIcon) setFavicon(savedIcon);
})();

// Sync changes across tabs
window.addEventListener("storage", async (e) => {
  if (e.key === "selectedTheme") {
    if (e.newValue === "custom") {
      applyCustomVarsFromStorage();
    } else if (typeof applyTheme === "function") {
      await applyTheme(e.newValue);
    }
  }

  if (e.key && e.key.startsWith("customTheme")) {
    applyCustomVarsFromStorage();
  }

  if (e.key === "cloakTitle" && e.newValue) document.title = e.newValue;
  if (e.key === "cloakIcon" && e.newValue) setFavicon(e.newValue);
});

// ============================================================
// SETTINGS PAGE LOGIC
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const settingsPage = document.querySelector(".settings-page");
  if (!settingsPage) return;

  // --- Cached Elements ---
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

  // --- Initialize Saved Values ---
  if (webnameInput) webnameInput.value = localStorage.getItem("cloakTitle") || "";
  if (webiconInput) webiconInput.value = localStorage.getItem("cloakIcon") || "";
  if (panicInput) panicInput.value = localStorage.getItem("panicURL") || "";

  [uiBgInput, bgInput, textColorInput, accentInput, bgImgInput].forEach((input) => {
    if (!input) return;
    const key = `customTheme_${input.id === "textcolor" ? "text" : input.id}`;
    input.value = localStorage.getItem(key) || input.value;
  });

  // ============================================================
  // THEME CONTROLS
  // ============================================================
  window.setTheme = async function (name) {
    localStorage.setItem("selectedTheme", name);

    if (name === "custom") {
      applyCustomVarsFromStorage();
    } else if (typeof applyTheme === "function") {
      await applyTheme(name);
      if (customMenu) customMenu.style.display = "none";
    }

    showToast(`Theme set to "${name}"`);
  };

  window.customTheme = function () {
    const isVisible = customMenu?.style.display === "block";
    if (customMenu) customMenu.style.display = isVisible ? "none" : "block";
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
    } else {
      localStorage.removeItem("customTheme_bgimg");
      showToast("Background image cleared!");
    }
    applyCustomVarsFromStorage();
    setTheme("custom");
  };

  // ============================================================
  // CLOAK CONTROLS
  // ============================================================
  const CLOAK_PRESETS = {
    google: { title: "Google", icon: "icons/google.png" },
    drive: { title: "My Drive - Google Drive", icon: "icons/drive.png" },
    classroom: { title: "Classes", icon: "icons/classroom.png" },
    newtab: { title: "New Tab", icon: "icons/newtab.png" },
    docs: { title: "Untitled document - Google Docs", icon: "icons/docs.png" },
    schoology: { title: "Schoology", icon: "icons/schoology.png" },
  };

  presetCloaksSelect?.addEventListener("change", () => {
    const preset = CLOAK_PRESETS[presetCloaksSelect.value];
    if (preset) {
      if (webnameInput) webnameInput.value = preset.title;
      if (webiconInput) webiconInput.value = preset.icon;
    }
  });

  window.setCloakCookie = function (e) {
    e?.preventDefault();
    if (webnameInput) localStorage.setItem("cloakTitle", webnameInput.value.trim());
    if (webiconInput) localStorage.setItem("cloakIcon", webiconInput.value.trim());
    if (webnameInput?.value) document.title = webnameInput.value;
    if (webiconInput?.value) setFavicon(webiconInput.value);
    showToast("Tab cloak set!");
  };

  window.clearCloak = function () {
    localStorage.removeItem("cloakTitle");
    localStorage.removeItem("cloakIcon");
    document.title = "Settings | 10x76 Test 005";
    setFavicon("images/10x76.png");
    if (webnameInput) webnameInput.value = "";
    if (webiconInput) webiconInput.value = "";
    showToast("Cloak cleared!");
  };

  // ============================================================
  // PANIC & PASSWORD
  // ============================================================
  window.setPanicMode = function (e) {
    e?.preventDefault();
    if (panicInput && panicInput.value.trim()) {
      localStorage.setItem("panicURL", panicInput.value.trim());
      showToast("Panic URL saved!");
    }
  };

  window.setPassword = function (e) {
    e?.preventDefault();
    const pw = passInput?.value.trim();
    if (!pw) return showToast("Enter a password first.");
    localStorage.setItem("accessPassword", pw);
    showToast("Access password set!");
  };

  window.delPassword = function () {
    localStorage.removeItem("accessPassword");
    if (passInput) passInput.value = "";
    showToast("Password cleared!");
  };
});

// ============================================================
// SORT MODE TOGGLE (Sheet Order / Alphabetical)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const sheetOrderBtn = document.getElementById("sheetOrderBtn");
  const alphabeticalBtn = document.getElementById("alphabeticalBtn");

  if (!sheetOrderBtn || !alphabeticalBtn) return;

  const savedMode = localStorage.getItem("sortMode") || "sheet";
  updateSortModeButtons(savedMode);

  sheetOrderBtn.addEventListener("click", () => {
    setSortMode("sheet");
  });

  alphabeticalBtn.addEventListener("click", () => {
    setSortMode("alphabetical");
  });

  function setSortMode(mode) {
    localStorage.setItem("sortMode", mode);
    updateSortModeButtons(mode);
    showToast(`Sort mode set to: ${mode === "sheet" ? "Sheet Order" : "Alphabetical"}`);
    document.dispatchEvent(new CustomEvent("sortModeChanged", { detail: mode }));
  }

  function updateSortModeButtons(mode) {
    sheetOrderBtn.classList.toggle("active", mode === "sheet");
    alphabeticalBtn.classList.toggle("active", mode === "alphabetical");
  }
});

// ============================================================
// GLOBAL PANIC ESCAPE (Esc key)
// ============================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const panicURL = localStorage.getItem("panicURL");
    if (panicURL) window.location.href = panicURL;
  }
});
