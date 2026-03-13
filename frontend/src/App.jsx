import GeneratorPage from "./components/pages/GeneratorPage";
import { Award, HelpCircle, Settings } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-tight">
                Cert<span className="text-green-600">Gen</span>
              </div>
              <div className="text-xs text-gray-500">
                Generate certificates in seconds
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-10 w-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
              aria-label="Help"
              title="Help"
            >
              <HelpCircle className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              className="h-10 w-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[1100px] mx-auto px-6 py-10">
        <GeneratorPage />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 py-6 text-center text-sm font-semibold text-gray-700">
          © 2026 Developed by{" "}
          <span className="text-green-600">Hardik Mohite</span> — CYSE Student
        </div>
      </footer>
    </div>
  );
}