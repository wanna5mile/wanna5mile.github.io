(() => {
  "use strict";

  const ANNOUNCEMENT_SHEET_URL =
    "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";
    
  const STICKER_PATH = "/system/images/announcement-stickers/";
  const REFRESH = 20000; // 20 seconds
  let current = "";

  /* -----------------------------
     CSS
  ----------------------------- */
  const style = document.createElement("style");
  style.textContent = `
    #globalAnn {
      width: 100%;
      padding: 12px 20px;
      font-size: 16px;
      font-family: system-ui, sans-serif;
      text-align: center;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999999;
      cursor: pointer;
      transition: opacity .25s ease;
      color: #fff;
      display: none;
    }
    #globalAnn img {
      width: 22px;
      vertical-align: middle;
      margin: 0 4px;
    }
    body.has-announcement {
      margin-top: 48px !important;
    }
  `;
  document.head.appendChild(style);

  /* -----------------------------
     Helper: Sticker Replacement
  ----------------------------- */
  function withStickers(text) {
    return text.replace(/:([a-zA-Z0-9_\-]+):/g, (m, n) => {
      return `<img src="${STICKER_PATH}${n}.png" alt="${n}">`;
    });
  }

  /* -----------------------------
     Build Banner DOM
  ----------------------------- */
  function ensureBanner() {
    let b = document.getElementById("globalAnn");
    if (!b) {
      b = document.createElement("div");
      b.id = "globalAnn";
      document.body.appendChild(b);
    }
    return b;
  }

  /* -----------------------------
     Fetch + Pick Active Row
  ----------------------------- */
  async function fetchSheet() {
    try {
      const r = await fetch(ANNOUNCEMENT_SHEET_URL, { cache: "no-store" });
      return await r.json();
    } catch (e) {
      console.warn("Announcement fetch failed:", e);
      return [];
    }
  }

  function getActive(rows) {
    return rows.find(r => {
      if (!r.announcement) return false;

      const enabled = String(r.enabled || "").trim().toLowerCase();
      if (enabled !== "yes" && enabled !== "true") return false;

      if (r.expires) {
        const now = new Date();
        const exp = new Date(r.expires);
        if (exp < now) return false;
      }

      return true;
    }) || null;
  }

  /* -----------------------------
     Update Banner
  ----------------------------- */
  function updateBanner(text, type) {
    const bar = ensureBanner();

    if (!text) {
      bar.style.display = "none";
      document.body.classList.remove("has-announcement");
      current = "";
      return;
    }

    const processed = withStickers(text);
    if (processed === current) return;
    current = processed;

    // Colors based on "type"
    const colors = {
      info: "#2196F3",
      warning: "#FFC107",
      danger: "#F44336",
      critical: "#B71C1C",
    };
    bar.style.background = colors[(type || "info").toLowerCase()] || colors.info;

    bar.innerHTML = processed;
    bar.style.display = "block";
    document.body.classList.add("has-announcement");
  }

  /* -----------------------------
     Main Loop
  ----------------------------- */
  async function refresh() {
    const rows = await fetchSheet();
    const active = getActive(rows);
    if (!active) updateBanner("");
    else updateBanner(active.announcement, active.type);
  }

  /* Init */
  document.addEventListener("DOMContentLoaded", refresh);
  setInterval(refresh, REFRESH);

})();
