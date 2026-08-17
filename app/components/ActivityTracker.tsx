"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  MapPin,
  Pause,
  Play,
  Square,
} from "lucide-react";

type ActivityType =
  | "Running"
  | "Walking"
  | "Cycling"
  | "Hiking";

type Position = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export type ActivityResult = {
  activity: ActivityType;
  distance: number;
  duration: number;
  pace: number;
  calories: number;
  steps: number;
  route: Position[];
};

type ActivityTrackerProps = {
  activity: ActivityType;
  onBack: () => void;
  onFinish: (
    result: ActivityResult
  ) => void;
};

/*
 * Load Leaflet only on the client.
 *
 * This prevents Leaflet from being evaluated
 * during Next.js server rendering.
 */
const LiveRouteMap = dynamic(
  () => import("./LiveRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#eef0f2]">
        <div className="text-center text-gray-400">
          <MapPin
            className="mx-auto mb-2"
            size={30}
          />

          <p className="text-sm font-medium">
            Loading map...
          </p>
        </div>
      </div>
    ),
  }
);

function calculateDistance(
  a: Position,
  b: Position
): number {
  const earthRadiusKm = 6371;

  const latitudeDifference =
    ((b.latitude - a.latitude) *
      Math.PI) /
    180;

  const longitudeDifference =
    ((b.longitude - a.longitude) *
      Math.PI) /
    180;

  const latitude1 =
    (a.latitude * Math.PI) /
    180;

  const latitude2 =
    (b.latitude * Math.PI) /
    180;

  const haversine =
    Math.sin(
      latitudeDifference / 2
    ) **
      2 +
    Math.sin(
      longitudeDifference / 2
    ) **
      2 *
      Math.cos(latitude1) *
      Math.cos(latitude2);

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(
        1 - haversine
      )
    );

  return (
    earthRadiusKm *
    angularDistance
  );
}

