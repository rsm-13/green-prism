import { createContext, useContext } from "react";

// theme context: provides `theme` and `toggleTheme` to the app
export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);