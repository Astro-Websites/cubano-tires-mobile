// Tina's dashed outline sits outside the element, so photos inside rounded cards
// (overflow: hidden) hid it. Draw it inside images and add a hover wash so every
// replaceable image shows as clickable in the visual editor.
export const IMAGE_EDIT_CSS = `
  .__tina-quick-editing-enabled img[data-tina-field] { outline-offset: -4px; }
  .__tina-quick-editing-enabled img[data-tina-field]:hover { outline-offset: -4px; opacity: 0.75; cursor: pointer; }
  .__tina-quick-editing-enabled [style*="url("][data-tina-field] { outline-offset: -4px; }
`;
export function addImageEditStyles() {
  if (document.getElementById('cubano-image-edit-css')) return;
  const style = document.createElement('style');
  style.id = 'cubano-image-edit-css';
  style.textContent = IMAGE_EDIT_CSS;
  document.head.append(style);
}
