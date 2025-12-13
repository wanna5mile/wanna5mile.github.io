  // Function to force background images to 1365px width and auto height
  function forceBackgroundSize() {
    const el = document.body; // Change this if your backgrounds are on another container

    const style = getComputedStyle(el);
    const bgImage = style.backgroundImage;

    // Only apply to images from /system/backgrounds/
    if (bgImage && bgImage !== "none" && bgImage.includes("/system/backgrounds/")) {
      el.style.backgroundSize = "1365px auto";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center top";
    }
  }

  // Run once after everything is loaded
  document.addEventListener("DOMContentLoaded", () => {
    forceBackgroundSize();
  });

  // Optional: Re-apply if themes change dynamically
  // Example: call this function after switching theme
  function applyTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    
    // Use requestAnimationFrame to ensure CSS is applied first
    requestAnimationFrame(forceBackgroundSize);
  }

  // Optional: Observe changes to CSS variables or inline styles (advanced)
  const observer = new MutationObserver(forceBackgroundSize);
  observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
