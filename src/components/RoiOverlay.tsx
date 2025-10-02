import { Accessor, Setter, createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";

/** Canvas-space ROI (pixels) */
export type Roi = { x: number; y: number; w: number; h: number };

/**
 * Movable + resizable ROI overlay that sits above a <canvas>.
 * - Renders in CSS pixels, but stores ROI in *canvas pixel* space.
 * - Handles window resize / responsive canvas by recomputing the scale.
 */
export function RoiOverlay(props: {
  /** The target <canvas> element */
  canvas: () => HTMLCanvasElement | undefined;
  /** ROI in *canvas* pixels */
  roi: Accessor<Roi>;
  /** Update callback (receives new ROI in *canvas* pixels, clamped to canvas bounds) */
  onChange: (next: Roi) => void;
  /** Minimum size in canvas pixels */
  minSize?: number;
  /** Whether to show the overlay */
  visible?: boolean;
}) {
  const minSize = () => props.minSize ?? 12;

  // CSS-pixel box used for rendering (derived from roi + scale)
  const [cssBox, setCssBox] = createSignal({ left: 0, top: 0, width: 0, height: 0 });
  const [scale, setScale] = createSignal({ sx: 1, sy: 1 }); // css px per canvas px

  let host!: HTMLDivElement; // positioning container (absolute, covers the canvas)

  // Map ROI (canvas px) -> CSS px box
  function updateCssBox() {
    const c = props.canvas?.();
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const sx = rect.width / c.width;
    const sy = rect.height / c.height;
    setScale({ sx, sy });
    const r = props.roi();
    setCssBox({
      left: rect.left + r.x * sx,
      top: rect.top + r.y * sy,
      width: r.w * sx,
      height: r.h * sy,
    });
  }

  // Convert CSS movement to canvas-space delta
  function cssDeltaToCanvas(dxCss: number, dyCss: number) {
    const { sx, sy } = scale();
    return { dx: dxCss / sx, dy: dyCss / sy };
  }

  // Clamp a ROI to canvas bounds and min size
  function clampRoi(r: Roi): Roi {
    const c = props.canvas?.();
    if (!c) return r;
    const maxX = c.width, maxY = c.height;
    const min = minSize();
    let { x, y, w, h } = r;
    w = Math.max(min, Math.min(w, maxX));
    h = Math.max(min, Math.min(h, maxY));
    x = Math.max(0, Math.min(x, maxX - w));
    y = Math.max(0, Math.min(y, maxY - h));
    return { x, y, w, h };
  }

  // Recompute CSS box when ROI or target size changes
  createEffect(() => {
    props.roi();
    updateCssBox();
  });

  // Observe resize
  let ro: ResizeObserver | undefined;
  onMount(() => {
    updateCssBox();
    const c = props.canvas?.();
    if (c && "ResizeObserver" in window) {
      ro = new ResizeObserver(updateCssBox);
      ro.observe(document.documentElement);
      ro.observe(c);
    } else {
      const on = () => updateCssBox();
      window.addEventListener("resize", on);
      onCleanup(() => window.removeEventListener("resize", on));
    }
  });
  onCleanup(() => ro?.disconnect());

  // Drag/resize state
  type Mode = null | { kind: "move" } | { kind: "resize"; h: Handle };
  type Handle = "n"|"s"|"e"|"w"|"ne"|"nw"|"se"|"sw";
  let mode: Mode = null;
  let start = { xCss: 0, yCss: 0, roi: { x: 0, y: 0, w: 0, h: 0 } as Roi };

  function beginMove(ev: PointerEvent) {
    ev.preventDefault();
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    start = { xCss: ev.clientX, yCss: ev.clientY, roi: { ...props.roi() } };
    mode = { kind: "move" };
  }

  function beginResize(h: Handle) {
    return (ev: PointerEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
      start = { xCss: ev.clientX, yCss: ev.clientY, roi: { ...props.roi() } };
      mode = { kind: "resize", h };
    };
  }

  function onPointerMove(ev: PointerEvent) {
    if (!mode) return;
    const { dx, dy } = cssDeltaToCanvas(ev.clientX - start.xCss, ev.clientY - start.yCss);
    const r0 = start.roi;
    let r = { ...r0 };

    if (mode.kind === "move") {
      r.x = r0.x + dx;
      r.y = r0.y + dy;
    } else {
      const h = mode.h;
      if (h.includes("w")) { r.x = r0.x + dx; r.w = r0.w - dx; }
      if (h.includes("e")) { r.w = r0.w + dx; }
      if (h.includes("n")) { r.y = r0.y + dy; r.h = r0.h - dy; }
      if (h.includes("s")) { r.h = r0.h + dy; }
    }

    props.onChange(clampRoi(r));
    updateCssBox();
  }

  function end() { mode = null; }

  // Render overlay using fixed positioning so it follows window scroll too
  return (
    <Show when={props.visible ?? true}>
      <div
        ref={host!}
        style={{
          position: "fixed",
          left: `${cssBox().left}px`,
          top: `${cssBox().top}px`,
          width: `${cssBox().width}px`,
          height: `${cssBox().height}px`,
          "box-sizing": "border-box",
          border: "2px solid #22c55e",
          "background-color": "rgba(34,197,94,0.12)",
          "pointer-events": "auto",
          cursor: mode?.kind === "move" ? "move" : "default",
          "z-index": 1000,
        }}
        onPointerDown={beginMove}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {/* resize handles */}
        {(["nw","n","ne","e","se","s","sw","w"] as const).map(h => (
          <div
            onPointerDown={beginResize(h)}
            style={handleStyle(h)}
          />
        ))}
      </div>
    </Show>
  );
}

function handleStyle(h: "n"|"s"|"e"|"w"|"ne"|"nw"|"se"|"sw"): Record<string, string> {
  const base: Record<string, string> = {
    position: "absolute",
    width: h.length === 1 ? "100%" : "12px",
    height: h.length === 1 ? "12px" : "100%",
    background: "transparent",
    // visible corners
    ...(h.length === 2 ? { background: "#22c55e", opacity: "0.9", width: "10px", height: "10px", "border-radius": "50%" } : {}),
  };
  const pos: Record<string, string> = {};
  if (h.includes("n")) pos.top = "-6px"; // edges extend a bit outside
  if (h.includes("s")) pos.bottom = "-6px";
  if (h.includes("w")) pos.left = "-6px";
  if (h.includes("e")) pos.right = "-6px";
  // Edge cursors
  const cursors: Record<string, string> = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", nw: "nwse-resize", se: "nwse-resize", sw: "nesw-resize" };
  return { ...base, ...pos, cursor: cursors[h] };
}
