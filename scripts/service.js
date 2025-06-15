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

    console.log("Highlights loaded:", serviceHighlights);

schema.nodes.forEach((node) => {
  const key = node.key;
  const title = node.titles?.find((t) => t.lang === "en")?.text || key;
  const prayerData = text.text[key];
  const nodeHighlights = serviceHighlights?.[key];
  console.log(`Rendering section: ${key}`, nodeHighlights);

  const section = document.createElement("section");
  const heading = document.createElement("h2");
  heading.textContent = title;
  heading.setAttribute("dir", "ltr");
  section.appendChild(heading);

  if (Array.isArray(prayerData)) {
    console.log(`Flat array block: ${key}`);
    prayerData.forEach((line, idx) => {
      const highlight = nodeHighlights?.[idx];
      console.log(`Line ${idx}:`, highlight);
      const p = document.createElement("p");
      p.className = "hebrew-line";
      p.innerHTML = applyHighlights(line, highlight, key, idx);
      section.appendChild(p);
    });
  } else if (typeof prayerData === "object") {
    Object.entries(prayerData).forEach(([subkey, block]) => {
      const subHighlights = nodeHighlights?.[subkey];
      console.log(`Subsection: ${subkey}`, subHighlights);

      if (Array.isArray(block) && typeof block[0] === "string") {
        block.forEach((line, i) => {
          const p = document.createElement("p");
          p.className = "hebrew-line";
          p.innerHTML = applyHighlights(line, subHighlights?.[i], `${key}/${subkey}`, i);
          section.appendChild(p);
        });
      } else if (Array.isArray(block) && Array.isArray(block[0])) {
        block.forEach((group, groupIdx) => {
          group.forEach((line, lineIdx) => {
            const h = subHighlights?.[groupIdx]?.[lineIdx];
            console.log(`Amidah line [${groupIdx}][${lineIdx}]:`, h);
            const p = document.createElement("p");
            p.className = "hebrew-line";
            p.innerHTML = applyHighlights(line, h, `${key}/${subkey}`, `${groupIdx}-${lineIdx}`);
            section.appendChild(p);
          });
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

function applyHighlights(line, highlights, contextKey, lineKey) {
  if (!Array.isArray(highlights) || highlights.length === 0) {
    return line;
  }

  console.log(`Applying highlights for ${contextKey} line ${lineKey}:`, highlights);

  let result = line;
  highlights.forEach((phrase) => {
    const safe = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(safe, "g");
    result = result.replace(
      regex,
      `<span class="highlight">${phrase}</span>`
    );
  });
  return result;
}
