const loadedFonts = new Map();

function isValidFontUrl(url) {
  if (typeof url !== "string") return false;
  const clean = url.split("?")[0].split("#")[0];
  return clean.toLowerCase().endsWith(".ttf") || clean.toLowerCase().endsWith(".otf");
}

function toAbsoluteFontUrl(url) {
  if (!url) return url;

  // Already absolute
  if (/^https?:\/\//i.test(url)) return url;

  // Prefer same-origin so Vite dev proxy can handle it (avoids CORS).
  // Backend font files are mounted under /static/fonts and should be reachable
  // via the dev server proxy (or direct same-origin in production).
  if (url.startsWith("/")) return url;

  // If it's a relative path without a leading slash, optionally prefix API base
  const base = import.meta?.env?.VITE_API_URL;
  if (base && base.trim()) return `${base.replace(/\/$/, "")}/${url}`;

  return `/${url}`;
}

/**
 * Load a font via the FontFace API and cache by URL.
 *
 * @param {string} family CSS font-family name
 * @param {string} url Absolute or relative URL to the font file
 */
export async function loadFont(family, url) {
  if (!family || !url) return;

  // Never attempt to decode zip/unknown files.
  if (!isValidFontUrl(url)) return;

  const resolvedUrl = toAbsoluteFontUrl(url);
  if (!resolvedUrl) return;

  if (loadedFonts.has(resolvedUrl)) return;

  try {
    const font = new FontFace(family, `url(${resolvedUrl})`);
    await font.load();
    document.fonts.add(font);
    loadedFonts.set(resolvedUrl, true);
  } catch (err) {
    // Swallow decode/network errors; caller can fallback to Georgia.
    // Keep cache negative? No: allow retry after upload/refresh.
    // eslint-disable-next-line no-console
    console.warn("Font load failed", { family, url: resolvedUrl, err });
  }
}

export function isFontLoaded(url) {
  const resolvedUrl = toAbsoluteFontUrl(url);
  return loadedFonts.has(resolvedUrl);
}
