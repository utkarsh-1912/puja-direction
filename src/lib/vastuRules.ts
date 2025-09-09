export type PujaContext = {
  tradition: "east_common" | "north" | "northeast" | "west_evening";
  ritual: "daily_puja" | "sandhya" | "meditation";
  now: Date;
  latitude?: number;
  longitude?: number;
  sunInfo?: {
    times: any;
    pos: { azimuth: number; altitude: number };
  } | null;
};

export const TRADITIONS = [
  { value: "east_common", label: "East (common recommendation)", hint: "Often preferred for many daily pujas." },
  { value: "north", label: "North (some traditions)", hint: "Preferred by some lineages/contexts." },
  { value: "northeast", label: "North-East / Iśāna", hint: "Considered auspicious in many Vāstu guidelines." },
  { value: "west_evening", label: "West (evening sandhyā)", hint: "Commonly used for evening sandhyā." },
] as const;

const BEARINGS: Record<PujaContext["tradition"], number> = {
  east_common: 90,
  north: 0,
  northeast: 45,
  west_evening: 270,
};

export function getSuggestion(ctx: PujaContext) {
  // Base by tradition
  let bearing = BEARINGS[ctx.tradition];
  let label = bearingToLabel(bearing);
  const notes: string[] = [];

  // Light logic based on ritual/time:
  if (ctx.ritual === "sandhya" && ctx.tradition === "east_common") {
    // If evening sandhyā but user left tradition as 'east_common', gently steer to West.
    bearing = 270;
    label = "West (270°)";
    notes.push("For evening sandhyā, facing West is commonly observed.");
  }

  // Sun-awareness: add info if we know it.
  if (ctx.sunInfo?.pos) {
    const altDeg = (ctx.sunInfo.pos.altitude * 180) / Math.PI;
    const isDay = altDeg > 0;
    notes.push(isDay ? "Sun is above the horizon now." : "Sun is below the horizon now.");
  }

  // Location-aware contextual tip
  if (ctx.latitude != null && ctx.longitude != null) {
    notes.push(
      `Location set: ${ctx.latitude.toFixed(3)}°, ${ctx.longitude.toFixed(3)}°.`
    );
  } else {
    notes.push("Enable location for sunrise/sunset awareness.");
  }

  return {
    targetBearing: bearing,
    label: label,
    notes,
  };
}

function bearingToLabel(b: number) {
  const dir = b === 0 ? "North" : b === 45 ? "North-East" : b === 90 ? "East" : b === 270 ? "West" : `${b}°`;
  return `${dir} (${b}°)`;
}
