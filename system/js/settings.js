/**
 * system/js/settings.js
 * Handles all logic for applying settings (Theme, Cloak, Panic) 
 * both on the settings page and globally on page load.
 * * NOTE: This script assumes you have a unified theme system 
 * where themes are applied by setting the 'theme' attribute on the <body> tag.
 */

// --- I. GLOBAL APPLICATION FUNCTIONS (Run on ALL pages) ---

/**
 * Helper function to set the page's favicon.
 * @param {string} url - The URL of the new favicon.
 */
function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  // Adjust pathing relative to index.html's root for global application
  link.href = url.startsWith('http') ? url : `system/${url}`;
}

/**
 * Applies the saved theme to the <body> tag.
 */
(function applyGlobalTheme() {
  const savedTheme = localStorage.getItem("themeName") || "classic";
  document.body.setAttribute("theme", savedTheme);
})();

/**
 * Applies the saved tab cloak (title and icon).
 */
(function applyGlobalCloak() {
  const savedTitle = localStorage.getItem("cloakTitle");
  const savedIcon = localStorage.getItem("cloakIcon");

  if (savedTitle) {
    document.title = savedTitle;
  }
  if (savedIcon) {
    setFavicon(savedIcon);
  }
  // Note: If no cloak is saved, the default HTML <title> and <link rel="icon"> are used.
})();


// --- II. SETTINGS PAGE LOGIC (Run ONLY on settings.html) ---

