import { useRef, useEffect } from "react";
import { Rect, Transformer } from "react-konva";

export default function SelectionBox({ x, y, width, height, stageWidth, stageHeight, onChange }) {
  const rectRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, []);

  const handleDragEnd = (e) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
      width: rectRef.current.width() * rectRef.current.scaleX(),
      height: rectRef.current.height() * rectRef.current.scaleY(),
    });
  };

  const handleTransformEnd = () => {
    const node = rectRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(40, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
    });
  };

  return (
    <>
      <Rect
        ref={rectRef}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(99, 102, 241, 0.15)"
        stroke="#6366f1"
        strokeWidth={2}
        dash={[6, 3]}
        draggable
        dragBoundFunc={(pos) => ({
          x: Math.min(Math.max(pos.x, 0), stageWidth - width),
          y: Math.min(Math.max(pos.y, 0), stageHeight - height),
        })}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      <Transformer
        ref={trRef}
        rotateEnabled={false}
        keepRatio={false}
        enabledAnchors={[
          "top-left", "top-right",
          "bottom-left", "bottom-right",
          "middle-left", "middle-right",
          "top-center", "bottom-center",
        ]}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 40 || newBox.height < 20) return oldBox;
          return newBox;
        }}
        borderStroke="#6366f1"
        borderStrokeWidth={1.5}
        anchorStroke="#6366f1"
        anchorFill="#ffffff"
        anchorSize={8}
        anchorCornerRadius={2}
      />
    </>
  );
}