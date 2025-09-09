"use client";

import { useEffect, useState } from "react";

export default function useGeolocation() {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported.");
      setLoading(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords(pos.coords);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coords, error, isLoading };
}
