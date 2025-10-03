import { createSignal, Show, onMount, onCleanup, JSX } from "solid-js";

/**
 * SlideInMenu – a slide-in-from-left dialog that mimics the provided UI.
 * - Dark panel with blue accents
 * - Row of action buttons (including an Invert toggle)
 * - Two sliders: Threshold & Epsilon with left/right arrows and value pills
 * - Opens via a trigger element; closes on overlay click or ESC
 */
export type SlideInMenuProps = {
  /** Optional external control */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;

  /** Values (uncontrolled if omitted) */
  threshold?: number; // 0..255
  epsilon?: number;   // 0..255 (or any)
  invert?: boolean;
  procActive?: boolean;

  /** Change callbacks */
  onChangeThreshold?: (v: number) => void;
  onChangeEpsilon?: (v: number) => void;
  onChangeInvert?: (v: boolean) => void;
  onChangeProcActive?: (v: boolean) => void;

  /** Action buttons */
  onConfineThresh?: () => void;
  onSelectPolygons?: () => void;
  onCreateMss?: () => void;
  onAdjustMss?: () => void;

  /** The trigger that opens the menu */
  children?: JSX.Element; // e.g., <button>Menu</button>
};

export default function SlideInMenu(props: SlideInMenuProps) {
  // --- uncontrolled fallback state ----------------------------------------
  const [internalOpen, setInternalOpen] = createSignal(false);
  const isOpen = () => (props.open ?? internalOpen());

  const [threshold, setThreshold] = createSignal(props.threshold ?? 98);
  const [epsilon, setEpsilon] = createSignal(props.epsilon ?? 231);
  const [invert, setInvert] = createSignal(props.invert ?? true);
  const [procActive, setProcActive] = createSignal(props.procActive ?? true);

  // keep local in sync if parent updates props
  onMount(() => {
    const o = props.open; if (typeof o === 'boolean') setInternalOpen(o);
    if (typeof props.threshold === 'number') setThreshold(props.threshold);
    if (typeof props.epsilon === 'number') setEpsilon(props.epsilon);
    if (typeof props.invert === 'boolean') setInvert(props.invert);
    if (typeof props.procActive === 'boolean') setProcActive(props.procActive);
  });

  function setOpen(v: boolean) {
    if (props.onOpenChange) props.onOpenChange(v); else setInternalOpen(v);
  }

  // keyboard: ESC closes
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
  }
  onMount(() => window.addEventListener('keydown', onKey));
  onCleanup(() => window.removeEventListener('keydown', onKey));

  // helpers for arrows
  const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  function bumpThreshold(delta: number) {
    const v = clamp255(threshold() + delta);
    props.onChangeThreshold?.(v); setThreshold(v);
  }
  function bumpEpsilon(delta: number) {
    const v = clamp255(epsilon() + delta);
    props.onChangeEpsilon?.(v); setEpsilon(v);
  }

  // styles (scoped)
  const css = `
  .sim-root { --bg:#0b1220; --panel:#0f1118; --stroke:#2b3446; --muted:#a0aec0; --text:#e8eefc; --accent:#1fb6ff; --accent-2:#0090ff; }
  .sim-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.0);  opacity: 0; pointer-events: none; transition: opacity .25s ease; }
  .sim-overlay[data-open="true"] { opacity: 1; pointer-events: auto; }

  .sim-panel {
  position: fixed;
  top: 16px;
  right: 0;                         /* ← anchor to right */
  height: auto;
  max-height: calc(100vh - 32px);
  overflow: hidden;
  width: 400px;
  box-sizing: border-box;
  padding: 10px;
  background: #0e131b;
  border: 1px solid #1b2230;
  border-left: none;                /* optional: seamless edge on the right side */
  border-radius: 12px;
  color: var(--text);
  transform: translateX(105%);      /* ← off-screen to the right */
  transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
  box-shadow: 0 18px 60px rgba(0,0,0,.45);
  font: 14px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif;
}
  .sim-panel[data-open="true"] { transform: translateX(-25%); }

  .sim-group { background:#0f1723; border:1px solid #1e2a40; border-radius:10px; padding:8px; }
  .sim-actions { display:grid; grid-template-columns: repeat(5, 1fr); gap:8px; }
  .sim-btn { background: #0f2036; color: var(--text); border:1px solid #27456e; border-radius:10px; padding:8px 6px; text-align:center; cursor:pointer; user-select:none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.03); }
  .sim-btn:hover { background:#133154; }

  .sim-fieldlabel {text-align:center;}
  .sim-toggle { display:flex; flex-direction:column; align-items:center; gap:6px; }
  .sim-toggle .track { width: 56px; height: 24px; border-radius: 999px; background: #09111c; border:1px solid #27456e; position:relative; box-shadow: inset 0 0 0 1px rgba(255,255,255,.03); }
  .sim-toggle .knob { position:absolute; top:2px; left:2px; width: 20px; height:20px; border-radius:50%; background: var(--accent); box-shadow: 0 0 0 2px #0b2e4e inset, 0 2px 10px rgba(0, 190, 255, .55); transition: transform .2s ease; }
  .sim-toggle[data-on="true"] .knob { transform: translateX(32px); }
  .sim-toggle .labels { display:flex; gap:6px; font-size:12px; }
  .sim-toggle .labels span { padding: 2px 6px; border-radius: 6px; border:1px solid #27456e; }
  .sim-toggle[data-on="true"] .labels .on { background:#0b2e4e; color:#9bdcff; }
  .sim-toggle[data-on="false"] .labels .off { background:#0b2e4e; color:#9bdcff; }

  .sim-slider { display:grid; grid-template-columns: 30px 1fr 30px; gap:10px; align-items:center; padding: 8px 6px; }
  .sim-slider .label { color:#cfd7e6; font-size:12px; margin-bottom:4px; }
  .sim-slider .rail { position:relative; height: 8px; background: #0b2646; border-radius:999px; border:1px solid #27456e; box-shadow: inset 0 0 0 1px rgba(255,255,255,.03); }
  .sim-slider .thumb { position:absolute; top:50%; transform:translate(-50%,-50%); width: 28px; height:28px; background: #0b2646; border: 2px solid var(--accent); border-radius: 999px; box-shadow: 0 0 0 2px #0b2e4e inset, 0 2px 10px rgba(0, 190, 255, .55); cursor:grab; }
  .sim-slider .value { position:absolute; top:-28px; left:50%; transform:translateX(-50%); font-weight:700; color:#8fd7ff; font-size:12px; }
  .sim-slider .arrow { width:30px; height:30px; border-radius:8px; background:#0f2036; border:1px solid #27456e; display:grid; place-items:center; color:#8fd7ff; cursor:pointer; }
  .sim-slider .arrow:hover { background:#133154; }

  .sim-title { color:#cfd7e6; font-weight:600; margin: 6px 2px 10px; letter-spacing:.3px; }
  .sim-spacer { height:10px; }
  `;

  // slider drag logic (CSS-only rail; we track clientX -> value)
  let rail1!: HTMLDivElement; let rail2!: HTMLDivElement; let thumb1!: HTMLDivElement; let thumb2!: HTMLDivElement;
  function dragSlider(e: PointerEvent, rail: HTMLDivElement, set: (n:number)=>void, onChange?: (n:number)=>void) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = rail.getBoundingClientRect();
    const toVal = (cx:number) => {
      const t = Math.max(0, Math.min(1, (cx - rect.left)/rect.width));
      return Math.round(t * 255);
    };
    const move = (ev: PointerEvent) => { const v = toVal(ev.clientX); set(v); onChange?.(v); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    // initial update
    move(e as PointerEvent);
  }

  // position percentage for thumb
  const pct = (v:number) => `${(v/255)*100}%`;

  return (
    <div class="sim-root">
      <style>{css}</style>

      {/* Trigger */}
      <div onClick={() => setOpen(true)}>
        {props.children ?? (
          <div class="sim-btn" style={{ width: '120px' }}>Open Menu</div>
        )}
      </div>

      {/* Overlay */}
      <div class="sim-overlay" data-open={String(isOpen())} onClick={() => setOpen(false)} />

      {/* Panel */}
      <aside class="sim-panel" data-open={String(isOpen())} onClick={e => e.stopPropagation()}>
        <div class="sim-title">Controls</div>
        <div class="sim-group sim-actions">
          {/*<div class="sim-btn" onClick={() => props.onConfineThresh?.()}>Confine & Thresh</div>*/}

        {/* proc active toggle */}
        <div>
        <div class="sim-fieldlabel">Active</div>
        <div class="sim-toggle" data-on={String(procActive())}>
            <div class="labels">  
        <span class="off" classList={{ active: !procActive() }}>Off</span>
        <span class="on"  classList={{ active:  procActive() }}>On</span>
        </div>
            <div
            class="track"
            onClick={() => {
                const v = !procActive();
                setProcActive(v);
                props.onChangeProcActive?.(v);
            }}
            >
            <div class="knob" />
            </div>
        </div>
        </div>

          {/* Invert toggle */}
        <div>
        <div class="sim-fieldlabel">Invert</div>
        <div class="sim-toggle" data-on={String(invert())}>
            <div class="labels">  
        <span class="off" classList={{ active: !invert() }}>Off</span>
        <span class="on"  classList={{ active:  invert() }}>On</span>
        </div>
            <div
            class="track"
            onClick={() => {
                const v = !invert();
                setInvert(v);
                props.onChangeInvert?.(v);
            }}
            >
            <div class="knob" />
            </div>
        </div>
        </div>

          <div class="sim-btn" onClick={() => props.onSelectPolygons?.()}>Select Polygons</div>
          <div class="sim-btn" onClick={() => props.onCreateMss?.()}>Create MSS Polygons</div>
          <div class="sim-btn" onClick={() => props.onAdjustMss?.()}>Adjust MSS Polygons</div>
        </div>

        <div class="sim-spacer" />

        {/* Threshold slider */}
        <div>
          <div class="sim-slider">
            <div class="arrow" onClick={() => bumpThreshold(-1)}>◀</div>
            <div>
              <div class="label">Threshold</div>
              <div class="rail" ref={rail1!} onPointerDown={(e) => dragSlider(e, rail1, (v)=>{setThreshold(v); props.onChangeThreshold?.(v);})}>
                <div class="thumb" ref={thumb1!} style={{ left: pct(threshold()) }}>
                  <div class="value">{threshold()}</div>
                </div>
              </div>
            </div>
            <div class="arrow" onClick={() => bumpThreshold(+1)}>▶</div>
          </div>
        </div>

        {/* Epsilon slider */}
        <div>
          <div class="sim-slider">
            <div class="arrow" onClick={() => bumpEpsilon(-1)}>◀</div>
            <div>
              <div class="label">Epsilon</div>
              <div class="rail" ref={rail2!} onPointerDown={(e) => dragSlider(e, rail2, (v)=>{setEpsilon(v); props.onChangeEpsilon?.(v);})}>
                <div class="thumb" ref={thumb2!} style={{ left: pct(epsilon()) }}>
                  <div class="value">{epsilon()}</div>
                </div>
              </div>
            </div>
            <div class="arrow" onClick={() => bumpEpsilon(+1)}>▶</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
