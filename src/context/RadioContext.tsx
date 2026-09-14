"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type RadioStation = {
  id: string;
  name: string;
  streamUrl: string;
};

export type RadioStatus = "idle" | "loading" | "playing" | "paused" | "error";

type RadioContextValue = {
  current: RadioStation | null;
  status: RadioStatus;
  isPlaying: boolean;
  /** Same station while playing → pause. Same station while paused/errored → retry. Different station → switch. */
  toggle: (station: RadioStation) => void;
  stop: () => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

/**
 * One audio element, owned here rather than by any page, so switching pages
 * does not tear it down. Mounted once in the locale layout, which the App
 * Router keeps alive across navigation within a locale — that persistence is
 * the entire point: a station started on /radio should keep playing while
 * the reader checks /rates or /jobs.
 *
 * These are small third-party radio relays, not our own infrastructure, so
 * a connection can fail or drop — that must surface as a status the UI can
 * show, not a silently swallowed promise rejection that leaves a "Listen"
 * button looking like it never even tried.
 *
 * Cross-origin iframes (the TuneIn embed) can't be driven this way — this
 * only covers stations we point a plain <audio> element at ourselves.
 */
export function RadioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [status, setStatus] = useState<RadioStatus>("idle");

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onPlaying = () => setStatus("playing");
    const onWaiting = () => setStatus("loading");
    const onPause = () => setStatus((prev) => (prev === "error" ? prev : "paused"));
    const onError = () => setStatus("error");
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = useCallback(
    (station: RadioStation) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (current?.id === station.id && status !== "error") {
        if (audio.paused) void audio.play().catch(() => setStatus("error"));
        else audio.pause();
        return;
      }

      setCurrent(station);
      setStatus("loading");
      audio.src = station.streamUrl;
      audio.load();
      void audio.play().catch(() => setStatus("error"));

      if ("mediaSession" in navigator) {
        // eslint-disable-next-line no-undef -- MediaMetadata is a browser global, not a Node type
        navigator.mediaSession.metadata = new MediaMetadata({
          title: station.name,
          artist: "Hello SG MM Radio",
        });
      }
    },
    [current, status],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    setCurrent(null);
    setStatus("idle");
  }, []);

  // Lock-screen / notification-shade controls on mobile, and the hook other
  // apps and the OS use to know something here is playing audio.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("stop", () => stop());
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
  }, [stop]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = status === "playing" ? "playing" : "paused";
  }, [status]);

  return (
    <RadioContext.Provider
      value={{ current, status, isPlaying: status === "playing", toggle, stop }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio(): RadioContextValue {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}
