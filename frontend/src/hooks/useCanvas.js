import { useState } from "react";

const defaultSelection = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

export default function useCanvas() {
  const [selection, setSelection] = useState(defaultSelection);

  const updateSelection = (newSelection) => {
    setSelection((prev) => ({ ...prev, ...newSelection }));
  };

  const resetSelection = () => {
    setSelection(defaultSelection);
  };

  return { selection, updateSelection, resetSelection };
}