document.addEventListener("DOMContentLoaded", () => {
  // If we are not on the settings page, stop here.
  if (!document.querySelector(".settings-page")) return;
  
  // Cache DOM elements
  const webnameInput = document.getElementById("webname");
  const webiconInput = document.getElementById("webicon");
  const presetCloaksSelect = document.getElementById("presetCloaks");
  const customMenu = document.getElementById("customThemeMenu");

  // --- A. INITIALIZE FORM VALUES ---

  // Initialize Cloak form
  webnameInput.value = localStorage.getItem("cloakTitle") || "";
  webiconInput.value = localStorage.getItem("cloakIcon") || "";

  // Initialize Panic Mode form
  document.getElementById("panicURL").value = localStorage.getItem("panicURL") || "";

  // --- B. THEME FUNCTIONS ---

  /**
   * Sets the theme attribute on the body and saves it to localStorage.
   * @param {string} name - The name of the theme (e.g., 'classic', 'dark').
   */
  window.setTheme = function(name) {
    document.body.setAttribute("theme", name);
    localStorage.setItem("themeName", name);
    console.log(`Theme set to: ${name}`);
    // Hide custom menu when selecting a preset theme
    if (name !== 'custom') {
        customMenu.style.display = 'none';
    }
  }

  /**
   * Toggles the visibility of the custom theme menu.
   */
  window.customTheme = function() {
    customMenu.style.display = customMenu.style.display === 'none' ? 'block' : 'none';
    if (customMenu.style.display === 'block') {
        // Set theme to custom if the menu is opened
        setTheme('custom');
    }
  }

  /**
   * Applies and saves the custom color variables entered by the user.
   */
  window.applyCustomTheme = function() {
      // Assuming you defined custom CSS variables for these in themes.css under [theme="custom"]
      const uibg = document.getElementById("uibg").value;
      const bg = document.getElementById("bg").value;
      const textcolor = document.getElementById("textcolor").value;
      const accentcolor = document.getElementById("accentcolor").value;

      const root = document.documentElement;

      root.style.setProperty('--custom-uibg', uibg);
      root.style.setProperty('--custom-bg', bg);
      root.style.setProperty('--custom-text-color', textcolor);
      root.style.setProperty('--custom-accent-color', accentcolor);

      // Save the custom values (optional, for persistence across restarts)
      localStorage.setItem("customTheme_uibg", uibg);
      localStorage.setItem("customTheme_bg", bg);
      localStorage.setItem("customTheme_text", textcolor);
      localStorage.setItem("customTheme_accent", accentcolor);
      
      setTheme('custom'); // Ensure the custom theme is active
      console.log("Custom colors applied and saved.");
  }
  
  /**
   * Applies and saves a custom background image URL.
   */
  window.applyBackgroundImage = function() {
      const bgImgUrl = document.getElementById("bgimg").value.trim();
      
      if (bgImgUrl) {
          document.documentElement.style.setProperty('--custom-bg-image', `url(${bgImgUrl})`);
          localStorage.setItem("customTheme_bgimg", bgImgUrl);
          setTheme('custom'); // Activate custom theme to use the image
          console.log(`Custom background image set to: ${bgImgUrl}`);
      } else {
          // Clear image if input is empty
          document.documentElement.style.setProperty('--custom-bg-image', 'none');
          localStorage.removeItem("customTheme_bgimg");
      }
  }

  // --- C. CLOAK FUNCTIONS ---
  
  const CLOAK_PRESETS = {
      'google': { title: 'Google', icon: 'icons/google.png' },
      'drive': { title: 'My Drive - Google Drive', icon: 'icons/drive.png' },
      'classroom': { title: 'Classes', icon: 'icons/classroom.png' },
      'newtab': { title: 'New Tab', icon: 'icons/newtab.png' },
      'docs': { title: 'Untitled document - Google Docs', icon: 'icons/docs.png' },
      'schoology': { title: 'Schoology', icon: 'icons/schoology.png' },
      // Add more presets as needed, ensuring 'icons/' paths exist
  };
  
  // Event listener for preset selection
  presetCloaksSelect.addEventListener("change", () => {
    const presetName = presetCloaksSelect.value;
    if (presetName && CLOAK_PRESETS[presetName]) {
      webnameInput.value = CLOAK_PRESETS[presetName].title;
      webiconInput.value = CLOAK_PRESETS[presetName].icon;
    }
  });

  /**
   * Sets and applies the custom tab cloak.
   */
  window.setCloakCookie = function(e) {
    if (e) e.preventDefault(); // Stop form submission
    
    const title = webnameInput.value.trim() || document.title;
    const icon = webiconInput.value.trim() || document.querySelector("link[rel~='icon']").href;
    
    localStorage.setItem("cloakTitle", title);
    localStorage.setItem("cloakIcon", icon);
    
    // Apply changes immediately
    document.title = title;
    setFavicon(icon);
    
    alert("Tab Cloak Set Successfully!");
  }

  /**
   * Clears the tab cloak and reverts to defaults.
   */
  window.clearCloak = function() {
    localStorage.removeItem("cloakTitle");
    localStorage.removeItem("cloakIcon");
    
    // Revert to initial defaults (defined in your HTML)
    document.title = "Settings | 10x76 Test 005"; // or whatever your default HTML title is
    setFavicon("images/10x76.png"); // or whatever your default HTML icon is
    
    // Clear form fields
    webnameInput.value = "";
    webiconInput.value = "";
    
    alert("Tab Cloak Cleared!");
  }
  
  // --- D. PANIC MODE & PASSWORD FUNCTIONS ---

  /**
   * Sets and saves the Panic Mode redirect URL.
   */
  window.setPanicMode = function(e) {
    if (e) e.preventDefault();
    const url = document.getElementById("panicURL").value.trim();
    localStorage.setItem("panicURL", url);
    alert(`Panic Mode URL set to: ${url}`);
  }

  /**
   * Sets and saves the password.
   */
  window.setPassword = function(e) {
    if (e) e.preventDefault();
    const password = document.getElementById("pass").value.trim();
    if (password) {
        // NOTE: Saving a password in plain text is insecure. You should hash this.
        localStorage.setItem("accessPassword", password);
        alert("Access Password Set!");
    } else {
        alert("Please enter a password.");
    }
  }

  /**
   * Deletes the access password.
   */
  window.delPassword = function() {
    localStorage.removeItem("accessPassword");
    document.getElementById("pass").value = "";
    alert("Access Password Deleted!");
  }
});

// NOTE: Add a panic-mode checker here if you have one.
// e.g., document.addEventListener("keydown", (e) => { if (e.key === "Escape") triggerPanic(); });
