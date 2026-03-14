// eslint-disable complexity
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Download,
  Eye,
  FileText,
  Sparkles,
  Bold,
  Italic,
} from "lucide-react";

import { Card, Button } from "../../ui/primitives";
import StepHeader from "../../ui/StepHeader";
import DropzoneField from "../../ui/DropzoneField";
import HexColorPicker from "../../ui/HexColorPicker";
import { useSession } from "../../hooks/useSession";

import {
  uploadTemplate,
  uploadCsv,
  uploadFont,
  previewCertificate,
  generateCertificates,
  downloadZip,
  getTemplateThumbnail,
  refreshFonts,
} from "../../services/api";

import CanvasEditor from "../editor/CanvasEditor";
import { pixelToPercent } from "../../utils/coordinateUtils";
import { loadFont } from "../../utils/fontLoader";
import { mapFontsByFamily, resolveFontUrl } from "../../utils/fontMapper";

const ACCEPT_TEMPLATE = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};
const ACCEPT_CSV = { "text/csv": [".csv"] };
const ACCEPT_FONT = {
  "font/ttf": [".ttf"],
  "font/otf": [".otf"],
  "application/x-font-ttf": [".ttf"],
  "application/x-font-opentype": [".otf"],
  "application/zip": [".zip"],
};

function isSessionNotFound(err) {
  const msg = err?.response?.data?.detail || err?.message || "";
  return (
    typeof msg === "string" &&
    msg.toLowerCase().includes("session") &&
    msg.toLowerCase().includes("not found")
  );
}

function safeReload() {
  globalThis.location?.reload?.();
}

function pickDefaultFamily(fontMap) {
  if (fontMap?.Georgia?.regular) return "Georgia";
  const families = Object.keys(fontMap || {});
  return families[0] || "Georgia";
}

function preloadRegularFonts(fontMap) {
  const families = Object.keys(fontMap || {});
  return Promise.all(
    families.map(async (fam) => {
      const url = fontMap?.[fam]?.regular;
      if (!url) return;
      try {
        await loadFont(fam, url);
      } catch {
        // ignore
      }
    })
  );
}

