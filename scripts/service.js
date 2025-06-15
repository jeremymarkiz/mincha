// scripts/service.js

let rawService = null;

document.addEventListener("DOMContentLoaded", () => {
  rawService = new URLSearchParams(window.location.search).get("service");
  if (!rawService) {
    console.error("Missing service parameter in URL.");
    document.getElementById("service-content").innerHTML =
      "<p dir='ltr'>Missing service name in URL.</p>";
    return;
  }
  // for file names, we lowercase; for highlights lookup we try both
  const serviceKey = rawService.toLowerCase();
  renderService(serviceKey, rawService);
});

async function renderService(serviceKey, rawKey) {
  const schemaPath     = `data/${serviceKey}_schema.json`;
  const textPath       = `data/${serviceKey}_text.json`;
  const highlightsPath = `data/highlights.json`;
  const contentEl      = document.getElementById("service-content");

  try {
    const [schemaRes, textRes, hlRes] = await Promise.all([
      fetch(schemaPath),
      fetch(textPath),
      fetch(highlightsPath),
    ]);

    if (!schemaRes.ok || !textRes.ok || !hlRes.ok) {
      throw new Error("Failed to load one or more JSON files.");
    }

    const schema    = await schemaRes.json();
    const textJson  = await textRes.json();
    const highlightsJson = await hlRes.json();

    // look up highlights by rawKey (capitalized) or by lowercased serviceKey
    const serviceHighlights =
      highlightsJson[rawKey] || highlightsJson[serviceKey] || {};

    // set page title
    const englishTitle =
      schema.titles?.find(t => t.lang === "en")?.text || rawKey;
    document.title = englishTitle;

    // clear previous
    contentEl.innerHTML = "";

    // render each top-level node
    schema.nodes.forEach(node => {
      const key       = node.key;  // e.g. "Ashrei", "Amidah"
      const title     = node.titles?.find(t => t.lang==="en")?.text || key;
      const prayerData= textJson.text[key];
      const nodeHls   = serviceHighlights[key] || {};

      // section wrapper
      const section = document.createElement("section");
      const h2 = document.createElement("h2");
      h2.textContent = title;
      h2.setAttribute("dir", "ltr");
      section.appendChild(h2);

      if (Array.isArray(prayerData)) {
        // 1D array of lines
        prayerData.forEach((line, idx) => {
          const p = document.createElement("p");
          p.className = "hebrew-line";
          const hl = nodeHls[idx] || [];
          p.innerHTML = applyHighlights(line, hl);
          section.appendChild(p);
        });

      } else if (typeof prayerData === "object") {
        // nested object: e.g. Amidah.introduction (1D) or Amidah.blessings (2D)
        Object.entries(prayerData).forEach(([subkey, block]) => {
          const subHls = nodeHls[subkey] || [];

          if (Array.isArray(block) && typeof block[0] === "string") {
            // 1D block
            block.forEach((line, i) => {
              const p = document.createElement("p");
              p.className = "hebrew-line";
              const hl = subHls[i] || [];
              p.innerHTML = applyHighlights(line, hl);
              section.appendChild(p);
            });

          } else if (Array.isArray(block) && Array.isArray(block[0])) {
            // 2D block (blessings → [ [line,line], [line,line], ... ])
            block.forEach((group, gIdx) => {
              group.forEach((line, lIdx) => {
                const p = document.createElement("p");
                p.className = "hebrew-line";
                const hl = (subHls[gIdx]||[])[lIdx] || [];
                p.innerHTML = applyHighlights(line, hl);
                section.appendChild(p);
              });
              // divider between blessings
              section.appendChild(document.createElement("hr"));
            });
          }
        });
      }

      contentEl.appendChild(section);
    });

  } catch (err) {
    console.error("Error loading service:", err);
    contentEl.innerHTML =
      "<p dir='ltr'>Error loading service content. See console for details.</p>";
  }
}

function applyHighlights(line, highlights=[]) {
  if (!Array.isArray(highlights) || highlights.length === 0) return line;
  return highlights.reduce((text, phrase) => {
    const esc = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    return text.replace(new RegExp(esc, "g"), `<span class="highlight">${phrase}</span>`);
  }, line);
}
