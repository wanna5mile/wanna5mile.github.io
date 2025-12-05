/* ==========================================================
   GLOBAL ANNOUNCEMENT SYSTEM (SELF-CONTAINED SCRIPT)
   Requires only: ANNOUNCEMENT_SHEET_URL (string)
   Supports :sticker: codes → image replacement
   ========================================================== */

(function () {
  if (typeof ANNOUNCEMENT_SHEET_URL !== "string") {
    console.error("[Announcements] Missing ANNOUNCEMENT_SHEET_URL variable.");
    return;
  }

  const STICKER_PATH = "/system/images/announcement-stickers/"; // <—

  async function fetchAnnouncements() {
    try {
      const res = await fetch(ANNOUNCEMENT_SHEET_URL, { cache: "no-store" });
      const rows = await res.json();
      return rows || [];
    } catch (err) {
      console.warn("[Announcements] Fetch failed:", err);
      return [];
    }
  }

  function filterActiveAnnouncements(rows) {
    return rows.filter(r => {
      if (!r.announcement) return false;

      const enabled = String(r.enabled || "").trim().toLowerCase();
      if (enabled !== "yes" && enabled !== "true") return false;

      if (r.expires) {
        const now = new Date();
        const exp = new Date(r.expires);
        if (exp < now) return false;
      }

      return true;
    });
  }

  // Convert :emoji_name: → <img src="...">
  function processStickers(text) {
    if (typeof text !== "string") return text;

    return text.replace(/:([a-zA-Z0-9_\-]+):/g, (match, stickerName) => {
      const src = `${STICKER_PATH}${stickerName}.png`;
      return `<img src="${src}" alt="${stickerName}" style="height:22px; vertical-align:middle; margin:0 4px;">`;
    });
  }

  function createBanner(msg) {
    const banner = document.createElement("div");
    banner.id = "globalAnnouncement";

    Object.assign(banner.style, {
      width: "100%",
      padding: "12px 20px",
      fontSize: "16px",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
      position: "fixed",
      top: "0",
      left: "0",
      zIndex: "999999",
      cursor: "pointer",
      transition: "0.25s ease",
      color: "#fff",
    });

    const type = (msg.type || "info").toLowerCase();  // <— CHANGED level → type

    const colors = {
      info: "#2196F3",
      warning: "#FFC107",
      danger: "#F44336",
      critical: "#B71C1C"
    };

    banner.style.background = colors[type] || colors.info;

    // Process stickers then insert HTML
    const html = processStickers(msg.announcement);
    banner.innerHTML = html;

    // close button
    const closeBtn = document.createElement("span");
    closeBtn.textContent = " ✕";
    closeBtn.style.marginLeft = "10px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.userSelect = "none";

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 250);
    });

    banner.appendChild(closeBtn);
    document.body.appendChild(banner);

    // Push page down
    document.body.style.marginTop = "48px";
  }

  async function initAnnouncements() {
    const rows = await fetchAnnouncements();
    const active = filterActiveAnnouncements(rows);

    if (!active.length) return;

    createBanner(active[0]);
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnnouncements);
  } else {
    initAnnouncements();
  }
})();
