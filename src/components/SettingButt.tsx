// SettingsOverlay.tsx
import { createSignal, createEffect, onMount, onCleanup } from "solid-js";

type Settings = { enabled: boolean; enabledHM: boolean; value: number };

export default function SettingsOverlay(props: {
  onChange?: (s: Settings) => void;
  initialEnabled?: boolean;
  initialHMEnabled?: boolean;
  initialValue?: number;
}) {
  const [open, setOpen] = createSignal(false);
  const [enabled, setEnabled] = createSignal(props.initialEnabled ?? false);
  const [enabledHM, setEnabledHM] = createSignal(props.initialHMEnabled ?? false);
  const [value, setValue] = createSignal(props.initialValue ?? 50);

  createEffect(() => props.onChange?.({ enabled: enabled(), enabledHM: enabledHM(), value: value() }));

  // ESC closes
  onMount(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  // fixed at bottom-left; only inner controls are clickable
  const wrapStyle: Partial<CSSStyleDeclaration> = {
    position: "fixed",
    left: "10px",
    bottom: "10px",
    pointerEvents: "none",
    zIndex: "9999",
    borderRadius: "12px",
  };

  // row: button then panel (panel opens to the right)
  const rowStyle: Partial<CSSStyleDeclaration> = {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    pointerEvents: "auto",
  };

  const btnStyle: Partial<CSSStyleDeclaration> = {
  width: "44px",
  height: "44px",
  display: "grid",
  placeItems: "center",
  "border-radius": "6px",
  background: "rgba(25, 23, 142, 0.6)",       // semi-transparent
  backdropFilter: "blur(6px)",               // optional frosted look
  border: "1px solid rgba(255, 255, 255, .12)",
  color: "#e5eefc",
  boxShadow: "0 6px 18px rgba(0,0,0,.25)",
  cursor: "pointer",
};

  // Panel sits to the RIGHT of the button and slides out from the button's edge
  const panelStyle = (): Partial<CSSStyleDeclaration> => ({
    minWidth: "260px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #1f2a44",
    background: "rgba(15,23,42,.92)",
    color: "#e5eefc",
    boxShadow: "0 10px 28px rgba(0,0,0,.35)",
    transformOrigin: "left center",
    transform: open() ? "translateX(0) scaleX(1)" : "translateX(-8px) scaleX(0)",
    opacity: open() ? "1" : "0",
    transition: "transform 220ms ease, opacity 220ms ease",
    pointerEvents: open() ? "auto" : "none",
  });

  return (
    <div style={wrapStyle}>
      <div style={rowStyle}>
        {/* Toggle button (fixed 16px from left via wrapper) */}
        <button
          type="button"
          aria-label="Open settings"
          aria-expanded={open()}
          onClick={() => setOpen(!open())}
          style={btnStyle}
        >
          {/* Gear icon */}
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
          >
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.41 1.09V21a2 2 0 1 1-4 0v.09a1.7 1.7 0 0 0-.41-1.09 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.09-.41H3a2 2 0 1 1 0-4h.09c.4 0 .79-.15 1.09-.41.26-.23.46-.53.6-1a1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05c.53.53 1.27.74 1.87.34.3-.18.53-.43.6-1.09V3a2 2 0 1 1 4 0v-.09c.07.66.3.91.6 1.09.6.4 1.34.19 1.87-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05a1.7 1.7 0 0 0-.34 1.87c.18.3.43.53 1.09.6H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.09.41c-.23.26-.53.46-1 .6z"/>
          </svg>
        </button>

        {/* Sliding panel appears to the RIGHT of the button */}
        <div
          role="dialog"
          aria-hidden={!open()}
          aria-label="Settings"
          style={panelStyle()}
        >
          <div style={{ display: "grid", gap: "10px" }}>
              <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={enabledHM()}
                onInput={(e) => setEnabledHM((e.currentTarget as HTMLInputElement).checked)}
              />
              Heatmap
            </label>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={enabled()}
                onInput={(e) => setEnabled((e.currentTarget as HTMLInputElement).checked)}
              />
              Contrast
            </label>           

            <label style={{ display: "grid", gap: "6px" }}>
              <span>Intensity: {value()}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={value()}
                onInput={(e) => setValue(Number((e.currentTarget as HTMLInputElement).value))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
