import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { ReactNode } from "react";

interface DisplaySettings {
  theme:     "Light" | "Dark" | "System";
  layout:    "Compact" | "Comfortable" | "Spacious";
  timeRange: "7D" | "30D" | "90D";
  currency:  "INR";
}

interface NotifSettings {
  emailHighRisk: boolean;
  inAppAlerts:   boolean;
  liveRefresh:   boolean;
  weeklyReport:  boolean;
  soundAlerts:   boolean;
}

const DISPLAY_KEY = "finomaly_display";
const NOTIF_KEY   = "finomaly_notifs";

const defaultDisplay: DisplaySettings = {
  theme: "Light", layout: "Comfortable", timeRange: "30D", currency: "INR",
};
const defaultNotifs: NotifSettings = {
  emailHighRisk: true, inAppAlerts: true, liveRefresh: true, weeklyReport: false, soundAlerts: false,
};

function applyTheme(theme: DisplaySettings["theme"]) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "Dark" || (theme === "System" && prefersDark);
  root.classList.toggle("dark", isDark);
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch { return fallback; }
}

interface SettingsCtx {
  display:      DisplaySettings;
  notifs:       NotifSettings;
  setDisplay:   (d: DisplaySettings) => void;
  setNotifs:    (n: NotifSettings) => void;
  saveDisplay:  () => void;
  saveNotifs:   () => void;
  resetAll:     () => void;
}

const Ctx = createContext<SettingsCtx>({
  display: defaultDisplay, notifs: defaultNotifs,
  setDisplay: () => {}, setNotifs: () => {},
  saveDisplay: () => {}, saveNotifs: () => {}, resetAll: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [display, setDisplayState] = useState<DisplaySettings>(() => load(DISPLAY_KEY, defaultDisplay));
  const [notifs,  setNotifsState]  = useState<NotifSettings>(() => load(NOTIF_KEY, defaultNotifs));

  // Apply theme on mount and whenever it changes
  useEffect(() => { applyTheme(display.theme); }, [display.theme]);

  // Listen for system preference changes when theme is "System"
  useEffect(() => {
    if (display.theme !== "System") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("System");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [display.theme]);

  const setDisplay = useCallback((d: DisplaySettings) => {
    setDisplayState(d);
    applyTheme(d.theme);
  }, []);

  const saveDisplay = useCallback(() => {
    localStorage.setItem(DISPLAY_KEY, JSON.stringify(display));
  }, [display]);

  const saveNotifs = useCallback(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
  }, [notifs]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(DISPLAY_KEY);
    localStorage.removeItem(NOTIF_KEY);
    setDisplayState(defaultDisplay);
    setNotifsState(defaultNotifs);
    applyTheme(defaultDisplay.theme);
  }, []);

  return (
    <Ctx.Provider value={{ display, notifs, setDisplay, setNotifs: setNotifsState, saveDisplay, saveNotifs, resetAll }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSettings = () => useContext(Ctx);
