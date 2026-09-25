"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Light or dark by the system setting, switchable with the theme toggle.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
