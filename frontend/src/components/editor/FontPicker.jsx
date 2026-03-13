import { useEffect, useState } from "react";
import { getFonts } from "../../services/api";

export default function FontPicker({ value, onChange }) {
  const [fonts, setFonts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFonts()
      .then((res) => {
        const list = res.data.fonts;
        setFonts(list);
        if (list.length > 0 && !value) {
          onChange(list[0]);
        }
      })
      .catch(() => setError("Could not load fonts from server."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-gray-400 animate-pulse">Loading fonts…</div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300">Font</label>
      <select
        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value?.file ?? ""}
        onChange={(e) => {
          const selected = fonts.find((f) => f.file === e.target.value);
          if (selected) onChange(selected);
        }}
      >
        {fonts.map((font) => (
          <option key={font.file} value={font.file}>
            {font.label}
          </option>
        ))}
      </select>
    </div>
  );
}
