import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

const SWATCHES = [
  "#000000",
  "#FFFFFF",
  "#111827",
  "#374151",
  "#6B7280",
  "#16a34a",
  "#10b981",
  "#2563eb",
  "#4266DE",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#f97316",
  "#eab308",
];

function normalizeHex(value) {
  if (!value) return null;
  const v = value.trim();
  if (!v.startsWith("#")) return null;
  if (v.length === 4) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (v.length === 7 && /^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
  return null;
}

export default function HexColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "#000000");
  const ref = useRef(null);

  useEffect(() => {
    setDraft(value || "#000000");
  }, [value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const normalized = useMemo(() => normalizeHex(draft), [draft]);
  const isValid = Boolean(normalized);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-all duration-200"
      >
        <span
          className="w-4 h-4 rounded-md border border-gray-200"
          style={{ background: value || "#000000" }}
        />
        <span className={clsx(!isValid && "text-red-600")}>{draft}</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-64 rounded-md border border-gray-200 bg-white shadow-lg p-3 z-20">
          <div className="text-xs font-semibold text-gray-500 mb-2">Color</div>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className="w-7 h-7 rounded-md border border-gray-200"
                style={{ background: c }}
                onClick={() => {
                  setDraft(c);
                  onChange(c);
                }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={clsx(
                "w-full rounded-md border px-3 py-2 text-sm font-semibold outline-none",
                isValid
                  ? "border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  : "border-red-300 focus:ring-2 focus:ring-red-300"
              )}
              placeholder="#4266DE"
            />
            <button
              type="button"
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200",
                isValid
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
              disabled={!isValid}
              onClick={() => {
                onChange(normalized);
                setOpen(false);
              }}
            >
              Apply
            </button>
          </div>
          {!isValid ? (
            <div className="text-xs text-red-600 mt-2">
              Enter a valid HEX color (#RGB or #RRGGBB)
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
