"use client";

import { useEffect, useMemo, useState } from "react";
import Compass from "@/components/Compass";
import { getSuggestion, type PujaContext, TRADITIONS } from "@/lib/vastuRules";
import useGeolocation from "@/hooks/useGeolocation";
import SunCalc from "suncalc";

export default function HomePage() {
  const [tradition, setTradition] = useState<PujaContext["tradition"]>("east_common");
  const [ritual, setRitual] = useState<PujaContext["ritual"]>("daily_puja");
  const [date, setDate] = useState(() => new Date());
  const { coords, error: geoError, isLoading: geoLoading } = useGeolocation();

  // recompute periodically to keep time fresh
  useEffect(() => {
    const t = setInterval(() => setDate(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const sunInfo = useMemo(() => {
    if (!coords) return null;
    const { latitude, longitude } = coords;
    const times = SunCalc.getTimes(date, latitude, longitude);
    const pos = SunCalc.getPosition(date, latitude, longitude);
    return { times, pos };
  }, [coords, date]);

  const suggestion = useMemo(() => {
    return getSuggestion({
      tradition,
      ritual,
      now: date,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      sunInfo,
    });
  }, [tradition, ritual, date, coords, sunInfo]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Puja Direction Finder</h1>
        <p className="text-sm text-slate-600 mt-1">
          Uses your device compass, location, and time to help you align as per your selected tradition.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="p-4 rounded-2xl shadow-sm border bg-white">
          <label className="block text-sm font-medium mb-1">Tradition</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={tradition}
            onChange={(e) => setTradition(e.target.value as any)}
          >
            {TRADITIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">{TRADITIONS.find(t => t.value === tradition)?.hint}</p>
        </div>

        <div className="p-4 rounded-2xl shadow-sm border bg-white">
          <label className="block text-sm font-medium mb-1">Ritual / Context</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={ritual}
            onChange={(e) => setRitual(e.target.value as any)}
          >
            <option value="daily_puja">Daily Puja</option>
            <option value="sandhya">Sandhyā (evening)</option>
            <option value="meditation">Meditation/Dhyāna</option>
          </select>
          <p className="text-xs text-slate-500 mt-2">
            Choose what you’re about to perform (affects direction suggestion).
          </p>
        </div>

        <div className="p-4 rounded-2xl shadow-sm border bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Location</div>
              {geoLoading ? (
                <div className="text-xs mt-1">Detecting…</div>
              ) : coords ? (
                <div className="text-xs mt-1">
                  {coords.latitude.toFixed(3)}°, {coords.longitude.toFixed(3)}°
                </div>
              ) : (
                <div className="text-xs mt-1 text-rose-600">
                  {geoError ? geoError : "Location not available."}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Time</div>
              <div className="text-xs mt-1">{date.toLocaleString()}</div>
            </div>
          </div>
          {sunInfo && (
            <div className="text-xs text-slate-500 mt-2">
              Sunrise: {sunInfo.times.sunrise?.toLocaleTimeString?.() ?? "-"} ·
              Sunset: {sunInfo.times.sunset?.toLocaleTimeString?.() ?? "-"}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl shadow-sm border bg-white p-4">
          <Compass targetBearing={suggestion.targetBearing} />
        </div>

        <div className="rounded-2xl shadow-sm border bg-white p-4">
          <h2 className="text-xl font-semibold">Suggested Direction</h2>
          <div className="mt-2">
            <div className="text-3xl font-bold">{suggestion.label}</div>
            <div className="text-sm text-slate-600 mt-1">
              Aim for bearing <span className="font-semibold">{Math.round(suggestion.targetBearing)}°</span>{" "}
              (0° = North, 90° = East).
            </div>
            <ul className="list-disc ml-5 mt-3 text-sm text-slate-700 space-y-1">
              {suggestion.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Tip: Device compass works best away from metal/magnets and on HTTPS (secure context). iOS may ask for motion & orientation permission.
          </div>
        </div>
      </section>

      <footer className="mt-8 text-xs text-slate-500">
        Direction preferences vary by sampradāya/household. This tool provides configurable, commonly accepted options—please follow your family guru/ācārya if it differs.
      </footer>
    </main>
  );
}
