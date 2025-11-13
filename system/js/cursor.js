/* ==========================================================
   WannaSmile | Advanced Custom Cursor System
   ----------------------------------------------------------
   - Desktop-only detection
   - Dynamic cursor flip (left/right half)
   - Context-sensitive cursors (pointer, grab, text, move, noselect)
   - Auto-detects disabled/inactive elements
   - Flicker-proof with buffer + cooldown
   ========================================================== */
(() => {
  "use strict";

  // Paths
  const CURSOR_PATH = "system/images/cursor/white/";

  // Cursor filenames
  const CURSORS = {
    normal: {
      cursor: "normal_cursor.png",
      grab: "normal_grab.png",
      point: "normal_point.png",
    },
    flipped: {
      cursor: "flipped_cursor.png",
      grab: "flipped_grab.png",
      point: "flipped_point.png",
    },
    universal: {
      ibeam: "universal_ibeam.png",
      sizeall: "universal_sizeall.png",
      noselect: "universal_noselect.png",
    },
  };

  // Config
  const SWITCH_THRESHOLD = 0.05; // 5% screen buffer
  const UPDATE_DELAY = 100; // ms cooldown
  const CURSOR_SIZE = 32; // px

  // Detect desktop only
  const isDesktop = !/Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(
    navigator.userAgent
  );
  if (!isDesktop) return;

  // Create cursor element
  const cursorEl = document.createElement("img");
  Object.assign(cursorEl.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: CURSOR_SIZE + "px",
    height: CURSOR_SIZE + "px",
    pointerEvents: "none",
    zIndex: "9999",
    transform: "translate(-50%, -50%)",
    imageRendering: "pixelated",
    opacity: "0",
    transition: "opacity 0.1s ease",
  });
  document.body.appendChild(cursorEl);
  document.body.style.cursor = "none";

  // State
  let lastFlip = "right";
  let lastChangeTime = 0;
  let currentCursorType = "cursor";

  // Set cursor safely
  const setCursor = (type = "cursor") => {
    const now = Date.now();
    const cursorSet = lastFlip === "left" ? CURSORS.flipped : CURSORS.normal;
    const filename =
      cursorSet[type] || CURSORS.universal[type] || CURSORS.normal.cursor;
    cursorEl.src = CURSOR_PATH + filename;
    currentCursorType = type;
    lastChangeTime = now;
  };

  // Initial cursor
  setCursor("cursor");

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    cursorEl.style.opacity = "1";
    cursorEl.style.top = e.clientY + "px";
    cursorEl.style.left = e.clientX + "px";

    const now = Date.now();
    const screenMid = window.innerWidth / 2;
    const buffer = window.innerWidth * SWITCH_THRESHOLD;

    if (now - lastChangeTime < UPDATE_DELAY) return;

    const side =
      e.clientX < screenMid - buffer
        ? "left"
        : e.clientX > screenMid + buffer
        ? "right"
        : lastFlip;

    if (side !== lastFlip) {
      lastFlip = side;
      setCursor(currentCursorType);
    }
  });

  // Hide/show on leave
  document.addEventListener("mouseleave", () => (cursorEl.style.opacity = "0"));
  document.addEventListener("mouseenter", () => (cursorEl.style.opacity = "1"));

  // Smooth cursor updates
  const updateCursorType = (type) => {
    if (type !== currentCursorType) setCursor(type);
  };

  // Click/drag interactions
  document.addEventListener("mousedown", () => updateCursorType("grab"));
  document.addEventListener("mouseup", () => updateCursorType("cursor"));

  // Main hover detection logic
  document.addEventListener("mouseover", (e) => {
    const tag = e.target.tagName.toLowerCase();
    const style = getComputedStyle(e.target);

    const isDisabled =
      e.target.disabled ||
      e.target.getAttribute("aria-disabled") === "true" ||
      e.target.classList.contains("disabled") ||
      style.pointerEvents === "none" ||
      style.cursor === "not-allowed" ||
      style.cursor === "no-drop";

    if (isDisabled) {
      updateCursorType("noselect");
      return;
    }

    if (style.cursor === "text" || tag === "input" || tag === "textarea")
      updateCursorType("ibeam");
    else if (style.cursor === "move") updateCursorType("sizeall");
    else if (style.cursor === "pointer" || tag === "a")
      updateCursorType("point");
    else updateCursorType("cursor");
  });
})();
