import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme as useNextTheme } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
};

export function ThemeProvider({ children, defaultTheme = "light" }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const result = useNextTheme();
  return {
    theme: (result.resolvedTheme || result.theme || "light") as "light" | "dark",
    setTheme: (t: "light" | "dark") => result.setTheme(t),
  };
}
