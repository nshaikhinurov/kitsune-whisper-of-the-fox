import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  isThemeTransitionActive,
  subscribeThemeTransition,
} from "~/shared/lib/theme-transition";

export function useThemeTransitionActive(): boolean {
  return useSyncExternalStore(
    subscribeThemeTransition,
    isThemeTransitionActive,
    () => false,
  );
}

const STORAGE_KEY = "kitsune_dark_mode";

export function useDarkMode(): [
  boolean,
  (next: boolean | ((v: boolean) => boolean)) => void,
] {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== "false",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  const lockedRef = useRef(false);
  useEffect(
    () =>
      subscribeThemeTransition((active) => {
        if (!active) lockedRef.current = false;
      }),
    [],
  );

  const guardedSetDarkMode = useCallback(
    (next: boolean | ((v: boolean) => boolean)) => {
      if (lockedRef.current || isThemeTransitionActive()) return;
      lockedRef.current = true;
      setDarkMode(next);
    },
    [],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "d" && e.key !== "D") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      guardedSetDarkMode((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [guardedSetDarkMode]);

  return [darkMode, guardedSetDarkMode];
}
