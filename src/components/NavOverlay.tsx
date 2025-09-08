// NavTableOverlay.tsx
import { createMemo, createSignal } from "solid-js";

type Units = { speed?: "kn" | "kmh" | "mps"; altitude?: "m" | "ft" };

export default function NavTableOverlay(props: {
  json: string;
  precision?: number;
  units?: Units;
  defaultOpen?: boolean; // start opened? default false
}) {
  const [open, setOpen] = createSignal(!!props.defaultOpen);
  const precision = props.precision ?? 2;
  const units: Required<Units> = {
    speed: props.units?.speed ?? "kn",
    altitude: props.units?.altitude ?? "m",
  };

  let parsed = createMemo(() => {
    try {
      let o = JSON.parse(props.json ?? "{}") as Record<string, unknown>;
       console.log("change");
      console.log(o);
      return { ok: true as const, obj: o };
    } catch (e: any) {
      return { ok: false as const, err: e?.message ?? "Parse error" };
    }
  });

  const keys = createMemo(() => {
    if (!parsed().ok) return [] as string[];
    const o = parsed().obj!;
    const priority = [
      "lat","latitude","lon","lng","longitude",
      "speed","sog","knots","kts","heading","cog","course","alt","altitude","time","timestamp","ts"
    ];
    const present = Object.keys(o);
    const ordered: string[] = [];
    for (const k of priority) if (present.includes(k)) ordered.push(k);
    for (const k of present.sort()) if (!ordered.includes(k)) ordered.push(k);
    return ordered;
  });

  function fmtKey(k: string) {
    const map: Record<string,string> = {
      lat: "Lat", latitude: "Lat",
      lon: "Lon", lng: "Lon", longitude: "Lon",
      speed: "Speed", sog: "Speed", knots: "Speed", kts: "Speed",
      heading: "Heading", cog: "Heading", course: "Heading",
      alt: "Alt", altitude: "Alt",
      time: "Time", timestamp: "Time", ts: "Time",
    };
    return map[k] ?? k;
  }
  function fmtVal(k: string, v: unknown): string {
    const asNum = (x: any) => (Number.isFinite(+x) ? +x : undefined);

    console.log(k, v);
    // time
    if (k === "time" || k === "timestamp" || k === "ts") {
      if (typeof v === "number") {
        const ms = v < 1e12 ? v * 1000 : v;
        return new Date(ms).toLocaleString();
      }
      const d = new Date(String(v));
      return isNaN(+d) ? String(v ?? "") : d.toLocaleString();
    }
    // lat/lon
    if (/(^lat(itude)?$)/i.test(k)) {
      const n = asNum(v); if (n == null) return String(v ?? "—");
      return `${Math.abs(n).toFixed(5)}° ${n >= 0 ? "N" : "S"}`;
    }
    if (/^(lon(gitude)?|lng)$/i.test(k)) {
      const n = asNum(v); if (n == null) return String(v ?? "—");
      return `${Math.abs(n).toFixed(5)}° ${n >= 0 ? "E" : "W"}`;
    }
    // speed
    if (/^(speed|sog|knots|kts)$/i.test(k)) {
      const n = asNum(v); if (n == null) return String(v ?? "—");
      if (units.speed === "kn")  return `${n.toFixed(1)} kn`;
      if (units.speed === "kmh") return `${(n * 1.852).toFixed(1)} km/h`;
      return `${(n * 0.514444).toFixed(1)} m/s`;
    }
    // heading
    if (/^(heading|cog|course)$/i.test(k)) {
      const n = asNum(v); if (n == null) return String(v ?? "—");
      return `${n.toFixed(0)}°`;
    }
    // altitude
    if (/^(alt|altitude)$/i.test(k)) {
      const n = asNum(v); if (n == null) return String(v ?? "—");
      return units.altitude === "m" ? `${n.toFixed(0)} m` : `${(n * 3.28084).toFixed(0)} ft`;
    }
    // generic
    if (typeof v === "number") return v.toFixed(precision);
    if (typeof v === "string") return v;
    if (v == null) return "—";
    return JSON.stringify(v);
  }

  // --- styles ---
  const wrapStyle: Partial<CSSStyleDeclaration> = {
    position: "fixed",
    right: "16px",
    top: "16px",
    zIndex: "9999",
    pointerEvents: "none", // only the tray is clickable
  };
  const tabW = 28; // visible tab width when collapsed
  const trayStyle = (): Partial<CSSStyleDeclaration> => ({
    "--tab": `${tabW}px`,
    position: "relative",
    pointerEvents: "auto",
    transformOrigin: "right center",
    transform: open() ? "translateX(0)" : `translateX(calc(100% - var(--tab)))`,
    transition: "transform 220ms ease",
  } as any);

  const cardStyle: Partial<CSSStyleDeclaration> = {
    background: "rgba(15,23,42,0.78)",
    color: "#e5eefc",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    padding: "10px 12px",
    maxWidth: "80vw",
    overflow: "auto",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: "12px",
    lineHeight: "1.35",
    position: "relative",
    cursor: "pointer",
  };

  // right-edge tab that is always clickable/visible
  const tabStyle: Partial<CSSStyleDeclaration> = {
    position: "absolute",
    top: "0",
    right: "0",
    width: `${tabW}px`,
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#a5b4fc",
    background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.12))",
    borderTopRightRadius: "12px",
    borderBottomRightRadius: "12px",
    pointerEvents: "none", // click anywhere on card to toggle
  };

  const tableStyle: Partial<CSSStyleDeclaration> = {
    borderCollapse: "separate",
    borderSpacing: "0 6px",
    whiteSpace: "nowrap",
  };
  const thStyle: Partial<CSSStyleDeclaration> = { color: "#a5b4fc", padding: "2px 8px", textAlign: "left" };
  const tdStyle: Partial<CSSStyleDeclaration> = { padding: "2px 8px", color: "#e5eefc" };

  var p = parsed();

  return (
    <div style={wrapStyle}>
      <div style={trayStyle()}>
        <div
          style={cardStyle}
          role="button"
          aria-expanded={open()}
          title="Click to expand/collapse"
          onClick={() => setOpen(!open())}
        >
          {/* always-visible right tab (chevron) */}
          <div style={tabStyle}>{open() ? "»" : "«"}</div>

          {!p.ok ? (
            <div style={{ color: "#fca5a5" }}>Parse error: {p.err}</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  {keys().map((k) => (
                    <th style={thStyle}>{fmtKey(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {keys().map((k) => (
                    <td style={tdStyle}>{fmtVal(k, (parsed().obj as any)[k])}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
