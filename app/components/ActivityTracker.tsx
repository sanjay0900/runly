"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Pause,
  Play,
  Square,
} from "lucide-react";

type ActivityType = "Running" | "Walking" | "Cycling" | "Hiking";

type Position = {
  latitude: number;
  longitude: number;
};

type ActivityTrackerProps = {
  activity: ActivityType;
  onBack: () => void;
  onFinish: () => void;
};

function calculateDistance(a: Position, b: Position) {
  const R = 6371;

  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;

  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));

  return R * c;
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours > 0 ? String(hours).padStart(2, "0") : null,
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0"),
  ]
    .filter(Boolean)
    .join(":");
}

export default function ActivityTracker({
  activity,
  onBack,
  onFinish,
}: ActivityTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gpsStatus, setGpsStatus] = useState("Getting GPS...");
  const [error, setError] = useState("");

  const watchId = useRef<number | null>(null);
  const lastPosition = useRef<Position | null>(null);

  // Timer
  useEffect(() => {
    if (!isTracking || isPaused) return;

    const interval = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  // Start GPS
  useEffect(() => {
    if (!isTracking || isPaused) return;

    if (!navigator.geolocation) {
      setError("GPS is not supported by this browser.");
      return;
    }

    setGpsStatus("Searching for GPS...");
    setError("");

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        if (lastPosition.current) {
          const moved = calculateDistance(
            lastPosition.current,
            currentPosition
          );

          // Ignore tiny GPS jumps
          if (moved > 0.003) {
            setDistance((current) => current + moved);
          }
        }

        lastPosition.current = currentPosition;
        setGpsStatus("GPS connected");
      },
      (err) => {
        console.error("GPS error:", err);

        if (err.code === 1) {
          setError("Location permission was denied.");
        } else if (err.code === 2) {
          setError("Unable to determine your location.");
        } else if (err.code === 3) {
          setError("GPS request timed out.");
        } else {
          setError("Unable to access GPS.");
        }

        setGpsStatus("GPS unavailable");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [isTracking, isPaused]);

  function startTracking() {
    setIsTracking(true);
    setIsPaused(false);
  }

  function pauseTracking() {
    setIsPaused(true);
    setGpsStatus("Paused");
  }

  function resumeTracking() {
    setIsPaused(false);
  }

  function finishTracking() {
    setIsTracking(false);
    setIsPaused(false);

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    onFinish();
  }

  const pace =
    distance > 0 && seconds > 0
      ? seconds / 60 / distance
      : 0;

  const paceMinutes = Math.floor(pace);
  const paceSeconds = Math.floor((pace - paceMinutes) * 60);

  const paceDisplay =
    pace > 0
      ? `${paceMinutes}:${String(paceSeconds).padStart(2, "0")}`
      : "--:--";

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white px-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-4 pt-8">
          <button
            onClick={onBack}
            disabled={isTracking}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f7] disabled:opacity-40"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <p className="text-sm text-gray-500">RUNLY</p>
            <h1 className="text-xl font-bold">{activity}</h1>
          </div>
        </div>

        {/* GPS status */}
        <div className="mt-8 flex items-center gap-2 text-sm">
          <MapPin size={17} />

          <span
            className={
              gpsStatus === "GPS connected"
                ? "font-medium text-green-600"
                : "text-gray-500"
            }
          >
            {gpsStatus}
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tracking stats */}
        <section className="mt-6 rounded-[32px] bg-black p-6 text-white">
          <p className="text-sm text-gray-400">
            {isPaused ? "Activity paused" : "Activity time"}
          </p>

          <p className="mt-2 text-5xl font-bold tracking-tight">
            {formatTime(seconds)}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs text-gray-400">Distance</p>
              <p className="mt-1 text-2xl font-bold">
                {distance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">km</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs text-gray-400">Current pace</p>
              <p className="mt-1 text-2xl font-bold">
                {paceDisplay}
              </p>
              <p className="text-xs text-gray-400">min/km</p>
            </div>
          </div>
        </section>

        {/* Map placeholder */}
        <section className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-[32px] bg-[#eef0f2]">
          <div className="text-center text-gray-400">
            <MapPin className="mx-auto mb-2" size={30} />
            <p className="text-sm font-medium">
              Live route map
            </p>
            <p className="mt-1 text-xs">
              Map coming next
            </p>
          </div>
        </section>

        {/* Controls */}
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl bg-[#c7ff3d] px-6 py-5 font-bold"
          >
            <Play size={20} fill="currentColor" />
            START
          </button>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={
                isPaused ? resumeTracking : pauseTracking
              }
              className="flex items-center justify-center gap-2 rounded-3xl bg-black px-5 py-5 font-bold text-white"
            >
              {isPaused ? (
                <>
                  <Play size={19} fill="currentColor" />
                  Resume
                </>
              ) : (
                <>
                  <Pause size={19} />
                  Pause
                </>
              )}
            </button>

            <button
              onClick={finishTracking}
              className="flex items-center justify-center gap-2 rounded-3xl bg-red-50 px-5 py-5 font-bold text-red-600"
            >
              <Square size={18} fill="currentColor" />
              Finish
            </button>
          </div>
        )}
      </div>
    </main>
  );
}