
"use client";

import React, { createContext, useContext, useEffect } from 'react';

type Theme = "dark"; // Only dark theme is supported

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeProviderContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void; // Will be a no-op
  resolvedTheme: "dark";
}

const ThemeContext = createContext<ThemeProviderContextValue | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme: Theme = "dark";
  const resolvedTheme: "dark" = "dark";

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light"); // Ensure light class is removed
    root.classList.add("dark");   // Apply dark class
    // The attribute 'class' is assumed as per original functionality for ShadCN.
  }, []);

  // setTheme is a no-op as the theme is fixed to dark.
  const setTheme = (_newTheme: Theme) => {
    // Theme is fixed, so this function does nothing.
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
