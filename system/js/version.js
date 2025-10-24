// ===== WannaSmile | Version Auto-Updater =====
(async function updateVersionUI() {
  const footerAnchor = document.getElementById("footerVersion");
  const popupTitle = document.querySelector("#updatePopup .update-popup-content h2");

  // Google Apps Script JSON endpoint
  const sheetAPI = "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";

  try {
    const response = await fetch(sheetAPI);
    if (!response.ok) throw new Error("Version fetch failed");

    const data = await response.json();

    // Get the last non-empty version
    const lastRow = data.filter(d => d.version?.toString().trim()).slice(-1)[0];
    const version = lastRow?.version?.toString().trim() || "Unknown";

    // Update footer and popup
    if (footerAnchor) footerAnchor.textContent = `Version ${version}`;
    if (popupTitle) popupTitle.textContent = `🎉 Version ${version} Update!`;

  } catch (err) {
    console.warn("[Version.js] Version fetch failed:", err.message);

    // fallback
    if (footerAnchor) footerAnchor.textContent = "Version V0.8";
    if (popupTitle) popupTitle.textContent = "🎉 Version 0.8 Update!";
  }
})();
