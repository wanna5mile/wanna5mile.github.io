document.addEventListener("DOMContentLoaded", async () => {
  // === 1. Configuration ===
  const APPS_SCRIPT_API_URL = "https://script.google.com/macros/s/AKfycbxwN_9QpFrhGPyeJCsM2ubsDXHtLzuesQFE6CFRV2yXThOzEjx6tINeSeBlf8N5j-zbcA/exec";

  // === 2. Initialize DOM ===
  initElements(); // must define window.dom (container, preloader, etc.)
  const { container, preloader } = window.dom;

  if (!container || !preloader) {
    console.error("❌ Missing container or preloader in DOM initialization.");
    return;
  }

  // Show loader while fetching
  preloader.style.display = "block";

  try {
    // === 3. Fetch Data from Google Sheets via Apps Script ===
    const res = await fetch(APPS_SCRIPT_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const assetData = await res.json();

    // === 4. Render Asset Cards ===
    const imagePromises = createAssetCards(assetData);

    // === 5. Wait for all images and overlays to finish loading ===
    await Promise.allSettled(imagePromises.map(p => p.promise));

  } catch (err) {
    console.error("Error fetching or rendering asset data:", err);
    container.innerHTML = `<p style='color:red;'>⚠️ Failed to load assets. Please try again later.<br>${err.message}</p>`;
  } finally {
    // === 6. Hide Preloader ===
    preloader.style.display = "none";

    // Optionally re-run your filters/favorites logic
    if (typeof refreshCards === "function") refreshCards();
  }
});


// === 7. Your Original Card Builder Function (Unchanged) ===
function createAssetCards(data) {
  const { container } = dom;
  if (!container) return Promise.resolve();

  container.innerHTML = "";
  const imagePromises = [];

  const sorted = [...data].sort((a, b) => {
    const aFav = favorites.has(a.title);
    const bFav = favorites.has(b.title);
    if (aFav !== bFav) return bFav - aFav;
    return (a.page || 1) - (b.page || 1);
  });

  for (const asset of sorted) {
    const card = document.createElement("div");
    card.className = "asset-card";
    card.dataset.title = (asset.title || "").toLowerCase();
    card.dataset.author = (asset.author || "").toLowerCase();
    card.dataset.page = asset.page ? parseInt(asset.page) : 1;
    card.dataset.filtered = "true";

    let imageSrc = asset.image?.trim() || "";
    if (!imageSrc || imageSrc === "blank" || asset.status?.toLowerCase() === "blank")
      imageSrc = config.fallbackImage;

    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = asset.title || "Asset";
    img.loading = "eager";
    img.addEventListener("error", () => {
      if (!img.dataset.fallbackApplied) {
        img.src = config.fallbackImage;
        img.dataset.fallbackApplied = "true";
      }
    });

    const imgPromise = new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
    imagePromises.push({ promise: imgPromise, page: card.dataset.page });

    const link = document.createElement("a");
    link.href = asset.link?.trim() || config.fallbackLink;
    link.target = "_blank";
    link.rel = "noopener";
    link.appendChild(img);
    link.innerHTML += `<h3>${asset.title || "Untitled"}</h3>`;

    const author = document.createElement("p");
    author.textContent = asset.author || " ";

    const star = document.createElement("span");
    star.className = "favorite-star";
    star.textContent = favorites.has(asset.title) ? "★" : "☆";
    star.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (favorites.has(asset.title)) favorites.delete(asset.title);
      else favorites.add(asset.title);
      saveFavorites();
      refreshCards();
    });

    const status = asset.status?.toLowerCase();
    if (status === "soon") {
      card.classList.add("soon");
      link.removeAttribute("href");
      link.style.pointerEvents = "none";
    } else if (status === "featured" || status === "fixed") {
      const overlay = document.createElement("img");
      overlay.className = `status-overlay ${status}`;
      overlay.src = `system/images/${status}.png`;
      overlay.alt = status;
      overlay.loading = "eager";
      card.appendChild(overlay);

      const overlayPromise = new Promise((resolve) => {
        overlay.addEventListener("load", resolve, { once: true });
        overlay.addEventListener("error", resolve, { once: true });
      });
      imagePromises.push({ promise: overlayPromise, page: card.dataset.page });
    }

    card.append(link, author, star);
    container.appendChild(card);
  }

  return imagePromises;
}
