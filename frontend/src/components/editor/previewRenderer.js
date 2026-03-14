/**
 * Optional canvas preview renderer.
 *
 * If you ever switch back to client-side preview, use this helper.
 */
export function buildCanvasFont({ fontWeight = "normal", fontStyle = "normal", fontSize = 48, fontFamily = "Georgia" }) {
  const parts = [];
  if (fontWeight === "bold") parts.push("bold");
  if (fontStyle === "italic") parts.push("italic");
  parts.push(`${fontSize}px`);
  parts.push(`"${fontFamily}"`);
  return parts.join(" ");
}
