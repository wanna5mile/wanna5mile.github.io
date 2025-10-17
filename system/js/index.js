    // --- Update Popup + Dashboard + ToTop ---
    document.addEventListener("DOMContentLoaded", () => {
      const popup = document.getElementById("updatePopup");
      const video = document.getElementById("updateVideo");
      const closeBtn = document.getElementById("closeUpdateBtn");
      const viewUpdateBtn = document.getElementById("viewUpdateBtn");
      const viewInfoBtn = document.getElementById("viewUpdateInfoBtn");
      const dontShowBtn = document.getElementById("dontShowBtn");
      const dashboardMenu = document.getElementById("dashboardMenu");
      const dashboardBtn = document.getElementById("dashboardBtn");
      const pfp = document.getElementById("pfp");

      const currentVersion = "v0.8";
      const storedVersion = localStorage.getItem("dismissedUpdateVersion");

      if (storedVersion !== currentVersion && !sessionStorage.getItem("updatePopupClosed")) {
        setTimeout(() => popup.classList.add("show"), 1500);
      }

      function stopVideo() {
        const src = video.src;
        video.src = "";
        video.src = src;
      }

      function closePopup() {
        popup.classList.remove("show");
        sessionStorage.setItem("updatePopupClosed", "true");
        stopVideo();
      }

      closeBtn.addEventListener("click", closePopup);
      dontShowBtn.addEventListener("click", () => {
        localStorage.setItem("dismissedUpdateVersion", currentVersion);
        closePopup();
      });

      viewUpdateBtn.addEventListener("click", () => window.open("system/pages/updates.html", "_blank"));
      viewInfoBtn.addEventListener("click", () => window.open("system/pages/update-info.html", "_blank"));

      // Dashboard toggle
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
          if (dashboardMenu.style.display === "block" && !dashboardMenu.contains(e.target) && e.target !== dashboardBtn) toggleDashboard(e);
        });
      }

      const toTopBtn = document.getElementById("toTopBtn");
      window.onscroll = () => {
        toTopBtn.style.display = (document.body.scrollTop > 300 || document.documentElement.scrollTop > 200) ? "block" : "none";
      };
      const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
      toTopBtn.onclick = scrollToTop;
      toTopBtn.addEventListener("dblclick", scrollToTop);

      const savedPic = localStorage.getItem("profilePic");
      if (savedPic) pfp.src = savedPic;
    });
