import { useState } from "react";
import { Download, FileArchive, Loader2 } from "lucide-react";
import { downloadZip } from "../../services/api";

function getFileNameFromDisposition(disposition) {
  if (!disposition) return null;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
  const raw = match?.[1] || match?.[2];
  return raw ? decodeURIComponent(raw) : null;
}

export default function DownloadPanel({ sessionId, count, ready }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setError(null);
    if (!sessionId) {
      setError("Session not found.");
      return;
    }
    setDownloading(true);
    try {
      const res = await downloadZip(sessionId);
      const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "application/zip",
      });
      const url = URL.createObjectURL(blob);
      const nameFromHeader = getFileNameFromDisposition(
        res.headers?.["content-disposition"]
      );
      const filename = nameFromHeader || "certificates.zip";

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail ? `Download failed: ${detail}` : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full">
        <FileArchive size={22} className="text-emerald-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">
          {count} certificate{count !== 1 ? "s" : ""} ready
        </p>
        <p className="text-xs text-gray-500 mt-1">Your ZIP file is ready to download</p>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shadow-sm"
      >
        {downloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {downloading ? "Downloading..." : "Download ZIP"}
      </button>
    </div>
  );
}
