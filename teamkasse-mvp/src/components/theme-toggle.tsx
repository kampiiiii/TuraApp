"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "tura-theme";
const options: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: "system", label: "Automatisch", icon: Monitor },
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon }
];

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreference(saved);
      }
    } catch {
      setPreference("system");
    }
  }, []);

  function selectTheme(next: ThemePreference) {
    setPreference(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // The visual choice still works for this page when storage is unavailable.
    }

    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
      return;
    }

    document.documentElement.dataset.theme = next;
  }

  return (
    <div className="theme-toggle" aria-label="Darstellung waehlen">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          className={preference === value ? "theme-button active" : "theme-button"}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={preference === value}
          onClick={() => selectTheme(value)}
          key={value}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
