import { Sparkles, Loader2 } from "lucide-react";

export default function GenerateButton({ onGenerate, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={disabled || loading}
      className="self-start bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
    >
      {loading ? "Generating…" : "Generate Certificates"}
    </button>
  );
}