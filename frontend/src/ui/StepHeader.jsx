export default function StepHeader({ step, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-500">Step {step}</div>
        <div className="text-lg font-semibold tracking-tight text-gray-900">
          {title}
        </div>
        {subtitle ? (
          <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
