// scripts/service.js

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const rawService = params.get('service');
  const serviceKey = rawService ? rawService.toLowerCase() : null;

  if (!serviceKey) {
    console.error("Missing service parameter in URL.");
    document.getElementById("service-content").innerHTML =
      "<p dir='ltr'>Missing service name in URL.</p>";
    return;
  }

  renderService(serviceKey);
});

async function renderService(serviceKey) {
  const contentEl = document.getElementById("service-content");
  const schemaPath    = `data/${serviceKey}_schema.json`;
  const textPath      = `data/${serviceKey}_text.json`;
  const highlightsPath= `data/highlights.json`;

  try {
    const [schemaRes, textRes, hlRes] = await Promise.all([
      fetch(schemaPath),
      fetch(textPath),
      fetch(highlightsPath),
    ]);
    if (!schemaRes.ok || !textRes.ok || !hlRes.ok) {
      throw new Error("Failed to load JSON files.");
    }

    const schema = await schemaRes.json();
    const text   = await textRes.json();
    const hldata = await hlRes.json();

    // grab just this service’s highlights, or empty object if none
    const rawHl = hldata[serviceKey] || {};

    // normalize section keys to lower-case for lookup
    const highlights = {};
    Object.entries(rawHl).forEach(([sect, val]) => {
      highlights[sect.toLowerCase()] = val;
    });

    // set page title from schema
    const titleEn =
      schema.titles?.find(t => t.lang==="en")?.text ||
      serviceKey;
    document.title = titleEn;

    // clear old content
    contentEl.innerHTML = "";

    // walk each node (e.g. Ashrei, Amidah, etc)
    schema.nodes.forEach(node => {
      const key      = node.key;             // e.g. "Ashrei"
      const keyLower = key.toLowerCase();    // "ashrei"
      const sectionHl= highlights[keyLower] || {};

      // build section
      const section = document.createElement("section");
      const h2      = document.createElement("h2");
      h2.textContent = node.titles?.find(t=>t.lang==="en")?.text || key;
      h2.setAttribute("dir","ltr");
      section.appendChild(h2);

      const data = text.text[key];

      // flat array of lines
      if (Array.isArray(data)) {
        data.forEach((line, idx) => {
          const p  = document.createElement("p");
          p.className = "hebrew-line";
          const hl = Array.isArray(sectionHl[idx]) ? sectionHl[idx] : [];
          p.innerHTML = applyHighlights(line, hl);
          section.appendChild(p);
        });

      // nested object (e.g. Amidah.introduction, Amidah.blessings, Amidah.conclusion)
      } else if (typeof data === "object") {
        Object.entries(data).forEach(([subkey, block]) => {
          const subHlRaw = sectionHl[subkey.toLowerCase()] || {};

          // 1D block of strings
          if (Array.isArray(block) && typeof block[0] === "string") {
            block.forEach((line, i) => {
              const p = document.createElement("p");
              p.className = "hebrew-line";
              const hl = Array.isArray(subHlRaw[i]) ? subHlRaw[i] : [];
              p.innerHTML = applyHighlights(line, hl);
              section.appendChild(p);
            });

          // 2D block (like Amidah.blessings: [ [line, line], [line, line]... ])
          } else if (
            Array.isArray(block) &&
            Array.isArray(block[0])
          ) {
            block.forEach((group, gi) => {
              group.forEach((line, li) => {
                const p = document.createElement("p");
                p.className = "hebrew-line";
                const grpHl = subHlRaw[gi] || [];
                const hl    = Array.isArray(grpHl[li]) ? grpHl[li] : [];
                p.innerHTML = applyHighlights(line, hl);
                section.appendChild(p);
              });
            });
          }
        });
      }

      contentEl.appendChild(section);
    });
  } catch (err) {
    console.error("Error loading service:", err);
    document.getElementById("service-content").innerHTML =
      "<p dir='ltr'>Error loading service content. See console for details.</p>";
  }
}

/**
 * Wrap each matching phrase in a <span class="highlight">…</span>.
 * Safe‐guards against undefined or empty arrays.
 */
function applyHighlights(line, phrases = []) {
  if (!Array.isArray(phrases) || phrases.length === 0) return line;
  let result = line;
  phrases.forEach(phrase => {
    const esc   = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(esc, 'g');
    result = result.replace(
      regex,
      `<span class="highlight">${phrase}</span>`
    );
  });
  return result;
}
