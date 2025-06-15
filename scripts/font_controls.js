// scripts/font_controls.js

let fontScale = 1.0;
let currentService = null; // shared with service.js if needed

// Initialize the CSS variable
document.documentElement.style.setProperty('--font-scale', fontScale);

function changeFontSize(multiplier) {
  fontScale *= multiplier;
  document.documentElement.style.setProperty('--font-scale', fontScale);
}