import { useState, useCallback, useEffect } from "react";

export function useWakeLock() {
  const [wantWake, setWantWake] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const acquire = useCallback(async () => {
    if (!("wakeLock" in navigator)) return false;
    try {
      const lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => setIsActive(false));
      setIsActive(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    if ("wakeLock" in navigator) {
      // Release all locks by reloading the state
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    if (wantWake) {
      acquire();
    } else {
      release();
    }
  }, [wantWake, acquire, release]);

  // Re-acquire on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && wantWake) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [wantWake, acquire]);

  const toggle = useCallback(() => {
    setWantWake(prev => !prev);
  }, []);

  const isSupported = "wakeLock" in navigator;

  return { wantWake, isActive, isSupported, toggle };
}
