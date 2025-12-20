/* ===============================
   WannaSmile Page Physics Input
   SAFE FOR all.js
   =============================== */

(() => {
  "use strict";

  // ---- CONFIG ----
  const PAGE_ACCEL = 0.9;
  const PAGE_FRICTION = 0.85;
  const PAGE_THRESHOLD = 1;
  const TAP_COOLDOWN = 300;

  // ---- STATE ----
  let velocity = 0;
  let lastFlip = 0;

  const keys = {
    left: false,
    right: false
  };

  // ---- SAFETY CHECK ----
  function canFlip() {
    return typeof window.nextPage === "function"
        && typeof window.prevPage === "function"
        && performance.now() - lastFlip > TAP_COOLDOWN;
  }

  function flipNext() {
    if (!canFlip()) return;
    lastFlip = performance.now();
    window.nextPage();
  }

  function flipPrev() {
    if (!canFlip()) return;
    lastFlip = performance.now();
    window.prevPage();
  }

  // ---- INPUT ----
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") keys.right = true;
    if (e.key === "ArrowLeft") keys.left = true;

    if (e.repeat) return;

    if (e.key === "ArrowRight") flipNext();
    if (e.key === "ArrowLeft") flipPrev();
  });

  document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowLeft") keys.left = false;
  });

  // ---- PHYSICS LOOP ----
  function loop() {
    if (keys.right) velocity += PAGE_ACCEL;
    if (keys.left) velocity -= PAGE_ACCEL;

    velocity *= PAGE_FRICTION;

    if (velocity > PAGE_THRESHOLD) {
      flipNext();
      velocity = 0;
    }

    if (velocity < -PAGE_THRESHOLD) {
      flipPrev();
      velocity = 0;
    }

    if (Math.abs(velocity) < 0.01) velocity = 0;

    requestAnimationFrame(loop);
  }

  loop();
})();
