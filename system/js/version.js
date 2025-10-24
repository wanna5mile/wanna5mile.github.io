// ===== WannaSmile | Version Auto-Updater =====
// Fetches N2 from the Google Sheet and updates footer + popup

(async function updateVersionUI() {
  const footerAnchor = document.getElementById("footerVersion");
  const popupTitle = document.querySelector("#updatePopup .update-popup-content h2");

  // Your live Google Apps Script endpoint
  const sheetAPI = "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";

  try {
    const response = await fetch(sheetAPI);
    if (!response.ok) throw new Error("Version fetch failed");

    const data = await response.json();

    // Assuming the sheet is returned as an array of rows
    // Each row is an object with keys matching your headers: title, author, ..., version
    // N2 = second row, "version" column
    const version = data[1]?.version?.trim() || "Unknown";

    if (footerAnchor) footerAnchor.textContent = `Version ${version}`;
    if (popupTitle) popupTitle.textContent = `🎉 Version ${version} Update!`;

  } catch (err) {
    console.warn("[Version.js] Version fetch failed:", err.message);
    if (footerAnchor) footerAnchor.textContent = "Version V0.8";
    if (popupTitle) popupTitle.textContent = "🎉 Version 0.8 Update!";
  }
})();
