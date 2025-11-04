document.addEventListener("DOMContentLoaded", async () => {
  // 1. Configuration & Initialization
  // Replace this with the actual URL of your deployed Google Apps Script Web App
  const APPS_SCRIPT_API_URL = "https://script.google.com/macros/s/AKfycbyKCuTDoxk5MBATbZ5wIj4VTRI2v8uMsj2M68e0khzAKOHrdSjeye_u6-dqtFguVyRS/exec";
  
  // Initialize your DOM and config objects
  initElements(); // Assumes this function is available in your scope
  
  const { container, preloader, loaderImage } = window.dom;

  if (!container || !preloader) {
      console.error("DOM elements (container or preloader) not found.");
      return;
  }
  
  // Display loader while fetching
  preloader.style.display = 'block';

  try {
    // 2. Fetch Data from Google Apps Script Macro
    // Using { cache: "no-store" } ensures you always get the latest data.
    const res = await fetch(APPS_SCRIPT_API_URL, { cache: "no-store" }); 
    
    if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
    }
    
    // The macro should return an array of objects that matches your JSON structure
    const assetData = await res.json();
    
    // 3. Render Cards using your existing function
    // Assuming 'favorites' and 'refreshCards' are globally available or passed in your actual implementation
    
    // The assetData is the 'data' argument for createAssetCards
    const imagePromises = createAssetCards(assetData); 

    // 4. Handle Loading and Preloader (Wait for all critical images to load)
    await Promise.allSettled(imagePromises.map(p => p.promise));

  } catch (err) {
    console.error("Error fetching or rendering asset data:", err);
    // Display an error message to the user
    container.innerHTML = `<p style='color:red;'>Failed to load assets. Please try again later. (Error: ${err.message})</p>`;
  } finally {
    // 5. Hide the Preloader
    preloader.style.display = 'none';
    
    // You might call your initial card filtering/display logic here
    if (typeof refreshCards === 'function') {
        refreshCards();
    }
  }
});

// NOTE: Your existing function createAssetCards(data) must be defined in the global scope 
// or available where this new script is executed.
// NOTE: Your existing function initElements() must be defined to populate window.dom and window.config.
