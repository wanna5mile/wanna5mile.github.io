(() => {
  "use strict";

  const safeStr = (v) => (v == null ? "" : String(v));
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));

  window.config = {
    fallbackImage: "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/404_blank.png",
    fallbackLink: "https://wanna5mile.github.io./source/dino/",
    gifBase: "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/GIF/",
    sheetUrl: "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec"
  };

  const getSortMode = () => localStorage.getItem("sortMode") || "sheet";

  function createAssetCards(data) {
    const container = document.getElementById("container");
    if (!container) return [];

    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    const imagePromises = [];

    const sortMode = getSortMode();
    let sorted = Array.isArray(data) ? [...data] : [];

    if (sortMode === "alphabetical") {
      sorted.sort((a, b) =>
        safeStr(a.title).localeCompare(safeStr(b.title), undefined, {
          numeric: true,
          sensitivity: "base"
        })
      );
    }

    const badgeMap = {
      featured: "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/featured-cover.png",
      new: "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/new-cover.png",
      fixed: "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/fixed-cover.png",
      fix: "https://raw.githubusercontent.com/wanna5mile/wanna5mile.github.io/main/system/images/fixing.png"
    };

    for (const asset of sorted) {
      const title = safeStr(asset.title).trim();
      const author = safeStr(asset.author).trim();
      const imageSrc = safeStr(asset.image) || config.fallbackImage;
      const link = safeStr(asset.link) || config.fallbackLink;
      const status = safeStr(asset.status).toLowerCase();

      const card = document.createElement("div");
      card.className = "asset-card";

      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.className = "asset-link";

      const wrapper = document.createElement("div");
      wrapper.className = "asset-img-wrapper";
      wrapper.style.position = "relative";
      wrapper.style.borderRadius = "14px";
      wrapper.style.overflow = "hidden";

      const img = document.createElement("img");
      img.alt = title;
      img.className = "asset-img";

      const imgPromise = new Promise((resolve) => {
        const tmp = new Image();
        tmp.onload = () => { img.src = imageSrc; resolve(); };
        tmp.onerror = () => { img.src = config.fallbackImage; resolve(); };
        tmp.src = imageSrc;
      });

      imagePromises.push(imgPromise);
      wrapper.appendChild(img);

      const addOverlay = (src) => {
        const o = document.createElement("img");
        o.src = src;
        Object.assign(o.style, {
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          pointerEvents: "none"
        });
        wrapper.appendChild(o);
      };

      if (asset.featured === "yes") addOverlay(badgeMap.featured);
      if (asset.new === "yes") addOverlay(badgeMap.new);
      if (asset.fixed === "yes") addOverlay(badgeMap.fixed);

      if (status === "new" || status === "updated") {
        addOverlay(`${config.gifBase}${status}.gif`);
      }

      if (status === "fix") addOverlay(badgeMap.fix);

      a.appendChild(wrapper);

      const titleEl = document.createElement("h3");
      titleEl.textContent = title;

      const authorEl = document.createElement("p");
      authorEl.textContent = author;

      card.append(a, titleEl, authorEl);
      frag.appendChild(card);
    }

    container.appendChild(frag);
    return imagePromises;
  }

  async function loadAssets() {
    try {
      const res = await fetch(config.sheetUrl, { cache: "no-store" });
      const raw = await res.json();
      const data = raw.filter((i) => Object.values(i).some((v) => safeStr(v).trim()));
      createAssetCards(data);
    } catch (err) {
      console.error("Failed to load assets:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadAssets();
  });
})();
