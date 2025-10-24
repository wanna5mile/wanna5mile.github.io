// ===== WannaSmile | Version Auto-Updater =====
// Syncs version info across footer and update popup.

(async function updateVersionUI() {
  const footerAnchor = document.getElementById("footerVersion");
  const popupTitle = document.querySelector("#updatePopup .update-popup-content h2");

  // ✅ Replace this with your live Google Apps Script endpoint
  const sheetAPI = "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";

  try {
    const response = await fetch(sheetAPI);
    if (!response.ok) throw new Error("Version fetch failed");

    const data = await response.json();
    const version = data?.version?.trim() || "Unknown";

    // 🦶 Update footer
    if (footerAnchor) footerAnchor.textContent = `Version ${version}`;

    // 🎉 Update popup title
    if (popupTitle) popupTitle.textContent = `🎉 Version ${version} Update!`;

  } catch (err) {
    console.warn("[Version.js] Version fetch failed:", err.message);

    // Fallback to known version
    if (footerAnchor) footerAnchor.textContent = "Version V0.8";
    if (popupTitle) popupTitle.textContent = "🎉 Version 0.8 Update!";
  }
})();
