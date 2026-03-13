import { Award, HelpCircle, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-lg font-semibold tracking-tight text-gray-900" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
            Cert<span className="text-green-600">Gen</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}