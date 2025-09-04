// NavTableOverlay.tsx
import { createMemo } from "solid-js";

type Units = { speed?: "kn" | "kmh" | "mps"; altitude?: "m" | "ft" };

export default function NavTableOverlay(props: {
  json: string;                 // JSON string with nav data
  precision?: number;           // number precision for generic numbers (default 2)
  units?: Units;                // optional unit conversion hints
}) {
  const precision = props.precision ?? 2;
  const units: Required<Units> = {
    speed: props.units?.speed ?? "kn",
    altitude: props.units?.altitude ?? "m",
  };

  const parsed = createMemo(() => {
    try {
      const o = JSON.parse(props.json ?? "{}") as Record<string, unknown>;
      if (!o || typeof o !== "object") return { ok: false as const, err: "Not an object" };
      return { ok: true as const, obj: o };
    } catch (e: any) {
      return { ok: false as const, err: e?.message ?? "Parse error" };
    }
  });

  const keys = createMemo(() => {
    if (!parsed().ok) return [] as string[];
    const o = parsed().obj!;
    // show common nav keys first, then the rest alphabetically
    const priority = ["time","timestamp","ts","lat","latitude","lon","lng","longitude","speed","sog","knots","kts","heading","cog","course","alt","altitude"];
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
    if (/(^lat(itude)?$)/i.test(k) && typeof v === "number") {
      const hemi = v >= 0 ? "N" : "S";
      return `${Math.abs(v).toFixed(5)}° ${hemi}`;
    }
    if (/^(lon(gitude)?|lng)$/i.test(k) && typeof v === "number") {
      const hemi = v >= 0 ? "E" : "W";
      return `${Math.abs(v).toFixed(5)}° ${hemi}`;
    }
    // speed
    if (/^(speed|sog|knots|kts)$/i.test(k) && typeof v === "number") {
      if (units.speed === "kn")  return `${v.toFixed(1)} kn`;
      if (units.speed === "kmh") return `${(v * 1.852).toFixed(1)} km/h`;
      return `${(v * 0.514444).toFixed(1)} m/s`; // assume input is kn → m/s
    }
    // heading
    if (/^(heading|cog|course)$/i.test(k) && typeof v === "number") {
      return `${v.toFixed(0)}°`;
    }
    // altitude
    if (/^(alt|altitude)$/i.test(k) && typeof v === "number") {
      if (units.altitude === "m") return `${v.toFixed(0)} m`;
      return `${(v * 3.28084).toFixed(0)} ft`; // assume meters → feet
    }
    // generic numbers
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
    pointerEvents: "none", // overlay doesn't block canvas
  };
  const cardStyle: Partial<CSSStyleDeclaration> = {
    background: "rgba(15,23,42,0.72)",
    color: "#e5eefc",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    padding: "10px 12px",
    maxWidth: "80vw",
    overflow: "auto",
    pointerEvents: "none",
  };
  const tableStyle: Partial<CSSStyleDeclaration> = {
    borderCollapse: "separate",
    borderSpacing: "0 6px",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: "12px",
    lineHeight: "1.35",
    whiteSpace: "nowrap",
  };
  const thStyle: Partial<CSSStyleDeclaration> = {
    color: "#a5b4fc",
    padding: "2px 8px",
    textAlign: "left",
  };
  const tdStyle: Partial<CSSStyleDeclaration> = {
    padding: "2px 8px",
    color: "#e5eefc",
  };

  const p = parsed();

  return (
    <div style={wrapStyle}>
      <div style={cardStyle} aria-live="polite">
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
                  <td style={tdStyle}>{fmtVal(k, (p.obj as any)[k])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
