"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean; // Placeholder for API compatibility with next-themes
}

interface ThemeProviderContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeProviderContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme", // Adapted from shadcn example, can be any key
  attribute = "class",
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      return storedTheme || defaultTheme;
    } catch (e) {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  const applyTheme = useCallback((currentTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let newResolvedTheme: "light" | "dark";

    if (currentTheme === "system" && enableSystem) {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      newResolvedTheme = systemPrefersDark ? "dark" : "light";
    } else {
      newResolvedTheme = currentTheme === "dark" ? "dark" : "light";
    }
    
    root.classList.add(newResolvedTheme);
    setResolvedTheme(newResolvedTheme);

    if (attribute === 'class') {
      root.classList.add(newResolvedTheme);
    } else {
      root.setAttribute(attribute, newResolvedTheme);
    }
  }, [attribute, enableSystem]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (theme === "system" && enableSystem) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, enableSystem, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      // Failsafe
    }
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
