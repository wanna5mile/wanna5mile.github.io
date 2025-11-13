/* ==========================================================
   WannaSmile | Custom Cursor Handler
   ----------------------------------------------------------
   - Detects computer users only
   - Uses white custom cursor by default
   - Flips based on screen half (left/right)
   - Cooldown prevents flicker near center
   ========================================================== */
(() => {
  "use strict";

  // Cursor folders
  const CURSOR_PATH = {
    white: "system/images/cursor/white/",
    black: "system/images/cursor/black/",
  };

  // Cursor filenames
  const CURSORS = {
    white: {
      normal: "cursor_white.png",
      flipped: "cursor_white_flipped.png",
    },
    black: {
      normal: "cursor_black.png",
      flipped: "cursor_black_flipped.png",
    },
  };

  // Config
  const ACTIVE_SET = "white"; // change to "black" if you want black default
  const SWITCH_THRESHOLD = 0.05; // 5% buffer zone to avoid flicker
  const UPDATE_DELAY = 100; // ms cooldown between flips

  let isComputer =
    !/Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);
  if (!isComputer) return; // Skip if not on desktop

  // Create custom cursor element
  const cursorEl = document.createElement("img");
  cursorEl.src = CURSOR_PATH[ACTIVE_SET] + CURSORS[ACTIVE_SET].normal;
  Object.assign(cursorEl.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "32px",
    height: "32px",
    pointerEvents: "none",
    zIndex: "9999",
    transform: "translate(-50%, -50%)",
    transition: "opacity 0.1s ease",
    opacity: "0",
    imageRendering: "pixelated",
  });
  document.body.appendChild(cursorEl);

  // Hide system cursor
  document.body.style.cursor = "none";

  let lastFlip = "right"; // start with normal
  let lastChangeTime = 0;

  // Mouse move logic
  document.addEventListener("mousemove", (e) => {
    cursorEl.style.opacity = "1";
    cursorEl.style.top = `${e.clientY}px`;
    cursorEl.style.left = `${e.clientX}px`;

    const now = Date.now();
    const screenMid = window.innerWidth / 2;
    const buffer = window.innerWidth * SWITCH_THRESHOLD;

    // Avoid rapid switching
    if (now - lastChangeTime < UPDATE_DELAY) return;

    // Determine current side
    const side = e.clientX < screenMid - buffer ? "left"
                : e.clientX > screenMid + buffer ? "right"
                : lastFlip; // within buffer zone → keep current

    if (side !== lastFlip) {
      const newSrc =
        side === "left"
          ? CURSOR_PATH[ACTIVE_SET] + CURSORS[ACTIVE_SET].flipped
          : CURSOR_PATH[ACTIVE_SET] + CURSORS[ACTIVE_SET].normal;
      cursorEl.src = newSrc;
      lastFlip = side;
      lastChangeTime = now;
    }
  });

  // Fade out cursor when leaving window
  document.addEventListener("mouseleave", () => (cursorEl.style.opacity = "0"));
  document.addEventListener("mouseenter", () => (cursorEl.style.opacity = "1"));
})();
