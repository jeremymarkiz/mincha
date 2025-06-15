// scripts/font_controls.js

let fontScale = 1.0;
let currentService = null; // will be set externally

function changeFontSize(multiplier) {
  fontScale *= multiplier;
  if (typeof renderService === 'function' && currentService) {
    renderService(currentService);
  } else {
    console.warn("renderService or currentService not defined yet");
  }
}
