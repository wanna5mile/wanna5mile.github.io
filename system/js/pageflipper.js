/* ===============================
   PHYSICS PAGE CONTROLLER
   =============================== */

// ---- CONFIG ----
const PAGE_ACCEL = 0.9;     // how fast momentum builds
const PAGE_FRICTION = 0.85; // how fast it slows
const PAGE_THRESHOLD = 1;   // velocity needed to flip page
const TAP_COOLDOWN = 300;   // ms (~0.3s)

// ---- STATE ----
let pageVelocity = 0;
let lastFlipTime = 0;

const keys = {
  left: false,
  right: false
};

// ---- SAFE PAGE FLIP ----
function canFlip() {
  return performance.now() - lastFlipTime > TAP_COOLDOWN;
}

function flipNext() {
  if (!canFlip()) return;
  lastFlipTime = performance.now();
  nextPage();
}

function flipPrev() {
  if (!canFlip()) return;
  lastFlipTime = performance.now();
  prevPage();
}

// ---- KEY INPUT ----
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "ArrowLeft") keys.left = true;

  // tap = immediate flip
  if (e.repeat) return;

  if (e.key === "ArrowRight") flipNext();
  if (e.key === "ArrowLeft") flipPrev();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowLeft") keys.left = false;
});

// ---- PHYSICS LOOP ----
function pagePhysicsLoop() {
  // acceleration
  if (keys.right) pageVelocity += PAGE_ACCEL;
  if (keys.left) pageVelocity -= PAGE_ACCEL;

  // friction
  pageVelocity *= PAGE_FRICTION;

  // flip pages if momentum is strong enough
  if (pageVelocity > PAGE_THRESHOLD && canFlip()) {
    flipNext();
    pageVelocity = 0;
  }

  if (pageVelocity < -PAGE_THRESHOLD && canFlip()) {
    flipPrev();
    pageVelocity = 0;
  }

  // kill micro jitter
  if (Math.abs(pageVelocity) < 0.01) pageVelocity = 0;

  requestAnimationFrame(pagePhysicsLoop);
}

// ---- START ----
pagePhysicsLoop();
