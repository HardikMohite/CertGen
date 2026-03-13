import { useRef, useState } from "react";

export default function TemplateUploader({ onUpload }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
    onUpload(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    inputRef.current.value = "";
  };

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 transition min-h-[140px] justify-center"
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        className="hidden"
        onChange={handleChange}
      />
      {preview ? (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Template preview"
            className="w-full max-h-48 object-contain rounded-lg"
          />
          <button
            onClick={handleClear}
            className="absolute top-1 right-1 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 text-xs"
          >
            ✕
          </button>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl">📄</span>
          <span className="text-xs text-gray-600 text-center break-all">{fileName}</span>
          <button
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-600 mt-1"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <span className="text-3xl text-gray-300">🖼</span>
          <p className="text-sm text-gray-500 text-center">
            Click to upload template
          </p>
          <p className="text-xs text-gray-400">PNG, JPG, JPEG, PDF</p>
        </>
      )}
    </div>
  );
}