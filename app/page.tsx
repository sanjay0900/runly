"use client";

import {
  Activity,
  ArrowRight,
  Bike,
  Flame,
  Footprints,
  History,
  Home,
  Mountain,
  Play,
  Timer,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import ActivityTracker from "./components/ActivityTracker";

type ActivityType = "Running" | "Walking" | "Cycling" | "Hiking";

type Screen = "home" | "select" | "tracker";

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("home");

  const [selectedActivity, setSelectedActivity] =
    useState<ActivityType>("Running");

  // Activity selection screen
  if (screen === "select") {
    return (
      <ActivitySelection
        selectedActivity={selectedActivity}
        setSelectedActivity={setSelectedActivity}
        onBack={() => setScreen("home")}
        onContinue={() => setScreen("tracker")}
      />
    );
  }

  // GPS tracker screen
  if (screen === "tracker") {
    return (
      <ActivityTracker
        activity={selectedActivity}
        onBack={() => setScreen("select")}
        onFinish={() => setScreen("home")}
      />
    );
  }

  // Home dashboard
  return (
    <main className="min-h-screen bg-[#f4f5f7] text-[#111318]">
      <div className="mx-auto min-h-screen max-w-md bg-white shadow-xl">
        {/* Header */}
        <header className="flex items-center justify-between px-6 pb-4 pt-8">
          <div>
            <p className="text-sm text-gray-500">RUNLY</p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Good evening, Sanjay 👋
            </h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
            S
          </div>
        </header>

        {/* Main content */}
        <div className="space-y-5 px-6 pb-28">
          {/* Weekly goal */}
          <section className="rounded-3xl bg-black p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">Weekly goal</p>

                <h2 className="mt-1 text-3xl font-bold">18.4 km</h2>
              </div>

              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
                73%
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-[73%] rounded-full bg-white" />
            </div>

            <div className="mt-3 flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span>18.4 / 25 km</span>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-[#f4f5f7] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                <Timer size={20} />
              </div>

              <p className="mt-4 text-sm text-gray-500">Active time</p>

              <p className="mt-1 text-xl font-bold">2h 14m</p>
            </div>

            <div className="rounded-3xl bg-[#f4f5f7] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                <Flame size={20} />
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Current streak
              </p>

              <p className="mt-1 text-xl font-bold">6 days</p>
            </div>
          </section>

          {/* Start activity */}
          <button
            type="button"
            onClick={() => setScreen("select")}
            className="flex w-full touch-manipulation items-center justify-between rounded-3xl bg-[#c7ff3d] px-6 py-5 text-left transition hover:scale-[1.01] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                <Play size={20} fill="currentColor" />
              </div>

              <div>
                <p className="font-bold">Start activity</p>

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
              <h2 className="text-lg font-bold">Recent activity</h2>

              <button
                type="button"
                className="text-sm font-medium text-gray-500"
              >
                See all
              </button>
            </div>

            <div className="space-y-3">
              <ActivityCard
                icon={<Activity size={20} />}
                title="Morning Run"
                details="Today · 5.2 km · 32 min"
                stat="6:11/km"
              />

              <ActivityCard
                icon={<Footprints size={20} />}
                title="Evening Walk"
                details="Yesterday · 4.1 km · 51 min"
                stat="12:26/km"
              />

              <ActivityCard
                icon={<Activity size={20} />}
                title="Easy Run"
                details="Aug 13 · 3.8 km · 25 min"
                stat="6:34/km"
              />
            </div>
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
            icon={<History size={20} />}
            label="History"
          />

          <NavItem
            icon={<Activity size={20} />}
            label="Record"
            onClick={() => setScreen("select")}
          />

          <NavItem
            icon={<Trophy size={20} />}
            label="Goals"
          />
        </nav>
      </div>
    </main>
  );
}

function ActivitySelection({
  selectedActivity,
  setSelectedActivity,
  onBack,
  onContinue,
}: {
  selectedActivity: ActivityType;
  setSelectedActivity: (activity: ActivityType) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const activities = [
    {
      name: "Running" as ActivityType,
      icon: <Activity size={24} />,
      description: "Track your run",
    },
    {
      name: "Walking" as ActivityType,
      icon: <Footprints size={24} />,
      description: "Track your walk",
    },
    {
      name: "Cycling" as ActivityType,
      icon: <Bike size={24} />,
      description: "Track your ride",
    },
    {
      name: "Hiking" as ActivityType,
      icon: <Mountain size={24} />,
      description: "Track your hike",
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
            <span className="text-xl">←</span>
          </button>

          <div>
            <p className="text-sm text-gray-500">RUNLY</p>

            <h1 className="text-xl font-bold">Choose activity</h1>
          </div>
        </div>

        {/* Activity options */}
        <div className="mt-8 space-y-3">
          {activities.map((activity) => {
            const selected =
              selectedActivity === activity.name;

            return (
              <button
                key={activity.name}
                type="button"
                onClick={() =>
                  setSelectedActivity(activity.name)
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
                    {activity.icon}
                  </div>

                  <div>
                    <p className="font-bold">
                      {activity.name}
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        selected
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {activity.description}
                    </p>
                  </div>
                </div>

                {selected && (
                  <div className="h-3 w-3 rounded-full bg-[#c7ff3d]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Continue */}
        <button
          type="button"
          onClick={onContinue}
          className="mt-8 flex w-full touch-manipulation items-center justify-between rounded-3xl bg-[#c7ff3d] px-6 py-5 font-bold transition active:scale-[0.98]"
        >
          <span>Continue</span>

          <ArrowRight size={22} />
        </button>
      </div>
    </main>
  );
}

function ActivityCard({
  icon,
  title,
  details,
  stat,
}: {
  icon: React.ReactNode;
  title: string;
  details: string;
  stat: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f5f7]">
          {icon}
        </div>

        <div>
          <p className="font-semibold">{title}</p>

          <p className="mt-1 text-xs text-gray-500">
            {details}
          </p>
        </div>
      </div>

      <p className="text-sm font-semibold">{stat}</p>
    </div>
  );
}

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

      <span>{label}</span>
    </button>
  );
}