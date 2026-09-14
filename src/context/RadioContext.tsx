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

type RadioContextValue = {
  current: RadioStation | null;
  isPlaying: boolean;
  /** Same station while playing → pause. Same station while paused → resume. Different station → switch. */
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
 * Cross-origin iframes (the TuneIn embed) can't be driven this way — this
 * only covers stations we point a plain <audio> element at ourselves.
 */
export function RadioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = useCallback(
    (station: RadioStation) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (current?.id === station.id) {
        if (audio.paused) void audio.play();
        else audio.pause();
        return;
      }

      audio.src = station.streamUrl;
      setCurrent(station);
      void audio.play();

      if ("mediaSession" in navigator) {
        // eslint-disable-next-line no-undef -- MediaMetadata is a browser global, not a Node type
        navigator.mediaSession.metadata = new MediaMetadata({
          title: station.name,
          artist: "Hello SG Radio",
        });
      }
    },
    [current],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    setCurrent(null);
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
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  return (
    <RadioContext.Provider value={{ current, isPlaying, toggle, stop }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio(): RadioContextValue {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}
