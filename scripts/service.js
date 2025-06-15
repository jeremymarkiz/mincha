document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceName = urlParams.get("service");

  if (!serviceName) {
    console.error("Missing service parameter in URL.");
    document.getElementById("service-content").innerHTML = "<p dir='ltr'>Missing service name in URL.</p>";
    return;
  }

  const schemaScript = document.createElement("script");
  schemaScript.type = "application/json";
  schemaScript.id = "dynamic-schema";
  schemaScript.src = `data/${serviceName}_schema.json`;

  const textScript = document.createElement("script");
  textScript.type = "application/json";
  textScript.id = "dynamic-text";
  textScript.src = `data/${serviceName}_text.json`;

  let schemaLoaded = false;
  let textLoaded = false;
  let schemaData, textData;

  schemaScript.onload = () => {
    try {
      schemaData = JSON.parse(schemaScript.textContent || "{}");
      schemaLoaded = true;
      tryRender();
    } catch (e) {
      console.error("Error parsing schema JSON:", e);
      failRender();
    }
  };

  textScript.onload = () => {
    try {
      textData = JSON.parse(textScript.textContent || "{}");
      textLoaded = true;
      tryRender();
    } catch (e) {
      console.error("Error parsing text JSON:", e);
      failRender();
    }
  };

  schemaScript.onerror = () => {
    console.error("Failed to load schema script.");
    failRender();
  };

  textScript.onerror = () => {
    console.error("Failed to load text script.");
    failRender();
  };

  function tryRender() {
    if (!schemaLoaded || !textLoaded) return;

    const schema = schemaData;
    const text = textData;

    const englishTitle = schema.titles?.find(t => t.lang === "en")?.text || serviceName;
    document.title = englishTitle;

    const contentEl = document.getElementById("service-content");

    schema.nodes.forEach(node => {
      const key = node.key;
      const title = node.titles?.find(t => t.lang === "en")?.text || key;
      const prayerData = text.text[key];

      const section = document.createElement("section");

      const heading = document.createElement("h2");
      heading.textContent = title;
      heading.setAttribute("dir", "ltr");
      section.appendChild(heading);

      if (Array.isArray(prayerData)) {
        prayerData.forEach(line => {
          const p = document.createElement("p");
          p.textContent = line;
          p.setAttribute("dir", "rtl");
          section.appendChild(p);
        });
      } else if (typeof prayerData === "object") {
        Object.entries(prayerData).forEach(([subkey, value]) => {
          const subheading = document.createElement("h3");
          subheading.textContent = subkey;
          subheading.setAttribute("dir", "ltr");
          section.appendChild(subheading);

          if (Array.isArray(value)) {
            value.forEach(line => {
              const p = document.createElement("p");
              p.textContent = line;
              p.setAttribute("dir", "rtl");
              section.appendChild(p);
            });
          } else if (Array.isArray(value[0])) {
            value.forEach(blessing => {
              blessing.forEach(line => {
                const p = document.createElement("p");
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
  }

  function failRender() {
    document.getElementById("service-content").innerHTML = "<p dir='ltr'>Failed to load service data.</p>";
  }

  document.body.appendChild(schemaScript);
  document.body.appendChild(textScript);
});
