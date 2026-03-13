import clsx from "clsx";

export function Card({ className, children }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 shadow-sm bg-white p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({ className, variant = "primary", disabled, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-5 py-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-green-600 hover:bg-green-700 text-white"
      : variant === "secondary"
      ? "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
      : "bg-gray-900 hover:bg-gray-800 text-white";

  return (
    <button
      type="button"
      className={clsx(base, styles, className)}
      disabled={disabled}
      {...props}
    />
  );
}
