"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WorldTimeResponse } from "@/types/game";
import * as api from "@/lib/api";

interface WorldTimeDisplayProps {
  worldId: string;
  realmId?: string;
}

const WEATHER_ICONS: Record<string, string> = {
  // Standard
  sunny: "☀",
  clear: "☀",
  cloudy: "☁",
  overcast: "☁",
  rain: "🌧",
  thunderstorm: "⛈",
  storm: "⛈",
  snow: "❄",
  blizzard: "❄",
  fog: "🌫",
  mist: "🌫",
  windy: "💨",
  hot: "🔥",
  cold: "🥶",
  // Sci-fi
  smog: "🌫",
  acid_rain: "☢",
  neon_haze: "✨",
  electromagnetic_storm: "⚡",
  // Romance
  romantic_rain: "🌧",
  cherry_blossoms: "🌸",
  beach_weather: "🏖",
  starry_night: "✨",
  warm_evening: "🌅",
  crisp: "🍂",
  colorful: "🍂",
  cozy: "🔥",
  light_rain: "🌧",
  fireplace_weather: "🔥",
  holiday_lights: "✨",
  breezy: "💨",
};

const TIME_OF_DAY_ICONS: Record<string, string> = {
  dawn: "🌅",
  morning: "☀",
  afternoon: "☀",
  evening: "🌆",
  night: "🌙",
  twilight: "🌆",
  underground: "⛏",
  artificial_day: "💡",
};

function formatTime12hr(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "am" : "pm";
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m}${ampm}`;
}

function formatTurningCountdown(seconds: number): string {
  if (seconds <= 0) return "now";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function WorldTimeDisplay({ worldId, realmId }: WorldTimeDisplayProps) {
  const [serverTime, setServerTime] = useState<WorldTimeResponse | null>(null);
  const [displayTime, setDisplayTime] = useState<{ hour: number; minute: number } | null>(null);
  const [turningSeconds, setTurningSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedAtRef = useRef<number>(0);

  const fetchTime = useCallback(async () => {
    try {
      const data = await api.getWorldTime(worldId, realmId);
      setServerTime(data);
      setDisplayTime({ hour: data.hour, minute: data.minute });
      setTurningSeconds(data.seconds_until_turning ?? null);
      fetchedAtRef.current = Date.now();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load time");
    }
  }, [worldId, realmId]);

  // Initial fetch
  useEffect(() => {
    fetchTime();
  }, [fetchTime]);

  // Re-poll every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchTime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTime]);

  // Local time calculation tick (every minute of real time)
  useEffect(() => {
    if (!serverTime) return;

    const interval = setInterval(() => {
      const realMsElapsed = Date.now() - fetchedAtRef.current;
      const gameMsElapsed = realMsElapsed * serverTime.time_speed;
      const gameMinutesElapsed = gameMsElapsed / 60000;

      let totalMinutes = serverTime.hour * 60 + serverTime.minute + gameMinutesElapsed;
      const hour = Math.floor(totalMinutes / 60) % 24;
      const minute = Math.floor(totalMinutes) % 60;

      setDisplayTime({ hour, minute });

      // Update turning countdown
      if (serverTime.seconds_until_turning !== undefined) {
        const elapsedSeconds = Math.floor(realMsElapsed / 1000);
        const remaining = Math.max(0, serverTime.seconds_until_turning - elapsedSeconds);
        setTurningSeconds(remaining);
      }
    }, 1000); // Every second for smooth updates at high time_speed

    return () => clearInterval(interval);
  }, [serverTime]);

  if (error) {
    return null; // Fail silently - time/weather is non-critical
  }

  if (!serverTime || !displayTime) {
    return (
      <div className="mt-2 text-[var(--mist)] text-xs animate-pulse">
        Loading...
      </div>
    );
  }

  const weatherIcon = WEATHER_ICONS[serverTime.weather] || "";
  const timeIcon = TIME_OF_DAY_ICONS[serverTime.time_of_day] || "";

  return (
    <div className="mt-2 space-y-1 text-xs">
      {/* Time + Weather row */}
      <div className="flex items-center justify-between text-[var(--fog)]">
        <span>
          {timeIcon} {formatTime12hr(displayTime.hour, displayTime.minute)}
        </span>
        <span className="text-[var(--mist)] capitalize">
          {weatherIcon} {serverTime.weather.replace(/_/g, " ")}
        </span>
      </div>

      {/* Turning countdown */}
      {turningSeconds !== null && (
        <div className="text-[var(--mist)] text-[10px]">
          The Turning in {formatTurningCountdown(turningSeconds)}
        </div>
      )}
    </div>
  );
}
