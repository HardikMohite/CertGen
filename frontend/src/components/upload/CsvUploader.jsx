import { useRef, useState } from "react";

export default function CsvUploader({ onUpload, uploaded }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    onUpload(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
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
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
      {fileName ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl">📋</span>
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
          <span className="text-3xl text-green-400">⬆</span>
          <p className="text-sm text-gray-500 text-center">Drop your CSV here</p>
          <p className="text-xs text-gray-400">Only .csv files are supported</p>
        </>
      )}
    </div>
  );
}