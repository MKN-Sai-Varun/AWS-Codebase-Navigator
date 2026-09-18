import { useCallback, useEffect, useState } from "react";

// Generic localStorage-backed state hook. Reads once on mount, safely
// tolerates malformed JSON or an unavailable localStorage, and writes
// back on every change.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (quota exceeded, private mode, etc). Ignore.
    }
  }, [key, value]);

  const update = useCallback((next) => {
    setValue((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  return [value, update];
}