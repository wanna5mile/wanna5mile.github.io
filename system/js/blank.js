
(function () {

fetch("system/json/blank.json")
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("Fetched JSON:", data);
    // do something with data here
  })
  .catch(error => {
    console.error("Failed to fetch JSON:", error);
  });

  // Checks if a URL matches your project structure
  function matchesProject(url) {
    return patterns.some(p => url.startsWith(p));
  }

  // Fetch the <title> from the target page
  async function fetchPageTitle(url) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const match = text.match(/<title>(.*?)<\/title>/i);
      return match ? match[1] : url;
    } catch {
      return url; // fallback
    }
  }

  // Opens the project inside a new fullscreen about:blank tab using an <embed>
  async function openProject(url) {
    const win = window.open("about:blank");

    // Fetch title before writing HTML
    const title = await fetchPageTitle(url);

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { margin:0; overflow:hidden; }
          embed { position:absolute; top:0; left:0; width:100vw; height:100vh; border:none; }
        </style>
      </head>
      <body>
        <embed src="${url}">
      </body>
      </html>
    `);

    win.document.close();
  }

  // Intercept clicks on <a> elements
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a || !a.href) return;

    const url = a.href;

    if (matchesProject(url)) {
      e.preventDefault();
      openProject(url);
    }
  });

  // Intercept calls to window.open in JS
  const originalOpen = window.open;
  window.open = function (url, ...rest) {
    if (typeof url === "string" && matchesProject(url)) {
      openProject(url);
      return null;
    }
    return originalOpen.call(window, url, ...rest);
  };

})();
