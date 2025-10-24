// ===== WannaSmile | Version Auto-Updater =====
// Dynamically updates footer version from Google Sheets API

(async function updateFooterVersion() {
  const footerAnchor = document.getElementById("footerVersion");
  if (!footerAnchor) return;

  // ✅ Your published Google Apps Script endpoint (replace this URL)
  const sheetAPI =
    "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";

  try {
    const response = await fetch(sheetAPI);
    if (!response.ok) throw new Error("Version fetch failed");

    const data = await response.json();
    const version = data?.version || "Unknown";

    footerAnchor.textContent = `Version ${version}`;
  } catch (err) {
    console.warn("[Version.js] Using fallback version due to:", err.message);
    footerAnchor.textContent = "Version V0.8";
  }
})();
