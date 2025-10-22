// ==========================================================
// ASSETS.JS | Updated from unified all.js
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {
  const APPS_SCRIPT_API_URL =
    "https://script.google.com/macros/s/AKfycbzoPHsJICVHOx8ABqkXpTvawgxCHOjR20eLe_UKFs07zrClT_0DiyVxRV72AL-abE2VnA/exec";

  // Initialize elements
  if (typeof initElements === "function") initElements();
  const { container, preloader } = window.dom || {};

  if (!container || !preloader) {
    console.error("❌ Missing container or preloader during initialization.");
    return;
  }

  preloader.style.display = "block";
  updateProgress?.(5);

  try {
    const res = await fetch(APPS_SCRIPT_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    let assetData;
    try {
      assetData = await res.json();
    } catch (jsonErr) {
      const text = await res.text();
      throw new Error("Invalid JSON returned by Apps Script:\n" + text);
    }

    if (!Array.isArray(assetData)) {
      console.warn("⚠️ Unexpected data structure:", assetData);
    }

    // Sanitize data
    assetData.forEach(asset => {
      for (const key in asset) asset[key] = String(asset[key] || "").trim();
    });

    // Store globally
    window.assetsData = assetData;

    // Render asset cards
    const imagePromises = createAssetCards(assetData);

    // Wait for all image loads
    await Promise.allSettled(imagePromises.map(p => p.promise));

    updateProgress?.(100);
  } catch (err) {
    console.error("Error fetching/rendering asset data:", err);
    container.innerHTML = `
      <p style='color:red; text-align:center; margin-top:2em;'>
        ⚠️ Failed to load assets.<br>${err.message}
      </p>`;
  } finally {
    preloader.style.display = "none";
    if (typeof refreshCards === "function") refreshCards();
  }
});


// ==========================================================
// CREATE ASSET CARDS — Hardened for numeric/null titles
// ==========================================================
function createAssetCards(data) {
  const { container } = window.dom || {};
  if (!container) return Promise.resolve();

  container.innerHTML = "";
  const imagePromises = [];

  const sorted = [...data].sort((a, b) => {
    const aTitle = String(a.title || "").trim();
    const bTitle = String(b.title || "").trim();
    const aFav = favorites?.has(aTitle);
    const bFav = favorites?.has(bTitle);
    if (aFav !== bFav) return bFav - aFav;
    return (a.page || 1) - (b.page || 1);
  });

  for (const asset of sorted) {
    const safeTitle = String(asset.title || "").trim();
    const safeAuthor = String(asset.author || "").trim();
    const safeStatus = String(asset.status || "").toLowerCase();
    const safeImage = String(asset.image || "").trim();
    const safeLink = String(asset.link || "").trim();

    const card = document.createElement("div");
    card.className = "asset-card";
    card.dataset.title = safeTitle.toLowerCase();
    card.dataset.author = safeAuthor.toLowerCase();
    card.dataset.page = asset.page ? parseInt(asset.page) : 1;
    card.dataset.filtered = "true";

    let imageSrc = safeImage;
    if (!imageSrc || imageSrc === "blank" || safeStatus === "blank") {
      imageSrc = config?.fallbackImage;
    }

    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = safeTitle || "Asset";
    img.loading = "eager";
    img.addEventListener("error", () => {
      if (!img.dataset.fallbackApplied) {
        img.src = config?.fallbackImage;
        img.dataset.fallbackApplied = "true";
      }
    });

    const imgPromise = new Promise(resolve => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
    imagePromises.push({ promise: imgPromise, page: card.dataset.page });

    const link = document.createElement("a");
    link.href = safeLink || config?.fallbackLink;
    link.target = "_blank";
    link.rel = "noopener";
    link.appendChild(img);
    link.innerHTML += `<h3>${safeTitle || "Untitled"}</h3>`;

    const author = document.createElement("p");
    author.textContent = safeAuthor || " ";

    const star = document.createElement("span");
    star.className = "favorite-star";
    star.textContent = favorites?.has(safeTitle) ? "★" : "☆";
    star.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      if (favorites?.has(safeTitle)) favorites.delete(safeTitle);
      else favorites?.add(safeTitle);
      saveFavorites?.();
      refreshCards?.();
    });

    // Status overlays
    if (safeStatus === "soon") {
      card.classList.add("soon");
      link.removeAttribute("href");
      link.style.pointerEvents = "none";
    } else if (safeStatus === "featured" || safeStatus === "fixed") {
      const overlay = document.createElement("img");
      overlay.className = `status-overlay ${safeStatus}`;
      overlay.src = `system/images/${safeStatus}.png`;
      overlay.alt = safeStatus;
      overlay.loading = "eager";
      card.appendChild(overlay);

      imagePromises.push({
        promise: new Promise(resolve => {
          overlay.addEventListener("load", resolve, { once: true });
          overlay.addEventListener("error", resolve, { once: true });
        }),
        page: card.dataset.page,
      });
    }

    card.append(link, author, star);
    container.appendChild(card);
  }

  return imagePromises;
}
