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
};

function isSessionNotFound(err) {
  const msg = err?.response?.data?.detail || err?.message || "";
  return (
    typeof msg === "string" &&
    msg.toLowerCase().includes("session") &&
    msg.toLowerCase().includes("not found")
  );
}

export default function GeneratorPage() {
  const { sessionId, loading: sessionLoading, error: sessionError } = useSession();

  const [templateFile, setTemplateFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [fontFile, setFontFile] = useState(null);

  const [templateUrl, setTemplateUrl] = useState(null);
  const [textArea, setTextArea] = useState(null); // { x,y,width,height } in IMAGE px
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const [fonts, setFonts] = useState([]);
  const [selectedFont, setSelectedFont] = useState(null);

  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#4266DE");
  const [outputFormat, setOutputFormat] = useState("png");

  const [previewUrl, setPreviewUrl] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [certTotal, setCertTotal] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Cleanup blob/object URLs safely
  useEffect(() => {
    if (!templateUrl?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(templateUrl);
  }, [templateUrl]);

  useEffect(() => {
    if (!previewUrl?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    refreshFonts()
      .then((list) => {
        setFonts(list);
        setSelectedFont((curr) => curr ?? (list.length > 0 ? list[0] : null));
      })
      .catch(() => setFonts([]));
  }, []);

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

  const canPreview = Boolean(
    templateUrl &&
      csvFile &&
      hasTextArea &&
      hasImageSize &&
      selectedFont
  );
  const canGenerate = canPreview;

  const fontPathForBackend = useMemo(
    () => selectedFont?.path || "",
    [selectedFont]
  );

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
      setTemplateUrl(URL.createObjectURL(thumbRes.data));
    } catch (err) {
      if (!didRetry && isSessionNotFound(err)) {
        // Session was cleared server-side; reload to establish a fresh session and retry once.
        window.location.reload();
        return;
      }
      const detail = err?.response?.data?.detail;
      setError(
        detail
          ? `Template upload failed: ${detail}`
          : "Template upload failed."
      );
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
        window.location.reload();
        return;
      }
      const detail = err?.response?.data?.detail;
      setError(detail ? `CSV upload failed: ${detail}` : "CSV upload failed.");
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
      setFonts(list);

      const newest = list[list.length - 1];
      if (newest) setSelectedFont(newest);
    } catch (err) {
      if (!didRetry && isSessionNotFound(err)) {
        window.location.reload();
        return;
      }
      const detail = err?.response?.data?.detail;
      setError(detail ? `Font upload failed: ${detail}` : "Font upload failed.");
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
      setPreviewUrl(URL.createObjectURL(res.data));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail ? `Preview failed: ${detail}` : "Preview failed.");
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
      const detail = err?.response?.data?.detail;
      setError(detail ? `Generate failed: ${detail}` : "Generate failed.");
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

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificates.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail ? `Download failed: ${detail}` : "Download failed.");
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
              />

              {textArea ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      Position
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-semibold text-gray-600">
                        X
                        <input
                          type="number"
                          value={Math.round(textArea.x)}
                          onChange={(e) => {
                            const x = Number(e.target.value);
                            const next = { ...textArea, x: isNaN(x) ? 0 : x };
                            setTextArea(next);
                            window.dispatchEvent(
                              new CustomEvent("certgen:textAreaSync", { detail: next })
                            );
                          }}
                          className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="text-xs font-semibold text-gray-600">
                        Y
                        <input
                          type="number"
                          value={Math.round(textArea.y)}
                          onChange={(e) => {
                            const y = Number(e.target.value);
                            const next = { ...textArea, y: isNaN(y) ? 0 : y };
                            setTextArea(next);
                            window.dispatchEvent(
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
                        Width
                        <input
                          type="number"
                          value={Math.round(textArea.width)}
                          onChange={(e) => {
                            const width = Number(e.target.value);
                            const next = {
                              ...textArea,
                              width: isNaN(width) ? 1 : Math.max(1, width),
                            };
                            setTextArea(next);
                            window.dispatchEvent(
                              new CustomEvent("certgen:textAreaSync", { detail: next })
                            );
                          }}
                          className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="text-xs font-semibold text-gray-600">
                        Height
                        <input
                          type="number"
                          value={Math.round(textArea.height)}
                          onChange={(e) => {
                            const height = Number(e.target.value);
                            const next = {
                              ...textArea,
                              height: isNaN(height) ? 1 : Math.max(1, height),
                            };
                            setTextArea(next);
                            window.dispatchEvent(
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
              value={selectedFont?.file ?? ""}
              onChange={(e) => {
                const next = fonts.find((f) => f.file === e.target.value);
                if (next) setSelectedFont(next);
              }}
              disabled={!canStyle || busy}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            >
              {fonts.map((f) => (
                <option
                  key={f.file}
                  value={f.file}
                  style={{ fontFamily: f.label }}
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* B / I */}
          <button
            type="button"
            className={
              "h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center transition-all duration-200 " +
              (bold
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-50 text-gray-900")
            }
            onClick={() => setBold((b) => !b)}
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
              (italic
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-50 text-gray-900")
            }
            onClick={() => setItalic((i) => !i)}
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