import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import { UploadCloud } from "lucide-react";

export default function DropzoneField({
  label,
  description,
  accept,
  onFile,
  file,
  disabled,
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    disabled,
    onDrop: (files) => {
      if (files?.[0]) onFile(files[0]);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      {description ? (
        <div className="text-sm text-gray-600 -mt-1">{description}</div>
      ) : null}

      <div
        {...getRootProps()}
        className={clsx(
          "rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-200 hover:border-emerald-400 bg-white",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">
              Drag & Drop file
            </div>
            <div className="text-sm text-gray-600">or click to browse</div>
            {file ? (
              <div className="text-xs text-emerald-700 font-semibold mt-2 truncate">
                {file.name}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
