import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    // apply theme colors to body so non-react elements inherit correct colors
    const bg = theme === "dark" ? "#020617" : "#ffffff";
    const text = theme === "dark" ? "#e5e7eb" : "#111827";
    document.body.style.backgroundColor = bg;
    document.body.style.color = text;
    // remove default body margin so the app can occupy full viewport without a light border
    document.body.style.margin = "0";
    // persist theme choice in localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}