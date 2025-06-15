let currentService = null;

function getFontScale() {
  const scale = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-scale")
    .trim();
  return scale ? parseFloat(scale) : 1.0;
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentService = urlParams.get("service");

  if (!currentService) {
    console.error("Missing service parameter in URL.");
    document.getElementById("service-content").innerHTML =
      "<p dir='ltr'>Missing service name in URL.</p>";
    return;
  }

  renderService(currentService);
});

async function renderService(serviceName) {
  const schemaPath = `data/${serviceName}_schema.json`;
  const textPath = `data/${serviceName}_text.json`;
  const highlightsPath = `data/highlights.json`;
  const contentEl = document.getElementById("service-content");

  try {
    const [schemaRes, textRes, highlightsRes] = await Promise.all([
      fetch(schemaPath),
      fetch(textPath),
      fetch(highlightsPath),
    ]);

    if (!schemaRes.ok || !textRes.ok || !highlightsRes.ok) {
      throw new Error("Failed to load one or more JSON files.");
    }

    const schema = await schemaRes.json();
    const text = await textRes.json();
    const highlights = await highlightsRes.json();

    const serviceHighlights = highlights[serviceName] || {};

    document.title =
      schema.titles?.find((t) => t.lang === "en")?.text || serviceName;

    contentEl.innerHTML = "";

    schema.nodes.forEach((node) => {
      const key = node.key;
      const title = node.titles?.find((t) => t.lang === "en")?.text || key;
      const prayerData = text.text[key];
      const nodeHighlights = serviceHighlights?.[key] || {};

      const section = document.createElement("section");
      const heading = document.createElement("h2");
      heading.textContent = title;
      heading.setAttribute("dir", "ltr");
      section.appendChild(heading);

      if (Array.isArray(prayerData)) {
        prayerData.forEach((line, idx) => {
          const p = document.createElement("p");
          p.className = "hebrew-line";
          p.style.fontSize = `calc(32px * ${getFontScale()})`;
          p.innerHTML = applyHighlights(line, nodeHighlights?.[idx]);
          section.appendChild(p);
        });
      } else if (typeof prayerData === "object") {
        Object.entries(prayerData).forEach(([subkey, block]) => {
          const subHighlights = nodeHighlights?.[subkey] || {};

          // 1D block
          if (Array.isArray(block) && typeof block[0] === "string") {
            block.forEach((line, i) => {
              const p = document.createElement("p");
              p.className = "hebrew-line";
              p.style.fontSize = `calc(32px * ${getFontScale()})`;
              p.innerHTML = applyHighlights(line, subHighlights?.[i]);
              section.appendChild(p);
            });
          }

          // 2D block (e.g. Amidah blessings)
          else if (Array.isArray(block) && Array.isArray(block[0])) {
            block.forEach((subBlock, blockIndex) => {
              subBlock.forEach((line, lineIndex) => {
                const p = document.createElement("p");
                p.className = "hebrew-line";
                p.style.fontSize = `calc(32px * ${getFontScale()})`;
                p.innerHTML = applyHighlights(
                  line,
                  subHighlights?.[blockIndex]?.[lineIndex]
                );
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
    contentEl.innerHTML =
      "<p dir='ltr'>Error loading service content. See console for details.</p>";
  }
}

function applyHighlights(line, highlights) {
  if (!highlights) return line;

  const phrases = Array.isArray(highlights) ? highlights : [highlights];

  let result = line;
  phrases.forEach((phrase) => {
    const safe = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(safe, "g");
    result = result.replace(
      regex,
      `<span class="highlight">${phrase}</span>`
    );
  });

  return result;
}
