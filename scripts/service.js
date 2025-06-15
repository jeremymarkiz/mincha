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

function applyHighlights(text, highlightWords = []) {
  let result = text;
  highlightWords.forEach(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    result = result.replace(regex, `<mark>${word}</mark>`);
  });
  return result;
}

async function renderService(serviceName) {
  const schemaPath = `data/${serviceName}_schema.json`;
  const textPath = `data/${serviceName}_text.json`;
  const highlightsPath = `data/highlights.json`;

  const contentEl = document.getElementById("service-content");

  try {
    const [schemaRes, textRes, highlightsRes] = await Promise.all([
      fetch(schemaPath),
      fetch(textPath),
      fetch(highlightsPath)
    ]);

    if (!schemaRes.ok || !textRes.ok || !highlightsRes.ok) {
      throw new Error("One or more fetches failed.");
    }

    const schema = await schemaRes.json();
    const text = await textRes.json();
    const highlightsData = await highlightsRes.json();
    const highlights = highlightsData[serviceName] || {};

    const englishTitle =
      schema.titles?.find((t) => t.lang === "en")?.text || serviceName;
    document.title = englishTitle;

    contentEl.innerHTML = "";

    schema.nodes.forEach((node) => {
      const key = node.key;
      const title = node.titles?.find((t) => t.lang === "en")?.text || key;
      const prayerData = text.text[key];

      const section = document.createElement("section");

      const heading = document.createElement("h2");
      heading.textContent = title;
      heading.setAttribute("dir", "ltr");
      section.appendChild(heading);

      if (Array.isArray(prayerData)) {
        prayerData.forEach((line, lineIndex) => {
          const p = document.createElement("p");
          p.className = "hebrew-line";

          const highlightList = highlights?.[key]?.[lineIndex] || [];
          p.innerHTML = applyHighlights(line, highlightList);

          section.appendChild(p);
        });
      } else if (typeof prayerData === "object") {
        Object.entries(prayerData).forEach(([subkey, value]) => {
          const subheading = document.createElement("h3");
          subheading.textContent = subkey;
          subheading.setAttribute("dir", "ltr");
          section.appendChild(subheading);

          if (Array.isArray(value)) {
            value.forEach((line, lineIndex) => {
              const p = document.createElement("p");
              p.className = "hebrew-line";

              const highlightList =
                highlights?.[key]?.[subkey]?.[lineIndex] ||
                highlights?.[key]?.[lineIndex] || [];

              p.innerHTML = applyHighlights(line, highlightList);
              section.appendChild(p);
            });
          } else if (Array.isArray(value[0])) {
            value.forEach((blessing, bIndex) => {
              blessing.forEach((line, lineIndex) => {
                const p = document.createElement("p");
                p.className = "hebrew-line";

                const highlightList =
                  highlights?.[key]?.[subkey]?.[bIndex]?.[lineIndex] ||
                  [];

                p.innerHTML = applyHighlights(line, highlightList);
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
