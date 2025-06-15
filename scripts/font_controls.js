// scripts/font_controls.js

let fontScale = 1.0;
// Initialize the CSS variable
document.documentElement.style.setProperty('--font-scale', fontScale);

function changeFontSize(multiplier) {
  fontScale *= multiplier;
  document.documentElement.style.setProperty('--font-scale', fontScale);
  console.log("Updated font scale to:", fontScale);  // ✅ Add this line here
}
