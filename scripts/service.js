// scripts/service.js

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const serviceName = params.get("service");            // “mincha”
  if (!serviceName) {
    console.error("Missing service parameter in URL.");
    document.getElementById("service-content").innerHTML =
      "<p dir='ltr'>Missing service name in URL.</p>";
    return;
  }
  renderService(serviceName.toLowerCase());
});

async function renderService(serviceKey) {
  const [schemaRes, textRes, hlRes] = await Promise.all([
    fetch(`data/${serviceKey}_schema.json`),
    fetch(`data/${serviceKey}_text.json`),
    fetch(`data/highlights.json`),
  ]);
  if (!schemaRes.ok || !textRes.ok || !hlRes.ok) {
    console.error("Failed to load JSON files");
    return;
  }

  const schema = await schemaRes.json();
  const text   = await textRes.json();
  const hldata = await hlRes.json();

  // look up highlights by lower‐case serviceKey
  const highlights = hldata[serviceKey] || {};

  // set document title
  const englishTitle =
    schema.titles?.find(t => t.lang === "en")?.text ||
    serviceKey;
  document.title = englishTitle;

  const container = document.getElementById("service-content");
  container.innerHTML = "";

  // render each section
  schema.nodes.forEach(node => {
    const key       = node.key;         // e.g. "Ashrei", "Amidah"
    const sectionHl = highlights[key] || {};

    // section wrapper
    const section = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = node.titles?.find(t => t.lang==="en")?.text || key;
    h2.setAttribute("dir", "ltr");
    section.appendChild(h2);

    const data = text.text[key];

    // flat array of lines
    if (Array.isArray(data)) {
      data.forEach((line, i) => {
        const p = document.createElement("p");
        p.className = "hebrew-line";
        const hl = sectionHl[i] || [];
        p.innerHTML = applyHighlights(line, hl);
        section.appendChild(p);
      });

    // nested object (e.g. Amidah.introduction or Amidah.blessings)
    } else if (typeof data === "object") {
      Object.entries(data).forEach(([subkey, block]) => {
        const subHl = sectionHl[subkey] || [];

        // 1D sub‐array
        if (Array.isArray(block) && typeof block[0] === "string") {
          block.forEach((line, i) => {
            const p = document.createElement("p");
            p.className = "hebrew-line";
            const hl = subHl[i] || [];
            p.innerHTML = applyHighlights(line, hl);
            section.appendChild(p);
          });

        // 2D sub‐array (blessings)
        } else if (
          Array.isArray(block) &&
          Array.isArray(block[0])
        ) {
          block.forEach((group, gi) => {
            group.forEach((line, li) => {
              const p = document.createElement("p");
              p.className = "hebrew-line";
              const hl = (subHl[gi]||[])[li] || [];
              p.innerHTML = applyHighlights(line, hl);
              section.appendChild(p);
            });
            // divider between blessings
            section.appendChild(document.createElement("hr"));
          });
        }
      });
    }

    container.appendChild(section);
  });
}

function applyHighlights(line, phrases=[]) {
  if (!phrases.length) return line;

  console.log("Highlighting:", phrases, "in →", line);
  return phrases.reduce((text, phrase) => {
    const safe = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const re   = new RegExp(safe, "g");
    return text.replace(
      re,
      `<span class="highlight">${phrase}</span>`
    );
  }, line);
}
