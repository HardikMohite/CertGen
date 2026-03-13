import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:bg-indigo-300",
  secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm disabled:opacity-50",
  danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:bg-red-300",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-600 disabled:opacity-50",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  xl: "px-8 py-4 text-base",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-150 cursor-pointer disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}