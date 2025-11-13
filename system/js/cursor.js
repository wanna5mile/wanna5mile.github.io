/* ==========================================================
   WannaSmile | Advanced Custom Cursor System (Stable v3)
   ----------------------------------------------------------
   - Fully hides native cursor globally
   - Adds proper "cursordown" & flipped fallback support
   - Detects real grab/drag vs normal click
   - Fixes delayed jump during grab
   - Context-sensitive hover mapping
   ========================================================== */
(() => {
  "use strict";

  // === CONFIG ===
  const CURSOR_PATH = "system/images/cursor/white/";
  const CURSORS = {
    normal: {
      cursor: "normal_cursor.png",
      cursordown: "normal_cursordown.png",
      grab: "normal_grab.png",
      point: "normal_point.png",
    },
    flipped: {
      cursor: "flipped_cursor.png",
      cursordown: "flipped_cursordown.png",
      grab: "flipped_grab.png",
      point: "flipped_point.png",
    },
    universal: {
      ibeam: "universal_ibeam.png",
      sizeall: "universal_sizeall.png",
      noselect: "universal_noselect.png",
    },
  };

  const SWITCH_THRESHOLD = 0.05; // screen buffer (5%)
  const UPDATE_DELAY = 50; // ms cooldown
  const CURSOR_SIZE = 32;

  // === DESKTOP DETECTION ===
  const isDesktop = !/Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(
    navigator.userAgent
  );
  if (!isDesktop) return;

  // === GLOBAL CURSOR HIDE ===
  const style = document.createElement("style");
  style.textContent = `
    * { cursor: none !important; }
    html, body { cursor: none !important; }
  `;
  document.head.appendChild(style);

  // === CREATE CUSTOM CURSOR ===
  const cursorEl = document.createElement("img");
  Object.assign(cursorEl.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${CURSOR_SIZE}px`,
    height: `${CURSOR_SIZE}px`,
    pointerEvents: "none",
    zIndex: "999999",
    transform: "translate(-50%, -50%)",
    imageRendering: "pixelated",
    opacity: "0",
    transition: "opacity 0.08s ease",
  });
  document.body.appendChild(cursorEl);

  // === STATE ===
  let lastFlip = "right";
  let currentType = "cursor";
  let lastSwitch = 0;
  let isMouseDown = false;
  let isDragging = false;

  // === SET CURSOR SAFELY ===
  const setCursor = (type = "cursor") => {
    const cursorSet = lastFlip === "left" ? CURSORS.flipped : CURSORS.normal;
    let filename =
      cursorSet[type] ||
      CURSORS.universal[type] ||
      cursorSet.cursor ||
      CURSORS.normal.cursor;

    // fallback for missing cursordown images
    if (type === "cursordown" && !cursorSet.cursordown) {
      filename = cursorSet.cursor || CURSORS.normal.cursor;
    }

    if (!cursorEl.src.endsWith(filename)) {
      cursorEl.src = CURSOR_PATH + filename;
      currentType = type;
      lastSwitch = Date.now();
    }
  };

  // === INITIAL ===
  setCursor("cursor");

  // === TRACK MOVEMENT ===
  document.addEventListener("mousemove", (e) => {
    cursorEl.style.opacity = "1";
    cursorEl.style.top = e.clientY + "px";
    cursorEl.style.left = e.clientX + "px";

    const now = Date.now();
    if (now - lastSwitch < UPDATE_DELAY) return;

    const mid = window.innerWidth / 2;
    const buffer = window.innerWidth * SWITCH_THRESHOLD;
    const side =
      e.clientX < mid - buffer
        ? "left"
        : e.clientX > mid + buffer
        ? "right"
        : lastFlip;

    if (side !== lastFlip) {
      lastFlip = side;
      setCursor(currentType);
    }
  });

  document.addEventListener("mouseleave", () => (cursorEl.style.opacity = "0"));
  document.addEventListener("mouseenter", () => (cursorEl.style.opacity = "1"));

  // === CONTEXT-AWARE HOVER ===
  const updateCursor = (type) => {
    if (type !== currentType) setCursor(type);
  };

  // === MOUSE INTERACTIONS ===
  document.addEventListener("mousedown", (e) => {
    isMouseDown = true;

    const tag = e.target.tagName.toLowerCase();
    const style = getComputedStyle(e.target);
    const draggable =
      e.target.draggable ||
      style.cursor === "grab" ||
      style.cursor === "grabbing" ||
      tag === "img" ||
      tag === "canvas";

    if (draggable) {
      isDragging = true;
      updateCursor("grab");
    } else {
      updateCursor("cursordown");
    }
  });

  document.addEventListener("mouseup", () => {
    isMouseDown = false;
    isDragging = false;
    updateCursor("cursor");
  });

  document.addEventListener("mouseover", (e) => {
    if (isMouseDown) return; // don't override active state

    const tag = e.target.tagName.toLowerCase();
    const style = getComputedStyle(e.target);

    const disabled =
      e.target.disabled ||
      e.target.getAttribute("aria-disabled") === "true" ||
      e.target.classList.contains("disabled") ||
      style.pointerEvents === "none" ||
      style.cursor === "not-allowed" ||
      style.cursor === "no-drop";

    if (disabled) return updateCursor("noselect");
    if (style.cursor === "text" || tag === "input" || tag === "textarea")
      return updateCursor("ibeam");
    if (style.cursor === "move") return updateCursor("sizeall");
    if (style.cursor === "pointer" || tag === "a" || tag === "button")
      return updateCursor("point");
    updateCursor("cursor");
  });
})();
