document.addEventListener("DOMContentLoaded", async () => {
  // 1. Configuration & Initialization
  // ✅ Updated Google Apps Script Web App URL
  const APPS_SCRIPT_API_URL = "https://script.google.com/macros/s/AKfycbxe5TvS8wEmGOd8kwCV0du4rHL8ydOkDJDd5NRXe1MNmy3sINRinivNP3X8Ss98dZ44JA/exec";
  
  // Initialize DOM elements
  initElements(); // Ensure this defines window.dom and window.config
  
  const { container, preloader, loaderImage } = window.dom;

  if (!container || !preloader) {
    console.error("DOM elements (container or preloader) not found.");
    return;
  }

  // Show preloader while fetching data
  preloader.style.display = "block";

  try {
    // 2. Fetch Data from Google Apps Script
    const res = await fetch(APPS_SCRIPT_API_URL, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    // 3. Parse JSON response
    const assetData = await res.json();

    // If your Apps Script ever returns { success: false, error: ... }, handle that too
    if (assetData.success === false) {
      throw new Error(assetData.error || "Server returned an error response.");
    }

    // Ensure data is always an array
    const dataArray = Array.isArray(assetData) ? assetData : assetData.data || [];

    // 4. Render Cards
    const imagePromises = createAssetCards(dataArray);

    // Wait for all important images to finish loading
    await Promise.allSettled(imagePromises.map(p => p.promise));

  } catch (err) {
    console.error("Error fetching or rendering asset data:", err);
    container.innerHTML = `<p style='color:red;'>Failed to load assets. Please try again later.<br>(Error: ${err.message})</p>`;
  } finally {
    // 5. Hide Preloader
    preloader.style.display = "none";
    
    // Optionally refresh card filters/display
    if (typeof refreshCards === "function") {
      refreshCards();
    }
  }
});
