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
  const contentEl = document.getElementById("service-content");

  console.log(`Fetching: ${schemaPath}, ${textPath}`);

  try {
    const [schemaRes, textRes] = await Promise.all([
      fetch(schemaPath),
      fetch(textPath),
    ]);

    if (!schemaRes.ok || !textRes.ok) {
      throw new Error(
        `Fetch failed. Schema: ${schemaRes.status}, Text: ${textRes.status}`
      );
    }

    const schema = await schemaRes.json();
    const text = await textRes.json();

    const englishTitle =
      schema.titles?.find((t) => t.lang === "en")?.text || serviceName;
    document.title = englishTitle;

    contentEl.innerHTML = ""; // Clear previous content

    schema.nodes.forEach((node) => {
      const key = node.key;
      const title = node.titles?.find((t) => t.lang === "en")?.text || key;
      const prayerData = text.text[key];

      const section = document.createElement("section");

      // English heading
      const heading = document.createElement("h2");
      heading.textContent = title;
      heading.setAttribute("dir", "ltr");
      section.appendChild(heading);

      if (Array.isArray(prayerData)) {
        // Single paragraph block
        prayerData.forEach((line) => {
          const p = document.createElement("p");
          p.classList.add("hebrew-line");
          p.textContent = line;
          p.setAttribute("dir", "rtl");
          section.appendChild(p);
        });
      } else if (typeof prayerData === "object") {
        // Labeled subsections
        Object.entries(prayerData).forEach(([subkey, value]) => {
          const subheading = document.createElement("h3");
          subheading.textContent = subkey;
          subheading.setAttribute("dir", "ltr");
          section.appendChild(subheading);

          if (Array.isArray(value)) {
            value.forEach((line) => {
              const p = document.createElement("p");
              p.classList.add("hebrew-line");
              p.textContent = line;
              p.setAttribute("dir", "rtl");
              section.appendChild(p);
            });
          } else if (Array.isArray(value[0])) {
            value.forEach((blessing) => {
              blessing.forEach((line) => {
                const p = document.createElement("p");
                p.classList.add("hebrew-line");
                p.textContent = line;
                p.setAttribute("dir", "rtl");
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