function formatTime(seconds: number) {
  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(
      hours
    ).padStart(
      2,
      "0"
    )}:${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      secs
    ).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    secs
  ).padStart(
    2,
    "0"
  )}`;
}

function calculatePace(
  distance: number,
  seconds: number
) {
  if (
    distance < 0.1 ||
    seconds <= 0
  ) {
    return 0;
  }

  return (
    seconds / 60 / distance
  );
}

function formatPace(
  paceMinutes: number
) {
  if (
    !Number.isFinite(
      paceMinutes
    ) ||
    paceMinutes <= 0
  ) {
    return "--:--";
  }

  const minutes = Math.floor(
    paceMinutes
  );

  const seconds = Math.round(
    (paceMinutes -
      minutes) *
      60
  );

  if (seconds >= 60) {
    return `${minutes + 1}:00`;
  }

  return `${minutes}:${String(
    seconds
  ).padStart(
    2,
    "0"
  )}`;
}

function estimateCalories(
  activity: ActivityType,
  distance: number,
  durationSeconds: number
) {
  /*
   * Very rough V1 estimates.
   *
   * Later we'll calculate calories using
   * user weight, pace and activity METs.
   */

  const hours =
    durationSeconds / 3600;

  const caloriesPerHour = {
    Running: 650,
    Walking: 280,
    Cycling: 500,
    Hiking: 450,
  };

  return Math.round(
    caloriesPerHour[activity] *
      hours
  );
}

export default function ActivityTracker({
  activity,
  onBack,
  onFinish,
}: ActivityTrackerProps) {
  const [isTracking, setIsTracking] =
    useState(false);

  const [isPaused, setIsPaused] =
    useState(false);

  const [seconds, setSeconds] =
    useState(0);

  const [distance, setDistance] =
    useState(0);

  const [gpsStatus, setGpsStatus] =
    useState("GPS ready");

  const [gpsAccuracy, setGpsAccuracy] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  /*
   * NEW:
   * Complete GPS route.
   */
  const [route, setRoute] =
    useState<Position[]>([]);

  const [steps, setSteps] =
    useState(0);

  const [stepStatus, setStepStatus] =
    useState("Step sensor ready");

  const watchId =
    useRef<number | null>(null);

  const lastPosition =
    useRef<Position | null>(null);

  const distanceRef =
    useRef(0);

  const stepsRef =
    useRef(0);

  const lastMotionMagnitude =
    useRef<number | null>(null);

  const filteredMotionMagnitude =
    useRef<number | null>(null);

  const lastMotionSignal =
    useRef(0);

  const lastStepTimestamp =
    useRef(0);

  /*
   * Timer
   */
  useEffect(() => {
    if (
      !isTracking ||
      isPaused
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        setSeconds(
          (current) =>
            current + 1
        );
      }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    isTracking,
    isPaused,
  ]);

  /*
   * Experimental browser step counter — V1.1.
   *
   * Keeps the approach that worked in the first phone test,
   * but lowers the movement threshold so pocket walking has
   * a better chance of being detected.
   *
   * This is still an estimate, not a native health-platform
   * step counter.
   */
  useEffect(() => {
    if (
      !isTracking ||
      isPaused ||
      activity === "Cycling"
    ) {
      return;
    }

    let cancelled = false;

    async function startMotionTracking() {
      try {
        const MotionEvent =
          window.DeviceMotionEvent as typeof DeviceMotionEvent & {
            requestPermission?: () => Promise<string>;
          };

        if (
          typeof window === "undefined" ||
          !MotionEvent
        ) {
          setStepStatus(
            "Step sensor unavailable"
          );
          return;
        }

        if (
          typeof MotionEvent.requestPermission ===
          "function"
        ) {
          const permission =
            await MotionEvent.requestPermission();

          if (
            permission !== "granted"
          ) {
            setStepStatus(
              "Step permission denied"
            );
            return;
          }
        }

        if (cancelled) {
          return;
        }

        const handleMotion = (
          event: DeviceMotionEvent
        ) => {
          const acceleration =
            event.acceleration ??
            event.accelerationIncludingGravity;

          const x = acceleration?.x;
          const y = acceleration?.y;
          const z = acceleration?.z;

          if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(z)
          ) {
            return;
          }

          const magnitude =
            Math.sqrt(
              x! * x! +
                y! * y! +
                z! * z!
            );

          if (
            lastMotionMagnitude.current ===
            null
          ) {
            lastMotionMagnitude.current =
              magnitude;

            filteredMotionMagnitude.current =
              magnitude;

            return;
          }

          const previousFiltered =
            filteredMotionMagnitude.current ??
            magnitude;

          /*
           * Slow baseline + high-pass movement signal.
           * Magnitude makes detection less dependent on
           * whether the phone is vertical, horizontal,
           * or sitting in a pocket.
           */
          const filtered =
            previousFiltered +
            0.18 *
              (magnitude -
                previousFiltered);

          const signal =
            magnitude -
            filtered;

          const previousSignal =
            lastMotionSignal.current;

          const now =
            performance.now();

          /*
           * V1.1: lower threshold than the previous
           * version so smaller pocket movements can pass.
           */
          const STEP_THRESHOLD = 0.55;
          const MIN_STEP_INTERVAL = 280;

          if (
            signal >
              STEP_THRESHOLD &&
            previousSignal <=
              STEP_THRESHOLD &&
            now -
              lastStepTimestamp.current >
              MIN_STEP_INTERVAL
          ) {
            stepsRef.current += 1;

            setSteps(
              stepsRef.current
            );

            lastStepTimestamp.current =
              now;
          }

          lastMotionMagnitude.current =
            magnitude;

          filteredMotionMagnitude.current =
            filtered;

          lastMotionSignal.current =
            signal;
        };

        window.addEventListener(
          "devicemotion",
          handleMotion
        );

        setStepStatus(
          "Motion sensor connected"
        );

        return () => {
          window.removeEventListener(
            "devicemotion",
            handleMotion
          );
        };
      } catch (motionError) {
        console.error(
          "Motion sensor error:",
          motionError
        );

        setStepStatus(
          "Step sensor unavailable"
        );
      }
    }

    let cleanup:
      | (() => void)
      | undefined;

    startMotionTracking().then(
      (result) => {
        cleanup = result;
      }
    );

    return () => {
      cancelled = true;

      if (cleanup) {
        cleanup();
      }
    };
  }, [
    isTracking,
    isPaused,
    activity,
  ]);

  /*
   * GPS tracking
   */
  useEffect(() => {
    if (
      !isTracking ||
      isPaused
    ) {
      return;
    }

    if (
      !navigator.geolocation
    ) {
      setError(
        "GPS is not supported by this browser."
      );

      setGpsStatus(
        "GPS unavailable"
      );

      return;
    }

    setGpsStatus(
      "Searching for GPS..."
    );

    setError("");

    watchId.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const accuracy =
            position.coords
              .accuracy;

          setGpsAccuracy(
            accuracy
          );

          /*
           * Ignore poor GPS readings.
           */
          if (accuracy > 50) {
            setGpsStatus(
              `GPS accuracy low (${Math.round(
                accuracy
              )}m)`
            );

            return;
          }

          const currentPosition: Position =
            {
              latitude:
                position.coords
                  .latitude,

              longitude:
                position.coords
                  .longitude,

              accuracy,

              timestamp:
                position.timestamp,
            };

          /*
           * First valid reading.
           */
          if (
            !lastPosition.current
          ) {
            lastPosition.current =
              currentPosition;

            /*
             * NEW:
             * Start the route with
             * the first GPS point.
             */
            setRoute([
              currentPosition,
            ]);

            setGpsStatus(
              `GPS connected · ±${Math.round(
                accuracy
              )}m`
            );

            return;
          }

          const previousPosition =
            lastPosition.current;

          const moved =
            calculateDistance(
              previousPosition,
              currentPosition
            );

          const timeDifference =
            Math.max(
              1,
              (currentPosition.timestamp -
                previousPosition.timestamp) /
                1000
            );

          /*
           * Ignore tiny GPS drift.
           */
          if (moved < 0.003) {
            /*
             * Even if the person hasn't moved
             * enough to count distance, update
             * the current route position.
             */
            setRoute(
              (currentRoute) => {
                if (
                  currentRoute.length ===
                  0
                ) {
                  return [
                    currentPosition,
                  ];
                }

                const updated = [
                  ...currentRoute,
                ];

                updated[
                  updated.length - 1
                ] =
                  currentPosition;

                return updated;
              }
            );

            return;
          }

          /*
           * Reject impossible GPS jumps.
           *
           * 12 m/s ≈ 43 km/h.
           */
          const speed =
            (moved * 1000) /
            timeDifference;

          if (speed > 12) {
            setGpsStatus(
              "Ignoring GPS jump..."
            );

            return;
          }

          distanceRef.current +=
            moved;

          setDistance(
            distanceRef.current
          );

          lastPosition.current =
            currentPosition;

          /*
           * NEW:
           * Add valid GPS point
           * to route.
           */
          setRoute(
            (currentRoute) => [
              ...currentRoute,
              currentPosition,
            ]
          );

          setGpsStatus(
            `GPS connected · ±${Math.round(
              accuracy
            )}m`
          );
        },

        (err) => {
          console.error(
            "GPS error:",
            err
          );

          if (err.code === 1) {
            setError(
              "Location permission was denied."
            );
          } else if (
            err.code === 2
          ) {
            setError(
              "Unable to determine your location."
            );
          } else if (
            err.code === 3
          ) {
            setError(
              "GPS request timed out."
            );
          } else {
            setError(
              "Unable to access GPS."
            );
          }

          setGpsStatus(
            "GPS unavailable"
          );
        },

        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 20000,
        }
      );

    return () => {
      if (
        watchId.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current
        );

        watchId.current = null;
      }
    };
  }, [
    isTracking,
    isPaused,
  ]);

  function startTracking() {
    setError("");

    setSeconds(0);

    setDistance(0);

    distanceRef.current = 0;

    lastPosition.current =
      null;

    /*
     * Clear previous route and step count.
     */
    setRoute([]);

    stepsRef.current = 0;
    setSteps(0);

    lastMotionMagnitude.current =
      null;

    filteredMotionMagnitude.current =
      null;

    lastMotionSignal.current =
      0;

    lastStepTimestamp.current =
      0;

    setStepStatus(
      activity === "Cycling"
        ? "Steps not tracked for cycling"
        : "Step sensor ready"
    );

    setIsTracking(true);

    setIsPaused(false);
  }

  function pauseTracking() {
    setIsPaused(true);

    setGpsStatus("Paused");
  }

  function resumeTracking() {
    /*
     * Prevent a large GPS jump
     * after resuming.
     */
    lastPosition.current =
      null;

    lastMotionMagnitude.current =
      null;

    filteredMotionMagnitude.current =
      null;

    lastMotionSignal.current =
      0;

    setIsPaused(false);

    setGpsStatus(
      "Searching for GPS..."
    );
  }

  function finishTracking() {
    setIsTracking(false);

    setIsPaused(false);

    if (
      watchId.current !== null
    ) {
      navigator.geolocation.clearWatch(
        watchId.current
      );

      watchId.current = null;
    }

    const pace =
      calculatePace(
        distanceRef.current,
        seconds
      );

    const calories =
      estimateCalories(
        activity,
        distanceRef.current,
        seconds
      );

    const result: ActivityResult =
      {
        activity,

        distance:
          distanceRef.current,

        duration:
          seconds,

        pace,

        calories,

        steps: stepsRef.current,

        route: [...route],
      };

    onFinish(result);
  }

  const pace =
    calculatePace(
      distance,
      seconds
    );

  const paceDisplay =
    formatPace(pace);

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white px-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center gap-4 pt-8">

          <button
            type="button"
            onClick={onBack}
            disabled={isTracking}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f7] disabled:opacity-40"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <p className="text-sm text-gray-500">
              RUNLY
            </p>

            <h1 className="text-xl font-bold">
              {activity}
            </h1>
          </div>

        </div>

        {/* GPS status */}
        <div className="mt-8 flex items-center gap-2 text-sm">

          <MapPin size={17} />

          <span
            className={
              gpsStatus.includes(
                "GPS connected"
              )
                ? "font-medium text-green-600"
                : "text-gray-500"
            }
          >
            {gpsStatus}
          </span>

        </div>

        {gpsAccuracy !==
          null && (
          <p className="mt-1 pl-6 text-xs text-gray-400">
            GPS accuracy: ±
            {Math.round(
              gpsAccuracy
            )}
            m
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="mt-6 rounded-[32px] bg-black p-6 text-white">

          <p className="text-sm text-gray-400">
            {isPaused
              ? "Activity paused"
              : "Activity time"}
          </p>

          <p className="mt-2 text-5xl font-bold tracking-tight">
            {formatTime(seconds)}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-2">

            {/* Distance */}
            <div className="rounded-2xl bg-white/10 p-3">

              <p className="text-xs text-gray-400">
                Distance
              </p>

              <p className="mt-1 text-2xl font-bold">
                {distance.toFixed(
                  2
                )}
              </p>

              <p className="text-xs text-gray-400">
                km
              </p>

            </div>

            {/* Pace */}
            <div className="rounded-2xl bg-white/10 p-3">

              <p className="text-xs text-gray-400">
                Current pace
              </p>

              <p className="mt-1 text-2xl font-bold">
                {paceDisplay}
              </p>

              <p className="text-xs text-gray-400">
                min/km
              </p>

            </div>

            {/* Steps */}
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-gray-400">
                Steps
              </p>

              <p className="mt-1 text-2xl font-bold">
                {steps.toLocaleString()}
              </p>

              <p className="text-[10px] text-gray-400">
                {stepStatus === "Motion sensor connected"
                  ? "motion"
                  : "beta"}
              </p>
            </div>

          </div>
        </section>

        {/* LIVE ROUTE MAP */}
        <section className="mt-4 h-56 overflow-hidden rounded-[32px]">

          <LiveRouteMap
            route={route}
          />

        </section>

        {/* Controls */}
        {!isTracking ? (
          <button
            type="button"
            onClick={
              startTracking
            }
            className="mt-6 flex w-full touch-manipulation items-center justify-center gap-3 rounded-3xl bg-[#c7ff3d] px-6 py-5 font-bold transition active:scale-[0.98]"
          >
            <Play
              size={20}
              fill="currentColor"
            />

            START
          </button>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">

            {/* Pause / Resume */}
            <button
              type="button"
              onClick={
                isPaused
                  ? resumeTracking
                  : pauseTracking
              }
              className="flex items-center justify-center gap-2 rounded-3xl bg-black px-5 py-5 font-bold text-white transition active:scale-[0.98]"
            >
              {isPaused ? (
                <>
                  <Play
                    size={19}
                    fill="currentColor"
                  />

                  Resume
                </>
              ) : (
                <>
                  <Pause size={19} />

                  Pause
                </>
              )}
            </button>

            {/* Finish */}
            <button
              type="button"
              onClick={
                finishTracking
              }
              className="flex items-center justify-center gap-2 rounded-3xl bg-red-50 px-5 py-5 font-bold text-red-600 transition active:scale-[0.98]"
            >
              <Square
                size={18}
                fill="currentColor"
              />

              Finish
            </button>

          </div>
        )}

        <div className="h-6" />

      </div>
    </main>
  );
}