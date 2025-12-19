(function () {

  let patterns = [];

  fetch("/system/json/blank.json")
    .then(r => {
      if (!r.ok) throw new Error("Failed to load JSON");
      return r.json();
    })
    .then(data => {
      if (!Array.isArray(data.patterns)) {
        throw new Error("patterns missing in JSON");
      }

      patterns = data.patterns;
      console.log("Patterns loaded:", patterns);

      init(); // only start AFTER patterns exist
    })
    .catch(err => console.error(err));

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
        <!doctype html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin:0; overflow:hidden; background:black; }
            embed {
              position:absolute;
              inset:0;
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
      if (!a?.href) return;

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
