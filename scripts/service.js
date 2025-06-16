// scripts/service.js

// when the page loads…
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const serviceParam = params.get("service");
  if (!serviceParam) {
    document.getElementById("service-content").innerHTML =
      "<p dir='ltr'>Missing service name in URL.</p>";
    return;
  }
  renderService(serviceParam.toLowerCase());
});

async function renderService(serviceName) {
  const [schemaRes, textRes, highlightsRes] = await Promise.all([
    fetch(`data/${serviceName}_schema.json`),
    fetch(`data/${serviceName}_text.json`),
    fetch(`data/highlights.json`)
  ]);

  if (!schemaRes.ok || !textRes.ok || !highlightsRes.ok) {
    console.error("Failed to load JSON files");
    return;
  }

  const schema     = await schemaRes.json();
  const textData   = await textRes.json();
  const allHl      = await highlightsRes.json();
  const myHighlights = allHl[serviceName] || {};

  // set page title from the English title in schema
  const englishTitle = schema.titles?.find(t => t.lang === "en")?.text;
  if (englishTitle) document.title = englishTitle;

  const container = document.getElementById("service-content");
  container.innerHTML = "";

  // walk through each node in the schema
  schema.nodes.forEach(node => {
    const key = node.key.toLowerCase();
    const title = node.titles?.find(t => t.lang === "en")?.text || node.key;
    const sectionData = textData.text[key];
    const sectionHl   = myHighlights[key] || {};

    // build a section wrapper
    const sectionEl = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = title;
    h2.setAttribute("dir", "ltr");
    sectionEl.appendChild(h2);

    // flat array of strings?  e.g. Ashrei, Kaddish…
    if (Array.isArray(sectionData)) {
      sectionData.forEach((line, idx) => {
        const p = document.createElement("p");
        p.className = "hebrew-line";
        p.innerHTML = applyHighlights(line, sectionHl[idx]);
        sectionEl.appendChild(p);
      });

    } else if (typeof sectionData === "object") {
      // subsections: introduction, blessings, conclusion…
      Object.entries(sectionData).forEach(([subkey, block]) => {
        const subHl = sectionHl[subkey] || {};

        // 1D array of strings
        if (Array.isArray(block) && typeof block[0] === "string") {
          block.forEach((line, i) => {
            const p = document.createElement("p");
            p.className = "hebrew-line";
            p.innerHTML = applyHighlights(line, subHl[i]);
            sectionEl.appendChild(p);
          });

        // 2D array (e.g. Amidah blessings)
        } else if (Array.isArray(block) && Array.isArray(block[0])) {
          block.forEach((group, gi) => {
            group.forEach((line, li) => {
              const p = document.createElement("p");
              p.className = "hebrew-line";
              p.innerHTML = applyHighlights(
                line,
                (subHl[gi] || [])[li]
              );
              sectionEl.appendChild(p);
            });
            sectionEl.appendChild(document.createElement("hr"));
          });
        }
      });
    }

    container.appendChild(sectionEl);
  });
}

// highlight any of the phrases in `hlArray` inside of `line`
function applyHighlights(line, hlArray) {
  if (!Array.isArray(hlArray) || !hlArray.length) {
    return line;
  }
  let html = line;
  hlArray.forEach(phrase => {
    const esc = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    html = html.replace(
      new RegExp(esc, "g"),
      `<span class="highlight">${phrase}</span>`
    );
  });
  return html;
}
