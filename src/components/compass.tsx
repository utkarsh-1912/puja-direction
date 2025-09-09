"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** degrees from North (0–359) to face */
  targetBearing: number;
};

function normalize(deg: number) {
  return (deg % 360 + 360) % 360;
}

function shortestRotation(from: number, to: number) {
  let diff = normalize(to - from);
  if (diff > 180) diff -= 360;
  return from + diff;
}

export default function Compass({ targetBearing }: Props) {
  const [heading, setHeading] = useState<number | null>(null);
  const [displayHeading, setDisplayHeading] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const anyDO = DeviceOrientationEvent as any;
      if (typeof anyDO?.requestPermission === "function") {
        try {
          const res = await anyDO.requestPermission();
          if (res !== "granted") {
            setPermissionError("Motion/Orientation permission denied.");
            return;
          }
        } catch {
          setPermissionError("Motion/Orientation permission blocked.");
          return;
        }
      }

      const handler = (e: DeviceOrientationEvent) => {
        const wch = (e as any).webkitCompassHeading;
        let newHeading: number | null = null;

        if (typeof wch === "number" && !Number.isNaN(wch)) {
          newHeading = normalize(wch);
        } else if (typeof e.alpha === "number") {
          newHeading = normalize(360 - e.alpha);
        }

        if (newHeading != null) {
          setHeading(newHeading);
        }
      };

      window.addEventListener("deviceorientation", handler, true);
      cleanup = () => window.removeEventListener("deviceorientation", handler, true);
    };

    init();
    return () => { cleanup?.(); };
  }, []);

  // Smooth animation between heading changes
  useEffect(() => {
    if (heading == null) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const duration = 200; // ms
    const start = performance.now();
    const from = displayHeading;
    const to = shortestRotation(from, heading);

    const animate = (t: number) => {
      const progress = Math.min((t - start) / duration, 1);
      const current = from + (to - from) * progress;
      setDisplayHeading(normalize(current));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [heading]);

  const delta = useMemo(() => {
    if (heading == null) return null;
    const d = normalize(targetBearing - heading);
    return d > 180 ? d - 360 : d;
  }, [heading, targetBearing]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-72 md:w-80 md:h-80">
        <div className="absolute inset-0 rounded-full border-8 border-slate-200 shadow-inner" />
        <DirectionTicks />

        {/* Cardinal markers */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-semibold">N</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold">E</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold">S</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold">W</div>

        {/* Smooth North needle */}
        <div
          className="absolute left-1/2 top-1/2 origin-bottom transition-transform duration-200 ease-out"
          style={{
            width: 0,
            height: 0,
            transform: `translate(-50%,-100%) rotate(${displayHeading}deg)`,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "120px solid rgba(30,64,175,0.9)",
          }}
        />

        {/* Target arrow */}
        <div
          className="absolute left-1/2 top-1/2 origin-bottom"
          style={{
            width: 0,
            height: 0,
            transform: `translate(-50%,-100%) rotate(${targetBearing}deg)`,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "90px solid rgba(220,38,38,0.9)",
          }}
        />

        {/* Center hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 shadow" />
      </div>

      <div className="mt-4 text-center">
        {heading == null ? (
          <div className="text-sm text-slate-600">
            {permissionError ?? "Move your device gently; ensure compass permission is allowed."}
          </div>
        ) : (
          <>
            <div className="text-lg font-semibold">Heading: {Math.round(heading)}°</div>
            <div className="text-sm text-slate-600">
              Rotate until the red target arrow aligns with the blue needle.
            </div>
            {typeof delta === "number" && (
              <div className="mt-2 inline-block rounded-xl bg-slate-100 px-3 py-1 text-sm">
                Adjust: {delta > 0 ? "↻" : "↺"} {Math.abs(Math.round(delta))}°
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DirectionTicks() {
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <>
      {ticks.map((deg) => {
        const long = deg % 90 === 0;
        const style = {
          transform: `translate(-50%,-100%) rotate(${deg}deg)`,
          height: long ? "14px" : "8px",
          width: "2px",
        } as React.CSSProperties;
        return (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 origin-bottom bg-slate-400"
            style={style}
          />
        );
      })}
    </>
  );
}
