"use client";

import dynamic from "next/dynamic";
import {
  Activity,
  ArrowRight,
  Bike,
  Flame,
  Footprints,
  History,
  Home,
  MapPin,
  Mountain,
  Play,
  Timer,
  Trophy,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import ActivityTracker, {
  ActivityResult,
} from "./components/ActivityTracker";

type ActivityType =
  | "Running"
  | "Walking"
  | "Cycling"
  | "Hiking";

type Screen =
  | "home"
  | "select"
  | "tracker"
  | "summary"
  | "history"
  | "detail";

type SavedActivity = ActivityResult & {
  id: string;
  date: string;
};

const STORAGE_KEY = "runly_activities";

const LiveRouteMap = dynamic(
  () => import("./components/LiveRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#eef0f2]">
        <div className="text-center text-gray-400">
          <MapPin className="mx-auto mb-2" size={30} />
          <p className="text-sm font-medium">
            Loading map...
          </p>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  const [screen, setScreen] =
    useState<Screen>("home");

  const [selectedActivity, setSelectedActivity] =
    useState<ActivityType>("Running");

  const [completedActivity, setCompletedActivity] =
    useState<ActivityResult | null>(null);

  const [selectedHistoryActivity, setSelectedHistoryActivity] =
    useState<SavedActivity | null>(null);

  const [activities, setActivities] =
    useState<SavedActivity[]>([]);

  /*
   * Load saved activities from localStorage
   * when RUNLY opens.
   */
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setActivities(JSON.parse(saved));
      }
    } catch (error) {
      console.error(
        "Failed to load activities:",
        error
      );
    }
  }, []);

  /*
   * Save activities to localStorage.
   */
  function saveActivities(
    updatedActivities: SavedActivity[]
  ) {
    setActivities(updatedActivities);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedActivities)
    );
  }

  /*
   * Called when an activity is finished.
   */
  function handleFinish(
    result: ActivityResult
  ) {
    const savedActivity: SavedActivity = {
      ...result,
      id: `${Date.now()}`,
      date: new Date().toISOString(),
    };

    const updatedActivities = [
      savedActivity,
      ...activities,
    ];

    saveActivities(
      updatedActivities
    );

    setCompletedActivity(result);

    setScreen("summary");
  }

  /*
   * Delete one activity.
   */
  function deleteActivity(id: string) {
    const updatedActivities =
      activities.filter(
        (activity) =>
          activity.id !== id
      );

    saveActivities(
      updatedActivities
    );
  }

  /*
   * Clear all local activity history.
   */
  function clearHistory() {
    if (
      !window.confirm(
        "Delete all RUNLY activity history?"
      )
    ) {
      return;
    }

    localStorage.removeItem(
      STORAGE_KEY
    );

    setActivities([]);
  }

  /*
   * Calculate total distance.
   */
  const totalDistance =
    activities.reduce(
      (total, activity) =>
        total + activity.distance,
      0
    );

  /*
   * Calculate total active time.
   */
  const totalDuration =
    activities.reduce(
      (total, activity) =>
        total + activity.duration,
      0
    );

  /*
   * Home screen
   */
  if (screen === "home") {
    return (
      <HomeScreen
        activities={activities}
        totalDistance={totalDistance}
        totalDuration={totalDuration}
        onStart={() =>
          setScreen("select")
        }
        onHistory={() =>
          setScreen("history")
        }
      />
    );
  }

  /*
   * Activity selection
   */
  if (screen === "select") {
    return (
      <ActivitySelection
        selectedActivity={
          selectedActivity
        }
        setSelectedActivity={
          setSelectedActivity
        }
        onBack={() =>
          setScreen("home")
        }
        onContinue={() =>
          setScreen("tracker")
        }
      />
    );
  }

  /*
   * GPS tracker
   */
  if (screen === "tracker") {
    return (
      <ActivityTracker
        activity={
          selectedActivity
        }
        onBack={() =>
          setScreen("select")
        }
        onFinish={handleFinish}
      />
    );
  }

  /*
   * Activity summary
   */
  if (
    screen === "summary" &&
    completedActivity
  ) {
    return (
      <ActivitySummary
        result={
          completedActivity
        }
        onDone={() =>
          setScreen("home")
        }
      />
    );
  }

  /*
   * Saved activity details
   */
  if (
    screen === "detail" &&
    selectedHistoryActivity
  ) {
    return (
      <ActivityDetail
        activity={selectedHistoryActivity}
        onBack={() =>
          setScreen("history")
        }
      />
    );
  }

  /*
   * History
   */
  if (screen === "history") {
    return (
      <HistoryScreen
        activities={activities}
        onBack={() =>
          setScreen("home")
        }
        onDelete={
          deleteActivity
        }
        onClear={
          clearHistory
        }
        onOpen={(activity) => {
          setSelectedHistoryActivity(
            activity
          );
          setScreen("detail");
        }}
      />
    );
  }

  return null;
}

