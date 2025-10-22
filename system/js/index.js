// ---- index.js ----
// Handles update popup, dashboard toggle, scroll-to-top, and profile picture

document.addEventListener("DOMContentLoaded", () => {
  // --- Cached DOM elements ---
  const popup = document.getElementById("updatePopup");
  const video = document.getElementById("updateVideo");
  const closeBtn = document.getElementById("closeUpdateBtn");
  const viewUpdateBtn = document.getElementById("viewUpdateBtn");
  const viewInfoBtn = document.getElementById("viewUpdateInfoBtn");
  const dontShowBtn = document.getElementById("dontShowBtn");
  const dashboardMenu = document.getElementById("dashboardMenu");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const toTopBtn = document.getElementById("toTopBtn");
  const pfp = document.getElementById("pfp");

  // --- UPDATE POPUP HANDLING ---
  const currentVersion = "v0.8";
  const storedVersion = localStorage.getItem("dismissedUpdateVersion");

  function stopVideo() {
    if (!video) return;
    const src = video.src;
    video.src = "";
    video.src = src;
  }

  function closePopup() {
    if (!popup) return;
    popup.classList.remove("show");
    sessionStorage.setItem("updatePopupClosed", "true");
    stopVideo();
  }

  function showPopup() {
    if (!popup || storedVersion === currentVersion || sessionStorage.getItem("updatePopupClosed")) return;
    setTimeout(() => popup.classList.add("show"), 1500);
  }

  if (popup) {
    closeBtn?.addEventListener("click", closePopup);
    dontShowBtn?.addEventListener("click", () => {
      localStorage.setItem("dismissedUpdateVersion", currentVersion);
      closePopup();
    });

    viewUpdateBtn?.addEventListener("click", () =>
      window.open("system/pages/updates.html", "_blank")
    );
    viewInfoBtn?.addEventListener("click", () =>
      window.open("system/pages/update-info.html", "_blank")
    );

    showPopup();
  }

  // --- DASHBOARD TOGGLE ---
  if (dashboardBtn && dashboardMenu) {
    dashboardMenu.style.display = "none";
    dashboardMenu.style.opacity = 0;
    dashboardMenu.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    const toggleDashboard = (e) => {
      e.stopPropagation();
      const isVisible = dashboardMenu.style.display === "block";
      if (isVisible) {
        dashboardMenu.style.opacity = 0;
        dashboardBtn.setAttribute("aria-expanded", "false");
        dashboardMenu.setAttribute("aria-hidden", "true");
        setTimeout(() => (dashboardMenu.style.display = "none"), 300);
      } else {
        dashboardMenu.style.display = "block";
        dashboardBtn.setAttribute("aria-expanded", "true");
        dashboardMenu.setAttribute("aria-hidden", "false");
        setTimeout(() => (dashboardMenu.style.opacity = 1), 10);
      }
    };

    dashboardBtn.addEventListener("click", toggleDashboard);
    document.addEventListener("click", (e) => {
      const isOpen = dashboardMenu.style.display === "block";
      const clickedOutside = !dashboardMenu.contains(e.target) && e.target !== dashboardBtn;
      if (isOpen && clickedOutside) toggleDashboard(e);
    });
  }

  // --- SCROLL TO TOP BUTTON ---
  if (toTopBtn) {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const handleScroll = () => {
      const scrollY = document.body.scrollTop || document.documentElement.scrollTop;
      toTopBtn.style.display = scrollY > 200 ? "block" : "none";
    };

    window.addEventListener("scroll", handleScroll);
    toTopBtn.addEventListener("click", scrollToTop);
    toTopBtn.addEventListener("dblclick", scrollToTop);

    handleScroll(); // initialize state
  }

  // --- PROFILE PICTURE LOADER ---
  if (pfp) {
    const savedPic = localStorage.getItem("profilePic");
    if (savedPic) pfp.src = savedPic;
  }
});
