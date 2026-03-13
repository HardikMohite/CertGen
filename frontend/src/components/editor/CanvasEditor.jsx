import { useEffect, useMemo, useRef, useState } from "react";

const HANDLE_SIZE = 10; // px (visual)
const MIN_W = 20;
const MIN_H = 20;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function normRect(x1, y1, x2, y2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export default function CanvasEditor({
  templateUrl,
  onTextAreaChange, // NEW: (rectPx, imageSize) => void
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  // rect in DISPLAY coords (relative to container)
  const [rect, setRect] = useState(null); // { x,y,width,height }
  const [mode, setMode] = useState("idle"); // idle | drawing | moving | resizing
  const [resizeCorner, setResizeCorner] = useState(null); // tl | tr | bl | br
  const [start, setStart] = useState(null); // { x,y } start mouse
  const [startRect, setStartRect] = useState(null);
  const [showVGuide, setShowVGuide] = useState(false);
  const [showHGuide, setShowHGuide] = useState(false);

  useEffect(() => {
    if (!templateUrl) return;
    const img = new Image();
    img.onload = () => setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = templateUrl;
  }, [templateUrl]);

  const getContainerRect = () => containerRef.current?.getBoundingClientRect();

  const displayToImage = (dx, dy) => {
    const r = getContainerRect();
    if (!r || !imgSize.width || !imgSize.height) return { ix: 0, iy: 0 };
    const scaleX = imgSize.width / r.width;
    const scaleY = imgSize.height / r.height;
    return { ix: dx * scaleX, iy: dy * scaleY };
  };

  const imageToDisplay = (ix, iy) => {
    const r = getContainerRect();
    if (!r || !imgSize.width || !imgSize.height) return { dx: 0, dy: 0 };
    const scaleX = r.width / imgSize.width;
    const scaleY = r.height / imgSize.height;
    return { dx: ix * scaleX, dy: iy * scaleY };
  };

  const emit = (nextRectDisplay) => {
    if (!onTextAreaChange || !nextRectDisplay) return;
    const r = getContainerRect();
    if (!r) return;

    const { ix: x } = displayToImage(nextRectDisplay.x, 0);
    const { iy: y } = displayToImage(0, nextRectDisplay.y);
    const { ix: w } = displayToImage(nextRectDisplay.width, 0);
    const { iy: h } = displayToImage(0, nextRectDisplay.height);

    onTextAreaChange(
      {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.max(1, w),
        height: Math.max(1, h),
      },
      { width: imgSize.width, height: imgSize.height }
    );
  };

  const updateGuides = (nextRect) => {
    const r = getContainerRect();
    if (!r || !nextRect) return;

    const rectCenterX = nextRect.x + nextRect.width / 2;
    const rectCenterY = nextRect.y + nextRect.height / 2;
    const containerCenterX = r.width / 2;
    const containerCenterY = r.height / 2;

    const SNAP = 3; // px threshold
    setShowVGuide(Math.abs(rectCenterX - containerCenterX) <= SNAP);
    setShowHGuide(Math.abs(rectCenterY - containerCenterY) <= SNAP);
  };

  const beginDraw = (mx, my) => {
    setMode("drawing");
    setStart({ x: mx, y: my });
    setRect({ x: mx, y: my, width: 0, height: 0 });
  };

  const beginMove = (mx, my) => {
    setMode("moving");
    setStart({ x: mx, y: my });
    setStartRect(rect);
  };

  const beginResize = (corner, mx, my) => {
    setMode("resizing");
    setResizeCorner(corner);
    setStart({ x: mx, y: my });
    setStartRect(rect);
  };

  const insideRect = (mx, my, r) =>
    mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.height;

  const onMouseDown = (e) => {
    if (!containerRef.current) return;
    const r = getContainerRect();
    if (!r) return;

    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    // If clicking handle, resize.
    const hit = hitTestHandle(mx, my, rect);
    if (rect && hit) {
      e.preventDefault();
      e.stopPropagation();
      beginResize(hit, mx, my);
      return;
    }

    // If clicking inside existing rect, move.
    if (rect && insideRect(mx, my, rect)) {
      e.preventDefault();
      e.stopPropagation();
      beginMove(mx, my);
      return;
    }

    // Otherwise start drawing new rect.
    beginDraw(mx, my);
  };

  const onMouseMove = (e) => {
    const r = getContainerRect();
    if (!r) return;

    const mx = clamp(e.clientX - r.left, 0, r.width);
    const my = clamp(e.clientY - r.top, 0, r.height);

    if (mode === "drawing" && start) {
      const next = normRect(start.x, start.y, mx, my);
      const bounded = boundRect(next, r.width, r.height);
      setRect(bounded);
      updateGuides(bounded);
      emit(bounded);
    }

    if (mode === "moving" && start && startRect) {
      const dx = mx - start.x;
      const dy = my - start.y;
      const next = { ...startRect, x: startRect.x + dx, y: startRect.y + dy };
      const bounded = boundRect(next, r.width, r.height);
      setRect(bounded);
      updateGuides(bounded);
      emit(bounded);
    }

    if (mode === "resizing" && start && startRect && resizeCorner) {
      const next = resizeFromCorner(startRect, resizeCorner, mx, my, start);
      const bounded = boundRect(next, r.width, r.height, true);
      setRect(bounded);
      updateGuides(bounded);
      emit(bounded);
    }
  };

  const onMouseUp = () => {
    if (mode === "drawing" && rect) {
      // finalize minimum size
      const fixed = {
        ...rect,
        width: Math.max(MIN_W, rect.width),
        height: Math.max(MIN_H, rect.height),
      };
      setRect(fixed);
      emit(fixed);
    }
    setMode("idle");
    setResizeCorner(null);
    setStart(null);
    setStartRect(null);
    setShowVGuide(false);
    setShowHGuide(false);
  };

  useEffect(() => {
    if (mode === "idle") return;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, start, startRect, rect, resizeCorner, imgSize.width, imgSize.height]);

  // Keyboard movement: arrows move by 1px; shift = 10px
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!rect) return;
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;

      const r = getContainerRect();
      if (!r) return;

      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;

      let nx = rect.x;
      let ny = rect.y;
      if (e.key === "ArrowLeft") nx -= step;
      if (e.key === "ArrowRight") nx += step;
      if (e.key === "ArrowUp") ny -= step;
      if (e.key === "ArrowDown") ny += step;

      const next = boundRect({ ...rect, x: nx, y: ny }, r.width, r.height);
      setRect(next);
      updateGuides(next);
      emit(next);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, imgSize.width, imgSize.height]);

  const handleStyles = (corner) => {
    const base =
      "absolute w-2.5 h-2.5 bg-white border border-gray-400 shadow-sm";
    const half = HANDLE_SIZE / 2;

    if (!rect) return { className: base, style: {} };
    const x1 = rect.x;
    const y1 = rect.y;
    const x2 = rect.x + rect.width;
    const y2 = rect.y + rect.height;

    if (corner === "tl") return { className: base, style: { left: x1 - half, top: y1 - half, cursor: "nwse-resize" } };
    if (corner === "tr") return { className: base, style: { left: x2 - half, top: y1 - half, cursor: "nesw-resize" } };
    if (corner === "bl") return { className: base, style: { left: x1 - half, top: y2 - half, cursor: "nesw-resize" } };
    return { className: base, style: { left: x2 - half, top: y2 - half, cursor: "nwse-resize" } };
  };

  // Allow parent to drive rect via image-pixel inputs (coord panel)
  // Expose an imperative sync using a custom event (minimal change, avoids rewriting component tree)
  useEffect(() => {
    const onSync = (ev) => {
      const payload = ev.detail;
      if (!payload) return;
      const { x, y, width, height } = payload;
      // payload is IMAGE pixels -> convert to DISPLAY
      const { dx: rx } = imageToDisplay(x, 0);
      const { dy: ry } = imageToDisplay(0, y);
      const { dx: rw } = imageToDisplay(width, 0);
      const { dy: rh } = imageToDisplay(0, height);
      const r = getContainerRect();
      if (!r) return;

      const next = boundRect(
        { x: rx, y: ry, width: Math.max(1, rw), height: Math.max(1, rh) },
        r.width,
        r.height,
        true
      );
      setRect(next);
      emit(next);
    };

    window.addEventListener("certgen:textAreaSync", onSync);
    return () => window.removeEventListener("certgen:textAreaSync", onSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSize.width, imgSize.height]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        Drag to draw a rectangle for the name area. Move/resize after creating it. Arrow keys move it (Shift = faster).
      </p>

      <div
        ref={containerRef}
        className="relative w-full cursor-crosshair border border-gray-200 rounded-lg overflow-hidden bg-white select-none"
        onMouseDown={onMouseDown}
      >
        <img
          ref={imgRef}
          src={templateUrl}
          alt="Certificate template"
          className="w-full h-auto block pointer-events-none"
          draggable={false}
        />

        {/* Center alignment guidelines */}
        {showVGuide ? (
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-sky-300/80" />
        ) : null}
        {showHGuide ? (
          <div className="absolute left-0 right-0 top-1/2 h-px bg-sky-300/80" />
        ) : null}

        {/* Selection rectangle */}
        {rect ? (
          <div
            className="absolute border-2 border-blue-500 border-dashed bg-blue-200/20"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              cursor: mode === "moving" ? "grabbing" : "grab",
            }}
          >
            {/* Resize handles (corners) */}
            {["tl", "tr", "bl", "br"].map((c) => {
              const { className, style } = handleStyles(c);
              return (
                <div
                  key={c}
                  className={className}
                  style={style}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const r = getContainerRect();
                    if (!r) return;
                    const mx = e.clientX - r.left;
                    const my = e.clientY - r.top;
                    beginResize(c, mx, my);
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function boundRect(r, maxW, maxH, allowSmall = false) {
  const w = allowSmall ? Math.max(1, r.width) : Math.max(MIN_W, r.width);
  const h = allowSmall ? Math.max(1, r.height) : Math.max(MIN_H, r.height);

  const x = clamp(r.x, 0, Math.max(0, maxW - w));
  const y = clamp(r.y, 0, Math.max(0, maxH - h));
  return { x, y, width: w, height: h };
}

function hitTestHandle(mx, my, rect) {
  if (!rect) return null;
  const half = HANDLE_SIZE / 2;

  const corners = {
    tl: { x: rect.x, y: rect.y },
    tr: { x: rect.x + rect.width, y: rect.y },
    bl: { x: rect.x, y: rect.y + rect.height },
    br: { x: rect.x + rect.width, y: rect.y + rect.height },
  };

  for (const k of Object.keys(corners)) {
    const c = corners[k];
    if (mx >= c.x - half && mx <= c.x + half && my >= c.y - half && my <= c.y + half) {
      return k;
    }
  }
  return null;
}

function resizeFromCorner(startRect, corner, mx, my, startMouse) {
  // We resize by moving one corner while keeping opposite corner fixed.
  const x1 = startRect.x;
  const y1 = startRect.y;
  const x2 = startRect.x + startRect.width;
  const y2 = startRect.y + startRect.height;

  const dx = mx - startMouse.x;
  const dy = my - startMouse.y;

  let nx1 = x1;
  let ny1 = y1;
  let nx2 = x2;
  let ny2 = y2;

  if (corner === "tl") {
    nx1 = x1 + dx;
    ny1 = y1 + dy;
  } else if (corner === "tr") {
    nx2 = x2 + dx;
    ny1 = y1 + dy;
  } else if (corner === "bl") {
    nx1 = x1 + dx;
    ny2 = y2 + dy;
  } else if (corner === "br") {
    nx2 = x2 + dx;
    ny2 = y2 + dy;
  }

  const next = normRect(nx1, ny1, nx2, ny2);
  return {
    x: next.x,
    y: next.y,
    width: Math.max(MIN_W, next.width),
    height: Math.max(MIN_H, next.height),
  };
}