"use client";

import { useCallback, useRef } from "react";

export function useNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMuted = useCallback(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("notifications-muted") === "true";
  }, []);

  const playSound = useCallback(() => {
    if (isMuted()) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/notification.mp3");
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {
      // Audio not available
    }
  }, [isMuted]);

  const showNotification = useCallback(
    (title: string, body: string, url?: string) => {
      if (isMuted()) return;

      playSound();

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        const n = new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
        if (url) {
          n.onclick = () => {
            window.focus();
            window.location.href = url;
            n.close();
          };
        }
      }
    },
    [isMuted, playSound]
  );

  const requestPermission = useCallback(async () => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      await Notification.requestPermission();
    }
  }, []);

  return { showNotification, requestPermission, playSound };
}
