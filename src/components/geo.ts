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
function normalizeBearing(deg: number) { return (deg % 360 + 360) % 360; }

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
  const initial = normalizeBearing(toDeg(θ1));

  // Final bearing = back azimuth at destination
  // (bearing from 'to' back to 'from', flipped 180°)
  const y2 = Math.sin(-Δλ) * Math.cos(φ1);
  const x2 = Math.cos(φ2) * Math.sin(φ1) -
             Math.sin(φ2) * Math.cos(φ1) * Math.cos(-Δλ);
  const θ2 = Math.atan2(y2, x2);
  const final = normalizeBearing(toDeg(θ2) + 180);

  return {
    distance: distanceM * UNIT_FACTOR[unit],
    initialBearing: initial,
    finalBearing: final,
    centralAngle: c,
  };
}
