/* ==========================================================
   WannaSmile | Advanced Custom Cursor System (Stable v2)
   ----------------------------------------------------------
   - Fully hides native cursor
   - Correctly switches between flipped/normal sets
   - Context-aware (pointer, grab, text, move, etc.)
   - Flicker-proof & fast
   ========================================================== */
(() => {
  "use strict";

  // === CONFIG ===
  const CURSOR_PATH = "system/images/cursor/white/";
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

  const SWITCH_THRESHOLD = 0.05; // 5% horizontal buffer
  const UPDATE_DELAY = 50; // faster switching
  const CURSOR_SIZE = 32;

  // === DESKTOP DETECTION ===
  const isDesktop = !/Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(
    navigator.userAgent
  );
  if (!isDesktop) return;

  // === GLOBAL CURSOR HIDE ===
  const globalHideStyle = document.createElement("style");
  globalHideStyle.textContent = `
    * { cursor: none !important; }
    html, body { cursor: none !important; }
  `;
  document.head.appendChild(globalHideStyle);

  // === CUSTOM CURSOR ELEMENT ===
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
    transition: "opacity 0.1s ease",
  });
  document.body.appendChild(cursorEl);

  // === STATE ===
  let lastFlip = "right";
  let currentType = "cursor";
  let lastSwitch = 0;

  // === SET CURSOR IMAGE ===
  const setCursor = (type = "cursor") => {
    const now = Date.now();
    const cursorSet = lastFlip === "left" ? CURSORS.flipped : CURSORS.normal;
    const filename =
      cursorSet[type] || CURSORS.universal[type] || CURSORS.normal.cursor;

    if (cursorEl.src.endsWith(filename)) return; // prevent redundant flicker

    cursorEl.src = CURSOR_PATH + filename;
    currentType = type;
    lastSwitch = now;
  };

  // Initial cursor
  setCursor("cursor");

  // === MOVE TRACKING ===
  document.addEventListener("mousemove", (e) => {
    cursorEl.style.opacity = "1";
    cursorEl.style.top = e.clientY + "px";
    cursorEl.style.left = e.clientX + "px";

    const now = Date.now();
    const mid = window.innerWidth / 2;
    const buffer = window.innerWidth * SWITCH_THRESHOLD;

    if (now - lastSwitch < UPDATE_DELAY) return;

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

  // === CONTEXT-AWARE CURSOR LOGIC ===
  const updateCursor = (type) => {
    if (type !== currentType) setCursor(type);
  };

  document.addEventListener("mousedown", () => updateCursor("grab"));
  document.addEventListener("mouseup", () => updateCursor("cursor"));

  document.addEventListener("mouseover", (e) => {
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
    if (style.cursor === "pointer" || tag === "a")
      return updateCursor("point");
    updateCursor("cursor");
  });
})();
