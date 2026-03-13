import { Loader2 } from "lucide-react";

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-full">
        <Loader2 size={22} className="text-indigo-600 animate-spin" />
      </div>
      <p className="text-sm text-gray-500 font-medium">{message}</p>
    </div>
  );
}