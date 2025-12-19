(function () {

  let patterns = [];

  // IMPORTANT: use absolute path for GitHub Pages
  fetch("https://cdn.jsdelivr.net/gh/01110010-00110101/01110010-00110101.github.io@main/system/json/blank.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.patterns)) {
        throw new Error("Invalid JSON format: patterns missing");
      }

      patterns = data.patterns;
      console.log("Loaded patterns:", patterns);

      init(); // start logic only after patterns load
    })
    .catch(error => {
      console.error("Failed to load blank.json:", error);
    });

  function init() {

    function matchesProject(url) {
      return patterns.some(p => url.startsWith(p));
    }

    async function fetchPageTitle(url) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const match = text.match(/<title>(.*?)<\/title>/i);
        return match ? match[1] : url;
      } catch {
        return url;
      }
    }

    async function openProject(url) {
      const win = window.open("about:blank");

      const title = await fetchPageTitle(url);

      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin:0; overflow:hidden; background:black; }
            embed {
              position:absolute;
              top:0;
              left:0;
              width:100vw;
              height:100vh;
              border:none;
            }
          </style>
        </head>
        <body>
          <embed src="${url}">
        </body>
        </html>
      `);

      win.document.close();
    }

    document.addEventListener("click", e => {
      const a = e.target.closest("a");
      if (!a || !a.href) return;

      if (matchesProject(a.href)) {
        e.preventDefault();
        openProject(a.href);
      }
    });

    const originalOpen = window.open;
    window.open = function (url, ...rest) {
      if (typeof url === "string" && matchesProject(url)) {
        openProject(url);
        return null;
      }
      return originalOpen.call(window, url, ...rest);
    };
  }

})();
