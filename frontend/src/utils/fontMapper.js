/**
 * Transform flat GET /fonts list to a family->style->url map.
 *
 * Input item example:
 * { label, file, path, family, style }
 */
function _stripLabelSuffix(family) {
  if (!family || typeof family !== "string") return family;
  return family
    .replace(/\s*\((Regular|Bold|Italic|Bold\s+Italic)\)\s*$/i, "")
    .trim();
}

function _deriveFromFileOrUrl(fileOrUrl) {
  const parts = String(fileOrUrl || "").replaceAll("\\", "/").split("/");
  if (parts.length < 2) return { family: null, style: null };

  const family = parts.at(-2) || null;
  const filename = parts.at(-1) || "";
  const stem = filename.split(".")[0] || null;

  return { family, style: stem ? stem.toLowerCase() : null };
}

export function mapFontsByFamily(fontList = []) {
  const out = {};

  for (const f of fontList) {
    const url = f?.path;
    if (!url) continue;

    let family = f?.family || null;
    let style = (f?.style || "regular").toLowerCase();

    if (!family) {
      const derived = _deriveFromFileOrUrl(f?.file || url);
      family = derived.family || f?.label || "Georgia";
      style = (f?.style || derived.style || "regular").toLowerCase();
    }

    family = _stripLabelSuffix(family);
    if (!family) continue;

    if (!out[family]) out[family] = {};
    out[family][style] = url;
    if (!out[family].regular) out[family].regular = url;
  }

  return out;
}

export function resolveFontUrl(fontMap, family, weight, style) {
  const fam = fontMap?.[family];
  if (!fam) return null;

  const isBold = weight === "bold";
  const isItalic = style === "italic";

  if (isBold && isItalic) return fam.bold_italic || fam.boldItalic || fam.bold || fam.italic || fam.regular;
  if (isBold) return fam.bold || fam.regular;
  if (isItalic) return fam.italic || fam.regular;
  return fam.regular || fam.bold || fam.italic || fam.bold_italic;
}
