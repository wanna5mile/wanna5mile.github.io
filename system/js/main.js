// ---- main.js ----
// Safely initializes app components after DOM is ready.

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- 1. Initialize core DOM + config ---
    if (typeof initElements === "function") initElements();
    else console.warn("⚠ initElements() missing");

    // --- 2. Initialize UI / state modules ---
    if (typeof initFavorites === "function") initFavorites();
    if (typeof initPreloader === "function") initPreloader();
    if (typeof initPaging === "function") initPaging();
    if (typeof initPlaceholders === "function") initPlaceholders();

    // --- 3. Load main assets ---
    if (typeof loadAssets === "function") {
      await loadAssets();
    } else {
      console.warn("⚠ loadAssets() missing");
    }

    console.log("✅ Main initialization complete");
  } catch (err) {
    console.error("❌ App initialization failed:", err);
    const preloader = document.getElementById("preloader");
    if (preloader) preloader.textContent = "⚠ Failed to initialize app.";
  }
});
