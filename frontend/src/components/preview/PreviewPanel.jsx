import { Eye } from "lucide-react";

export default function PreviewPanel({ previewUrl }) {
  if (!previewUrl) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Eye size={18} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-800">Certificate Preview</h3>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
        <img
          src={previewUrl}
          alt="Certificate preview"
          className="w-full object-contain max-h-96"
        />
      </div>
    </div>
  );
}
