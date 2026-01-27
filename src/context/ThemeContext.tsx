import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  // Initialize from saved preference (or system preference)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('theme');
      if (saved === 'dark') {
        setIsDark(true);
        return;
      }
      if (saved === 'light') {
        setIsDark(false);
        return;
      }
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      setIsDark(Boolean(prefersDark));
    } catch {
      // ignore
    }
  }, []);

  // Apply to <html> for Tailwind dark mode + scrollbar styles
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', isDark);
      window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
