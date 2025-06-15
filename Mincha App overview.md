This is an overview of the mincha App.

It will be constructed as a standalone website that will eventually be turned into a pwa.
It will be built in html, css, and javascript only.
It will be hosted eventually on github pages.

It will require: Right-to-left (RTL) layout support for Hebrew.


To create an expandable prayer app to include Jewish prayer services. 
It will begin with Mincha. 
The Mincha files are constructed with schema and text files.

There will be an index.html page that will be the home of this app that will include a header, a body with menu options, and a footer.

There will be a service page that will automatically generate the service from the url information provided by the menu options on the index page. 
    Something like: ?service=mincha
    data will be gotten via fetch()

The service page will have a header with a variety of menu options including: a back button, font size buttons.
The service page will automatically generate the service with a service heading, followed by a prayer heading and then each prayer. This will be derived from the schema with notation like: service.prayer.line based on the schema.

The first version of the mincha app will be primarily in Hebrew.

The design of the app will be sleek and modern and use my color branding.
The primary color will be: #5a819e
Other colors will include: #6ec3c0, #7c7aa1, #f67e7d

Flow outline for service.html which will be a function in javascript
1. On page load:
    → Extract service name from URL (e.g., "mincha")
    → Fetch schema JSON (e.g., `mincha-schema.json`)
    → Fetch corresponding text JSON (e.g., `mincha-text.json`)

2. Iterate through schema.nodes:
    → For each prayer:
        - Get the key (e.g., "Ashrei")
        - Use key to access matching text from text JSON
        - Generate HTML:
            - <h2>Prayer Name</h2>
            - <p>Line 1</p>
            - <p>Line 2</p>

Planned File structure

/data
    mincha_schema.json
    mincha_text.json
/scripts/
    service.js
    index.js
    fontsizing.js
styles/
    main.css





Future versions might include:
   Other prayer services with schema
   Transliteration or translation toggle
   Commentary functionality
   Specific word/phrase highlighting.
   Minyan toggle functionality (first version set to hide minyan content)


