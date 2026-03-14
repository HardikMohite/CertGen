/**
 * Supported anchors:
 * - left: x is the start (default canvas behavior)
 * - center: x is the center point
 * - right: x is the end point
 */
export function calculateAnchoredX(x, textWidth, anchor = "center") {
  if (anchor === "center") return x - textWidth / 2;
  if (anchor === "right") return x - textWidth;
  return x;
}

/**
 * Basic word-wrapping helper.
 * Returns an array of lines which each fit within maxWidth.
 */
export function wrapText(ctx, text, maxWidth) {
  const raw = String(text ?? "").trim();
  if (!raw) return [""];

  // Fast-path for no wrapping needed
  if (ctx.measureText(raw).width <= maxWidth) return [raw];

  const words = raw.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [raw];
}