/* =====================================================
   HOME SCREEN
===================================================== */

function HomeScreen({
  activities,
  totalDistance,
  totalDuration,
  onStart,
  onHistory,
}: {
  activities: SavedActivity[];
  totalDistance: number;
  totalDuration: number;
  onStart: () => void;
  onHistory: () => void;
}) {
  const weeklyGoal = 25;

  /*
   * For now all saved distance is treated
   * as this week's distance.
   *
   * Later we'll calculate this properly
   * based on dates.
   */
  const weeklyDistance =
    Math.min(
      totalDistance,
      weeklyGoal
    );

  const weeklyPercentage =
    Math.min(
      Math.round(
        (weeklyDistance /
          weeklyGoal) *
          100
      ),
      100
    );

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl">

        {/* Header */}
        <header className="flex items-center justify-between px-6 pb-4 pt-8">
          <div>
            <p className="text-sm text-gray-500">
              RUNLY
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Good evening, Sanjay 👋
            </h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
            S
          </div>
        </header>

        <div className="space-y-5 px-6 pb-28">

          {/* Weekly goal */}
          <section className="rounded-3xl bg-black p-6 text-white">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Weekly goal
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {weeklyDistance.toFixed(
                    1
                  )}{" "}
                  km
                </h2>
              </div>

              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
                {weeklyPercentage}%
              </div>

            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${weeklyPercentage}%`,
                }}
              />
            </div>

            <div className="mt-3 flex justify-between text-xs text-gray-400">
              <span>
                Progress
              </span>

              <span>
                {weeklyDistance.toFixed(
                  1
                )}{" "}
                / {weeklyGoal} km
              </span>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-3">

            <div className="rounded-3xl bg-[#f4f5f7] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                <Timer size={20} />
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Active time
              </p>

              <p className="mt-1 text-xl font-bold">
                {formatDurationCompact(
                  totalDuration
                )}
              </p>
            </div>

            <div className="rounded-3xl bg-[#f4f5f7] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                <Flame size={20} />
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Activities
              </p>

              <p className="mt-1 text-xl font-bold">
                {activities.length}
              </p>
            </div>

          </section>

          {/* Start activity */}
          <button
            type="button"
            onClick={onStart}
            className="flex w-full touch-manipulation items-center justify-between rounded-3xl bg-[#c7ff3d] px-6 py-5 text-left transition hover:scale-[1.01] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                <Play
                  size={20}
                  fill="currentColor"
                />
              </div>

              <div>
                <p className="font-bold">
                  Start activity
                </p>

                <p className="text-sm text-black/60">
                  Run, walk or cycle
                </p>
              </div>

            </div>

            <ArrowRight size={22} />
          </button>

          {/* Recent activity */}
          <section>
            <div className="mb-3 flex items-center justify-between">

              <h2 className="text-lg font-bold">
                Recent activity
              </h2>

              {activities.length >
                0 && (
                <button
                  type="button"
                  onClick={onHistory}
                  className="text-sm font-medium text-gray-500"
                >
                  See all
                </button>
              )}

            </div>

            {activities.length ===
            0 ? (
              <div className="rounded-3xl bg-[#f4f5f7] p-6 text-center">
                <Activity
                  className="mx-auto text-gray-400"
                  size={28}
                />

                <p className="mt-3 font-medium">
                  No activities yet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Complete your first activity
                  to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">

                {activities
                  .slice(0, 3)
                  .map(
                    (activity) => (
                      <ActivityCard
                        key={
                          activity.id
                        }
                        activity={
                          activity
                        }
                      />
                    )
                  )}

              </div>
            )}
          </section>

        </div>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 justify-around border-t bg-white/95 px-4 py-3 backdrop-blur">

          <NavItem
            icon={<Home size={20} />}
            label="Home"
            active
          />

          <NavItem
            icon={
              <History size={20} />
            }
            label="History"
            onClick={onHistory}
          />

          <NavItem
            icon={
              <Activity size={20} />
            }
            label="Record"
            onClick={onStart}
          />

          <NavItem
            icon={
              <Trophy size={20} />
            }
            label="Goals"
          />

        </nav>
      </div>
    </main>
  );
}

/* =====================================================
   ACTIVITY SELECTION
===================================================== */

function ActivitySelection({
  selectedActivity,
  setSelectedActivity,
  onBack,
  onContinue,
}: {
  selectedActivity: ActivityType;
  setSelectedActivity: (
    activity: ActivityType
  ) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const activities = [
    {
      name: "Running" as ActivityType,
      icon: (
        <Activity size={24} />
      ),
      description:
        "Track your run",
    },
    {
      name: "Walking" as ActivityType,
      icon: (
        <Footprints size={24} />
      ),
      description:
        "Track your walk",
    },
    {
      name: "Cycling" as ActivityType,
      icon: <Bike size={24} />,
      description:
        "Track your ride",
    },
    {
      name: "Hiking" as ActivityType,
      icon: (
        <Mountain size={24} />
      ),
      description:
        "Track your hike",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white px-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center gap-4 pt-8">

          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f7]"
          >
            <span className="text-xl">
              ←
            </span>
          </button>

          <div>
            <p className="text-sm text-gray-500">
              RUNLY
            </p>

            <h1 className="text-xl font-bold">
              Choose activity
            </h1>
          </div>

        </div>

        {/* Activities */}
        <div className="mt-8 space-y-3">

          {activities.map(
            (activity) => {
              const selected =
                selectedActivity ===
                activity.name;

              return (
                <button
                  key={
                    activity.name
                  }
                  type="button"
                  onClick={() =>
                    setSelectedActivity(
                      activity.name
                    )
                  }
                  className={`flex w-full touch-manipulation items-center justify-between rounded-3xl border p-5 text-left transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-gray-100 bg-[#f4f5f7]"
                  }`}
                >
                  <div className="flex items-center gap-4">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        selected
                          ? "bg-white text-black"
                          : "bg-white"
                      }`}
                    >
                      {
                        activity.icon
                      }
                    </div>

                    <div>
                      <p className="font-bold">
                        {
                          activity.name
                        }
                      </p>

                      <p
                        className={`mt-1 text-sm ${
                          selected
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        {
                          activity.description
                        }
                      </p>
                    </div>

                  </div>

                  {selected && (
                    <div className="h-3 w-3 rounded-full bg-[#c7ff3d]" />
                  )}

                </button>
              );
            }
          )}

        </div>

        {/* Continue */}
        <button
          type="button"
          onClick={onContinue}
          className="mt-8 flex w-full touch-manipulation items-center justify-between rounded-3xl bg-[#c7ff3d] px-6 py-5 font-bold transition active:scale-[0.98]"
        >
          <span>
            Continue
          </span>

          <ArrowRight size={22} />
        </button>

      </div>
    </main>
  );
}

/* =====================================================
   ACTIVITY SUMMARY
===================================================== */

function ActivitySummary({
  result,
  onDone,
}: {
  result: ActivityResult;
  onDone: () => void;
}) {
  const paceDisplay =
    result.pace > 0
      ? formatPace(
          result.pace
        )
      : "--:--";

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white px-6 shadow-xl">

        <div className="pt-10 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#c7ff3d]">
            <span className="text-2xl">
              ✓
            </span>
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            RUNLY
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Activity complete
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Nice work. Keep moving.
          </p>

        </div>

        {/* Main distance */}
        <section className="mt-8 rounded-[32px] bg-black p-7 text-center text-white">

          <p className="text-sm text-gray-400">
            {result.activity}
          </p>

          <p className="mt-2 text-6xl font-bold tracking-tight">
            {result.distance.toFixed(
              2
            )}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            kilometers
          </p>

        </section>

        {/* Stats */}
        <section className="mt-4 grid grid-cols-2 gap-3">

          <SummaryStat
            label="Duration"
            value={formatDuration(
              result.duration
            )}
          />

          <SummaryStat
            label="Average pace"
            value={`${paceDisplay}/km`}
          />

          <SummaryStat
            label="Calories"
            value={`${result.calories} kcal`}
          />

          <SummaryStat
            label="Activity"
            value={
              result.activity
            }
          />

        </section>

        {/* Completed route map */}
        <section className="mt-4 h-56 overflow-hidden rounded-[32px]">
          <LiveRouteMap
            route={result.route ?? []}
          />
        </section>

        {/* Done */}
        <button
          type="button"
          onClick={onDone}
          className="mt-5 flex w-full items-center justify-center rounded-3xl bg-[#c7ff3d] px-6 py-5 font-bold transition active:scale-[0.98]"
        >
          Back to dashboard
        </button>

        <div className="h-8" />

      </div>
    </main>
  );
}

/* =====================================================
   HISTORY SCREEN
===================================================== */

function HistoryScreen({
  activities,
  onBack,
  onDelete,
  onClear,
  onOpen,
}: {
  activities: SavedActivity[];
  onBack: () => void;
  onDelete: (
    id: string
  ) => void;
  onClear: () => void;
  onOpen: (
    activity: SavedActivity
  ) => void;
}) {
  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white px-6 pb-10 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between pt-8">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f7]"
            >
              <span className="text-xl">
                ←
              </span>
            </button>

            <div>
              <p className="text-sm text-gray-500">
                RUNLY
              </p>

              <h1 className="text-xl font-bold">
                Activity history
              </h1>
            </div>

          </div>

          {activities.length >
            0 && (
            <button
              type="button"
              onClick={onClear}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500"
              aria-label="Clear history"
            >
              <Trash2 size={18} />
            </button>
          )}

        </div>

        {/* Summary */}
        {activities.length >
          0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-3xl bg-black p-5 text-white">
              <p className="text-xs text-gray-400">
                Total activities
              </p>

              <p className="mt-2 text-2xl font-bold">
                {
                  activities.length
                }
              </p>
            </div>

            <div className="rounded-3xl bg-[#c7ff3d] p-5">
              <p className="text-xs text-black/60">
                Total distance
              </p>

              <p className="mt-2 text-2xl font-bold">
                {activities
                  .reduce(
                    (
                      total,
                      activity
                    ) =>
                      total +
                      activity.distance,
                    0
                  )
                  .toFixed(2)}{" "}
                km
              </p>
            </div>

          </div>
        )}

        {/* History */}
        <div className="mt-6 space-y-3">

          {activities.length ===
          0 ? (
            <div className="rounded-3xl bg-[#f4f5f7] p-8 text-center">

              <History
                className="mx-auto text-gray-400"
                size={32}
              />

              <p className="mt-4 font-semibold">
                No activities yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Your completed activities
                will appear here.
              </p>

            </div>
          ) : (
            activities.map(
              (activity) => (
                <HistoryCard
                  key={
                    activity.id
                  }
                  activity={
                    activity
                  }
                  onDelete={() =>
                    onDelete(
                      activity.id
                    )
                  }
                  onOpen={() =>
                    onOpen(activity)
                  }
                />
              )
            )
          )}

        </div>

      </div>
    </main>
  );
}

/* =====================================================
   HISTORY CARD
===================================================== */

function HistoryCard({
  activity,
  onDelete,
  onOpen,
}: {
  activity: SavedActivity;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const date =
    new Date(
      activity.date
    );

  const dateText =
    date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onOpen();
        }
      }}
      className="block w-full cursor-pointer rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
    >

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f5f7]">
            {getActivityIcon(
              activity.activity
            )}
          </div>

          <div>

            <p className="font-bold">
              {
                activity.activity
              }
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {dateText}
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          aria-label="Delete activity"
        >
          <Trash2 size={16} />
        </button>

      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">

        <div className="rounded-2xl bg-[#f4f5f7] p-3">
          <p className="text-[11px] text-gray-500">
            Distance
          </p>

          <p className="mt-1 text-sm font-bold">
            {activity.distance.toFixed(
              2
            )}{" "}
            km
          </p>
        </div>

        <div className="rounded-2xl bg-[#f4f5f7] p-3">
          <p className="text-[11px] text-gray-500">
            Duration
          </p>

          <p className="mt-1 text-sm font-bold">
            {formatDuration(
              activity.duration
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-[#f4f5f7] p-3">
          <p className="text-[11px] text-gray-500">
            Pace
          </p>

          <p className="mt-1 text-sm font-bold">
            {activity.pace >
            0
              ? `${formatPace(
                  activity.pace
                )}/km`
              : "--"}
          </p>
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ACTIVITY DETAIL
==================================================== */

function ActivityDetail({
  activity,
  onBack,
}: {
  activity: SavedActivity;
  onBack: () => void;
}) {
  const date = new Date(activity.date);

  const dateText = date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const timeText = date.toLocaleTimeString(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );

  const paceDisplay =
    activity.pace > 0
      ? `${formatPace(activity.pace)}/km`
      : "--";

  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl">

        <header className="flex items-center gap-4 px-6 pb-4 pt-8">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f7]"
            aria-label="Back to history"
          >
            <span className="text-xl">←</span>
          </button>

          <div>
            <p className="text-sm text-gray-500">
              RUNLY
            </p>
            <h1 className="text-xl font-bold">
              {activity.activity}
            </h1>
          </div>
        </header>

        <div className="px-6 pb-10">

          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {dateText} · {timeText}
            </p>
          </div>

          {/* Route */}
          <section className="mt-5 h-72 overflow-hidden rounded-[32px]">
            <LiveRouteMap
              route={activity.route ?? []}
            />
          </section>

          {/* Distance */}
          <section className="mt-4 rounded-[32px] bg-black p-7 text-center text-white">
            <p className="text-sm text-gray-400">
              Distance
            </p>

            <p className="mt-2 text-6xl font-bold tracking-tight">
              {activity.distance.toFixed(2)}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              kilometers
            </p>
          </section>

          {/* Stats */}
          <section className="mt-4 grid grid-cols-2 gap-3">
            <SummaryStat
              label="Duration"
              value={formatDuration(activity.duration)}
            />

            <SummaryStat
              label="Average pace"
              value={paceDisplay}
            />

            <SummaryStat
              label="Calories"
              value={`${activity.calories} kcal`}
            />

            <SummaryStat
              label="Activity"
              value={activity.activity}
            />
          </section>

          <button
            type="button"
            onClick={onBack}
            className="mt-5 flex w-full items-center justify-center rounded-3xl bg-[#c7ff3d] px-6 py-5 font-bold transition active:scale-[0.98]"
          >
            Back to history
          </button>

        </div>
      </div>
    </main>
  );
}

/* =====================================================
   ACTIVITY CARD
==================================================== */

function ActivityCard({
  activity,
}: {
  activity: SavedActivity;
}) {
  const date =
    new Date(
      activity.date
    );

  const dateText =
    date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
      }
    );

  return (
    <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">

      <div className="flex items-center gap-4">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f5f7]">
          {getActivityIcon(
            activity.activity
          )}
        </div>

        <div>

          <p className="font-semibold">
            {
              activity.activity
            }
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {dateText} ·{" "}
            {activity.distance.toFixed(
              2
            )}{" "}
            km ·{" "}
            {formatDurationCompact(
              activity.duration
            )}
          </p>

        </div>

      </div>

      <p className="text-sm font-semibold">
        {activity.pace >
        0
          ? `${formatPace(
              activity.pace
            )}/km`
          : "--"}
      </p>

    </div>
  );
}

/* =====================================================
   SUMMARY STAT
===================================================== */

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f4f5f7] p-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   NAV ITEM
===================================================== */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-1 text-xs ${
        active
          ? "font-semibold text-black"
          : "text-gray-400"
      }`}
    >
      {icon}

      <span>
        {label}
      </span>

    </button>
  );
}

/* =====================================================
   ACTIVITY ICON
===================================================== */

function getActivityIcon(
  activity: ActivityType
) {
  switch (activity) {
    case "Walking":
      return (
        <Footprints size={20} />
      );

    case "Cycling":
      return (
        <Bike size={20} />
      );

    case "Hiking":
      return (
        <Mountain size={20} />
      );

    case "Running":
    default:
      return (
        <Activity size={20} />
      );
  }
}

/* =====================================================
   FORMAT DURATION
===================================================== */

function formatDuration(
  seconds: number
) {
  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs =
    seconds % 60;

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

/* =====================================================
   COMPACT DURATION
===================================================== */

function formatDurationCompact(
  seconds: number
) {
  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/* =====================================================
   FORMAT PACE
===================================================== */

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

  const minutes =
    Math.floor(
      paceMinutes
    );

  const seconds =
    Math.round(
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