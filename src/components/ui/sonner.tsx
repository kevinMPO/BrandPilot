"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/** Toaster wired to the active theme. */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as "light" | "dark") ?? "dark"}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group border-border bg-card text-card-foreground shadow-elevation-3 rounded-card",
        },
      }}
    />
  );
}
