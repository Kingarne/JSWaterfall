// geo.ts
export type LatLon = { lat: number; lon: number };
export type Unit = "m" | "km" | "mi" | "nm";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// Mean Earth radius (spherical model)
const R_EARTH_M = 6_371_008.8; // meters

const UNIT_FACTOR: Record<Unit, number> = {
  m: 1,
  km: 1 / 1_000,
  mi: 1 / 1_609.344,
  nm: 1 / 1_852,
};

function toRad(deg: number) { return deg * DEG2RAD; }
function toDeg(rad: number) { return rad * RAD2DEG; }
function normBearing(deg: number) { return (deg % 360 + 360) % 360; }

const normLon = (deg: number) => {
  // normalize to [-180, 180)
  let d = ((deg + 180) % 360 + 360) % 360 - 180;
  // handle -180 vs 180 preference if needed
  return d;
};

/**
 * Great-circle distance and bearings on a sphere (haversine + initial/final bearings).
 *
 * @param from   { lat, lon }   degrees
 * @param to     { lat, lon }   degrees
 * @param opts   unit (default "m") and/or custom radius in meters
 * @returns      { distance, initialBearing, finalBearing, centralAngle }
 */
export function greatCircle(
  from: LatLon,
  to: LatLon,
  opts?: { unit?: Unit; radiusM?: number }
): {
  distance: number;          // in requested unit
  initialBearing: number;    // deg, 0..360 (from 'from' toward 'to')
  finalBearing: number;      // deg, 0..360 (on arrival, direction of travel)
  centralAngle: number;      // radians
} {
  const unit = opts?.unit ?? "m";
  const R = opts?.radiusM ?? R_EARTH_M;

  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δφ = φ2 - φ1;
  const Δλ = toRad(to.lon - from.lon);

  // Haversine
  let a = Math.sin(Δφ / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  // Guard tiny FP drift
  a = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // central angle

  const distanceM = R * c;

  // Initial bearing (forward azimuth)
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ1 = Math.atan2(y, x);
  const initial = normBearing(toDeg(θ1));

  // Final bearing = back azimuth at destination
  // (bearing from 'to' back to 'from', flipped 180°)
  const y2 = Math.sin(-Δλ) * Math.cos(φ1);
  const x2 = Math.cos(φ2) * Math.sin(φ1) -
             Math.sin(φ2) * Math.cos(φ1) * Math.cos(-Δλ);
  const θ2 = Math.atan2(y2, x2);
  const final = normBearing(toDeg(θ2) + 180);

  return {
    distance: distanceM * UNIT_FACTOR[unit],
    initialBearing: initial,
    finalBearing: final,
    centralAngle: c,
  };
}

/**
 * One intermediate point at fraction f (0..1) along the great circle.
 * Spherical Earth; numerically stable for nearly-coincident points.
 */
export function intermediatePoint(
  from: LatLon,
  to: LatLon,
  fraction: number,
  opts?: { clamp?: boolean }
): LatLon {
  const f = opts?.clamp === false ? fraction : Math.min(1, Math.max(0, fraction));

  const φ1 = toRad(from.lat), λ1 = toRad(from.lon);
  const φ2 = toRad(to.lat),   λ2 = toRad(to.lon);

  // central angle (haversine)
  const Δφ = φ2 - φ1;
  const Δλ = λ2 - λ1;
  let a = Math.sin(Δφ / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  a = Math.min(1, Math.max(0, a));
  const δ = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // If points are (almost) identical, return start
  if (δ < 1e-12) return { lat: from.lat, lon: from.lon };

  const sinδ = Math.sin(δ);
  // spherical linear interpolation coefficients
  const A = Math.sin((1 - f) * δ) / sinδ;
  const B = Math.sin(f * δ) / sinδ;

  // interpolate on the unit sphere
  const x =
    A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y =
    A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);

  const φi = Math.atan2(z, Math.hypot(x, y));
  const λi = Math.atan2(y, x);

  return { lat: toDeg(φi), lon: normLon(toDeg(λi)) };
}

/** Many arbitrary fractions in one call. */
export function intermediatePoints(
  from: LatLon,
  to: LatLon,
  fractions: number[],
  opts?: { clamp?: boolean }
): LatLon[] {
  return fractions.map((f) => intermediatePoint(from, to, f, opts));
}

/**
 * n evenly spaced intermediate points (not including endpoints by default).
 * If includeEndpoints=true, returns n points INCLUDING start and end.
 */
export function nIntermediatePoints(
  from: LatLon,
  to: LatLon,
  n: number,
  opts?: { includeEndpoints?: boolean }
): LatLon[] {
  const m = Math.max(0, Math.floor(n));
  if (m === 0) return [];
  const pts: LatLon[] = [];
  if (opts?.includeEndpoints) {
    for (let i = 0; i < m; i++) {
      const f = (m === 1) ? 0 : i / (m - 1); // 0..1 inclusive
      pts.push(intermediatePoint(from, to, f));
    }
  } else {
    // strictly between (0,1): fractions = 1..m / (m+1)
    for (let i = 1; i <= m; i++) {
      const f = i / (m + 1);
      pts.push(intermediatePoint(from, to, f));
    }
  }
  return pts;
}

/**
 * Destination point on a great circle from `from`, after traveling `distance`
 * at `initialBearingDeg` (degrees clockwise from north).
 *
 * @param from  start position { lat, lon } in degrees
 * @param initialBearingDeg  initial bearing (deg)
 * @param distance  path length in the given unit (default meters)
 * @param opts  { unit?: "m"|"km"|"mi"|"nm", radiusM?: number }
 * @returns { lat, lon } in degrees (lon normalized to [-180,180))
 */
export function destinationPoint(
  from: LatLon,
  initialBearingDeg: number,
  distance: number,
  opts?: { unit?: Unit; radiusM?: number }
): LatLon {
  const unit = opts?.unit ?? "m";
  const R = opts?.radiusM ?? R_EARTH_M;

  // convert distance (unit → meters) and to central angle δ
  const distMeters = distance / UNIT_FACTOR[unit];
  const δ = distMeters / R;

  const φ1 = toRad(from.lat);
  const λ1 = toRad(from.lon);
  const θ = toRad(normBearing(initialBearingDeg));

  const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ),   cosδ = Math.cos(δ);
  const sinθ = Math.sin(θ),   cosθ = Math.cos(θ);

  // latitude
  let sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
  // guard FP drift
  sinφ2 = Math.min(1, Math.max(-1, sinφ2));
  const φ2 = Math.asin(sinφ2);

  // longitude
  const y = sinθ * sinδ * cosφ1;
  const x = cosδ - sinφ1 * Math.sin(φ2);
  const λ2 = λ1 + Math.atan2(y, x);

  return { lat: toDeg(φ2), lon: normLon(toDeg(λ2)) };
}