function formatError(prefix, err, fallback) {
  const detail = err?.response?.data?.detail;
  if (detail) return `${prefix}: ${detail}`;
  return fallback;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function GeneratorPage() {
  const { sessionId, loading: sessionLoading, error: sessionError } = useSession();

  const [templateFile, setTemplateFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [fontFile, setFontFile] = useState(null);

  // Missing core UI state
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [certTotal, setCertTotal] = useState(0);

  // Output expected by backend
  const [outputFormat, setOutputFormat] = useState("png");

  const [templateUrl, setTemplateUrl] = useState(null);
  const [textArea, setTextArea] = useState(null); // { x,y,width,height } in IMAGE px
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Font state (must be declared before any derived logic)
  const [fonts, setFonts] = useState([]);

  const [fontFamily, setFontFamily] = useState("Georgia");
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");

  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#4266DE");

  // Derived toggles expected by backend
  const bold = fontWeight === "bold";
  const italic = fontStyle === "italic";

  // Text anchor (frontend positioning)
  const [textAnchor, setTextAnchor] = useState("center"); // left | center | right

  // Optional sample value used only for on-canvas preview overlay
  const previewName = useMemo(() => {
    // Use quick sample; avoids CSV parsing changes.
    return "ALEXANDER CHRISTOPHER WILLIAMSON";
  }, []);

  const fontMap = useMemo(() => mapFontsByFamily(fonts), [fonts]);

  const resolvedFontUrl = useMemo(() => {
    return resolveFontUrl(fontMap, fontFamily, fontWeight, fontStyle);
  }, [fontMap, fontFamily, fontWeight, fontStyle]);

  const fontPathForBackend = resolvedFontUrl || "";

  const effectiveFontFamily = fontFamily || "Georgia";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await refreshFonts();
        if (cancelled) return;

        const validList = (list || []).filter((f) => {
          const p = String(f?.path || "").toLowerCase();
          return p.endsWith(".ttf") || p.endsWith(".otf");
        });

        setFonts(validList);

        const byFamily = mapFontsByFamily(validList);

        setFontFamily((curr) => {
          if (curr && byFamily[curr]?.regular) return curr;
          return pickDefaultFamily(byFamily);
        });

        await preloadRegularFonts(byFamily);
      } catch {
        if (!cancelled) setFonts([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load exact style when selection changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = resolvedFontUrl;
      if (!url) return;
      try {
        await loadFont(effectiveFontFamily, url);
      } catch {
        if (cancelled) return;

        // Fallback to Georgia
        setFontFamily("Georgia");
        setFontWeight("normal");
        setFontStyle("normal");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedFontUrl, effectiveFontFamily]);

  const canPlace = Boolean(templateUrl);
  const canStyle = Boolean(templateUrl);

  const hasTextArea = Boolean(
    textArea &&
      Number.isFinite(textArea.x) &&
      Number.isFinite(textArea.y) &&
      Number.isFinite(textArea.width) &&
      Number.isFinite(textArea.height) &&
      textArea.width > 0 &&
      textArea.height > 0
  );

  const hasImageSize = Boolean(imageSize.width > 0 && imageSize.height > 0);

  // Debug why Preview might be disabled
  console.log("templateUrl:", templateUrl);
  console.log("csvFile:", csvFile);
  console.log("textArea:", textArea);
  console.log("imageSize:", imageSize);
  console.log("resolvedFontUrl:", resolvedFontUrl);

  // Debug font mapping (expose for DevTools)
  try {
    globalThis.__certgenFontFamily = fontFamily;
    globalThis.__certgenFontMapKeys = Object.keys(fontMap || {});
  } catch {
    // ignore
  }
  console.log("fontFamily:", fontFamily);
  console.log("fontMap keys:", Object.keys(fontMap || {}));

  const canPreview = Boolean(
    templateUrl && csvFile && hasTextArea && hasImageSize && resolvedFontUrl
  );
  const canGenerate = canPreview;

  const resetAfterTemplateChange = () => {
    setGenerated(false);
    setCertTotal(0);

    setPreviewUrl(null);

    setTextArea(null);
    setImageSize({ width: 0, height: 0 });
  };

  const handleUploadTemplate = async (file, didRetry = false) => {
    setError(null);
    resetAfterTemplateChange();

    if (!sessionId) {
      setError("Session not ready.");
      return;
    }

    setBusy(true);
    try {
      await uploadTemplate(sessionId, file);
      setTemplateFile(file);

      const thumbRes = await getTemplateThumbnail(sessionId);
      setTemplateUrl(globalThis.URL.createObjectURL(thumbRes.data));
    } catch (err) {
      if (!didRetry && isSessionNotFound(err)) {
        safeReload();
        return;
      }
      setError(formatError("Template upload failed", err, "Template upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleUploadCsv = async (file, didRetry = false) => {
    setError(null);
    setGenerated(false);
    setCertTotal(0);
    setPreviewUrl(null);

    if (!sessionId) {
      setError("Session not ready.");
      return;
    }

    setBusy(true);
    try {
      await uploadCsv(sessionId, file);
      setCsvFile(file);
    } catch (err) {
      if (!didRetry && isSessionNotFound(err)) {
        safeReload();
        return;
      }
      setError(formatError("CSV upload failed", err, "CSV upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleUploadFont = async (file, didRetry = false) => {
    setError(null);

    if (!sessionId) {
      setError("Session not ready.");
      return;
    }

    setBusy(true);
    try {
      await uploadFont(sessionId, file);
      setFontFile(file);

      const list = await refreshFonts();
      const validList = (list || []).filter((f) => {
        const p = String(f?.path || "").toLowerCase();
        return p.endsWith(".ttf") || p.endsWith(".otf");
      });

      setFonts(validList);

      const byFamily = mapFontsByFamily(validList);
      const families = Object.keys(byFamily);

      const last = families.at(-1);
      const nextFamily = last && byFamily[last]?.regular ? last : effectiveFontFamily;
      setFontFamily(nextFamily || pickDefaultFamily(byFamily));

      await preloadRegularFonts(byFamily);
    } catch (err) {
      if (!didRetry && isSessionNotFound(err)) {
        safeReload();
        return;
      }
      setError(formatError("Font upload failed", err, "Font upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const buildPayload = () => {
    if (!sessionId || !hasTextArea || !hasImageSize) return null;

    const centerX = textArea.x + textArea.width / 2;
    const centerY = textArea.y + textArea.height / 2;

    const { x_percent, y_percent } = pixelToPercent(
      centerX,
      centerY,
      imageSize.width,
      imageSize.height
    );

    return {
      session_id: sessionId,
      x_percent,
      y_percent,
      font_path: fontPathForBackend,
      font_size: fontSize,
      font_color: fontColor,
      output_format: outputFormat,
      bold,
      italic,
      text_area: {
        x: textArea.x,
        y: textArea.y,
        width: textArea.width,
        height: textArea.height,
      },
    };
  };

  const handlePreview = async () => {
    if (!canPreview) return;
    const payload = buildPayload();
    if (!payload) return;

    setError(null);
    setBusy(true);
    try {
      const res = await previewCertificate(payload);
      setPreviewUrl(globalThis.URL.createObjectURL(res.data));
    } catch (err) {
      setError(formatError("Preview failed", err, "Preview failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const payload = buildPayload();
    if (!payload) return;

    setError(null);
    setBusy(true);
    try {
      const res = await generateCertificates(payload);
      setGenerated(true);
      setCertTotal(res.data?.total ?? 0);
    } catch (err) {
      setError(formatError("Generate failed", err, "Generate failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setError(null);
    if (!sessionId) return;

    setBusy(true);
    try {
      const res = await downloadZip(sessionId);
      const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "application/zip",
      });

      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificates.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      setError(formatError("Download failed", err, "Download failed."));
    } finally {
      setBusy(false);
    }
  };

  if (sessionLoading) {
    return <div className="text-sm text-gray-600">Initializing session…</div>;
  }

  if (sessionError) {
    return <div className="text-sm text-red-600">{sessionError}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* STEP 1 */}
      <Card className="rounded-xl border border-gray-200 shadow-sm p-6 bg-white">
        <StepHeader
          step={1}
          title="Upload"
          subtitle="Template, CSV, and optional font."
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <DropzoneField
            label="Template"
            description=".pdf / .png / .jpg / .jpeg"
            accept={ACCEPT_TEMPLATE}
            onFile={handleUploadTemplate}
            file={templateFile}
            disabled={busy}
          />
          <DropzoneField
            label="Participants (CSV)"
            description=".csv"
            accept={ACCEPT_CSV}
            onFile={handleUploadCsv}
            file={csvFile}
            disabled={busy}
          />
          <DropzoneField
            label="Font (.ttf/.otf)"
            description="Optional"
            accept={ACCEPT_FONT}
            onFile={handleUploadFont}
            file={fontFile}
            disabled={busy}
          />
        </div>
      </Card>

      {/* STEP 2 */}
      <Card className="rounded-xl border border-gray-200 shadow-sm p-6 bg-white">
        <StepHeader
          step={2}
          title="Place name"
          subtitle="Draw a box where the name should go."
        />

        <div className="mt-6">
          {canPlace ? (
            <>
              <CanvasEditor
                templateUrl={templateUrl}
                onTextAreaChange={(areaPx, size) => {
                  setTextArea(areaPx);
                  setImageSize(size);
                }}
                anchor={textAnchor}
                showAnchorGuide
              />

              {textArea ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      Position
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-semibold text-gray-600">
                        <span className="block">X</span>
                        <input
                          type="number"
                          value={Math.round(textArea.x)}
                          onChange={(e) => {
                            // X
                            const x = Number(e.target.value);
                            const next = { ...textArea, x: Number.isNaN(x) ? 0 : x };
                            setTextArea(next);
                            globalThis.dispatchEvent(
                              new CustomEvent("certgen:textAreaSync", { detail: next })
                            );
                          }}
                          className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="text-xs font-semibold text-gray-600">
                        <span className="block">Y</span>
                        <input
                          type="number"
                          value={Math.round(textArea.y)}
                          onChange={(e) => {
                            // Y
                            const y = Number(e.target.value);
                            const next = { ...textArea, y: Number.isNaN(y) ? 0 : y };
                            setTextArea(next);
                            globalThis.dispatchEvent(
                              new CustomEvent("certgen:textAreaSync", { detail: next })
                            );
                          }}
                          className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      Size
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-semibold text-gray-600">
                        <span className="block">Width</span>
                        <input
                          type="number"
                          value={Math.round(textArea.width)}
                          onChange={(e) => {
                            // Width
                            const width = Number(e.target.value);
                            const next = {
                              ...textArea,
                              width: Number.isNaN(width) ? 1 : Math.max(1, width),
                            };
                            setTextArea(next);
                            globalThis.dispatchEvent(
                              new CustomEvent("certgen:textAreaSync", { detail: next })
                            );
                          }}
                          className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="text-xs font-semibold text-gray-600">
                        <span className="block">Height</span>
                        <input
                          type="number"
                          value={Math.round(textArea.height)}
                          onChange={(e) => {
                            // Height
                            const height = Number(e.target.value);
                            const next = {
                              ...textArea,
                              height: Number.isNaN(height) ? 1 : Math.max(1, height),
                            };
                            setTextArea(next);
                            globalThis.dispatchEvent(
                              new CustomEvent("certgen:textAreaSync", { detail: next })
                            );
                          }}
                          className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-sm text-gray-600 flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              Upload a template to continue.
            </div>
          )}
        </div>
      </Card>

      {/* STEP 3 */}
      <Card className="rounded-xl border border-gray-200 shadow-sm p-6 bg-white">
        <StepHeader step={3} title="Style" subtitle="Font, size, color, output." />

        {/* Canva-like toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Font */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">Font</div>
            <select
              value={effectiveFontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                setFontWeight("normal");
                setFontStyle("normal");
              }}
              disabled={!canStyle || busy}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            >
              {Object.keys(fontMap).map((fam) => (
                <option key={fam} value={fam} style={{ fontFamily: fam }}>
                  {fam}
                </option>
              ))}
              {fontMap?.Georgia ? null : <option value="Georgia">Georgia</option>}
            </select>
          </div>

          {/* Anchor */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">Alignment</div>
            <select
              value={textAnchor}
              onChange={(e) => setTextAnchor(e.target.value)}
              disabled={!canStyle || busy}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          {/* B / I */}
          <button
            type="button"
            className={
              "h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-200 " +
              (fontWeight === "bold"
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-50 text-gray-900")
            }
            onClick={() =>
              setFontWeight((prev) => (prev === "bold" ? "normal" : "bold"))
            }
            disabled={!canStyle || busy}
            aria-label="Bold"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            className={
              "h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-200 " +
              (fontStyle === "italic"
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-50 text-gray-900")
            }
            onClick={() =>
              setFontStyle((prev) => (prev === "italic" ? "normal" : "italic"))
            }
            disabled={!canStyle || busy}
            aria-label="Italic"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Size */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">Size</div>
            <input
              type="number"
              min={8}
              max={200}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              disabled={!canStyle || busy}
              className="h-10 w-24 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            />
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">Color</div>
            <HexColorPicker value={fontColor} onChange={setFontColor} />
          </div>

          {/* Output */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">Output</div>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              disabled={!canStyle || busy}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            >
              <option value="png">PNG</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handlePreview}
              disabled={!canPreview || busy}
              className="transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </div>
        </div>

        {/* Preview */}
        {previewUrl ? (
          <div className="mt-6 rounded-xl bg-gray-100 p-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-lg shadow-lg bg-white"
            />
          </div>
        ) : null}
      </Card>

      {/* STEP 4 */}
      <Card className="rounded-xl border border-gray-200 shadow-sm p-6 bg-white">
        <StepHeader
          step={4}
          title="Generate"
          subtitle="Create and download a ZIP."
          right={
            generated ? (
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                Ready
              </div>
            ) : null
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || busy}
            className={
              "inline-flex items-center gap-2 rounded-lg font-semibold px-5 py-3 transition-all duration-200 " +
              (canGenerate && !busy
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed")
            }
          >
            <Sparkles className="w-5 h-5" />
            Generate
          </button>

          {generated ? (
            <div className="text-sm text-gray-700 font-semibold">
              ZIP ready ({certTotal})
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Complete steps to enable generate.
            </div>
          )}

          <div className="flex-1" />

          {generated ? (
            <Button variant="secondary" onClick={handleDownload} disabled={busy}>
              <Download className="w-4 h-4" />
              Download ZIP
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}