import { useCallback, useRef } from "react";

const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczEjqR0teleS0LPYzO5KV4Kw07ks3moXcqDDyS0Oaidig8k9LmoXYpPJTS5qF2KDyU0uahdig8lNLmoXYoPJTS5qF2KDyU0uahdig8lNLmoXYoPJTS5qF2KDyU0uahdic=";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay — ignore silently
      });
    } catch {
      // Audio not supported
    }
  }, []);

  return { play };
}
