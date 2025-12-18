/* ==========================================================
   WannaSmile | Custom Cursor System (No-Shrink Version)
   ----------------------------------------------------------
   - Removes ALL screen clamping / boundaries
   - Full desktop cursor replacement, no viewport shifting
   - Hover, click, grab, and context logic
   ========================================================== */
(() => {
  "use strict";

  // === CONFIG ===
  const CURSOR_PATH = "https://cdn.jsdelivr.net/gh/01110010-00110101/01110010-00110101.github.io@main/system/images/cursor/white/";
  const CURSORS = {
    normal: {
      cursor: "normal_cursor.png",
      click: "normal_click.png",
      mousedown: "normal_mousedown.png",
      grab: "normal_grab.png",
      point: "normal_point.png",
    },
    flipped: {
      cursor: "flipped_cursor.png",
      click: "flipped_click.png",
      mousedown: "flipped_mousedown.png",
      grab: "flipped_grab.png",
      point: "flipped_point.png",
    },
    universal: {
      ibeam: "universal_ibeam.png",
      sizeall: "universal_sizeall.png",
      noselect: "universal_noselect1.png",
    },
  };

  const SWITCH_THRESHOLD = 0.05;
  const UPDATE_DELAY = 50;
  const CURSOR_SIZE = 32;
  const CLICK_HOLD_TIME = 500;

  // === DESKTOP ONLY ===
  const isDesktop = !/Android|iPhone|iPad|iPod|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  if (!isDesktop) return;

  // === HIDE NATIVE CURSOR & REMOVE WHITESPACE ===
  const style = document.createElement("style");
  style.textContent = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100%;
      height: 100%;
      overflow: hidden !important;
      cursor: none !important;
    }
    input, textarea { caret-color: transparent !important; }
    ::-webkit-scrollbar,
    ::-webkit-scrollbar-thumb,
    ::-webkit-scrollbar-track { cursor: none !important; }
  `;
  document.head.appendChild(style);

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
  let clickTimer = null;

  // === SET CURSOR ===
  const setCursor = (type = "cursor") => {
    const set = lastFlip === "left" ? CURSORS.flipped : CURSORS.normal;
    let file =
      set[type] || CURSORS.universal[type] || set.cursor || CURSORS.normal.cursor;

    if (!cursorEl.src.endsWith(file)) {
      cursorEl.src = CURSOR_PATH + file;
      currentType = type;
      lastSwitch = Date.now();
    }
  };

  const updateCursor = (type) => {
    if (type !== currentType) setCursor(type);
  };

  // === INITIAL ===
  setCursor("cursor");

  // === MOVEMENT (∞ NO LIMITS — FULL FREEDOM) ===
  document.addEventListener("mousemove", (e) => {
    cursorEl.style.opacity = "1";
    cursorEl.style.top = e.clientY + "px";
    cursorEl.style.left = e.clientX + "px"; // ★ NO LIMITS ANYWHERE

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

  // === CLICK / DRAG LOGIC ===
  document.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    isDragging = false;

    const tag = e.target.tagName.toLowerCase();
    const style = getComputedStyle(e.target);
    const draggable =
      e.target.draggable ||
      style.cursor === "grab" ||
      style.cursor === "grabbing" ||
      tag === "img" ||
      tag === "canvas";

    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (isMouseDown) updateCursor("mousedown");
    }, CLICK_HOLD_TIME);

    if (draggable) {
      isDragging = true;
      updateCursor("grab");
    } else {
      updateCursor("click");
    }
  });

  document.addEventListener("mouseup", () => {
    clearTimeout(clickTimer);
    isMouseDown = false;
    if (isDragging) {
      isDragging = false;
      updateCursor("cursor");
      return;
    }
    updateCursor("cursor");
  });

  // === HOVER CONTEXT ===
  document.addEventListener("mouseover", (e) => {
    if (isMouseDown) return;

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
