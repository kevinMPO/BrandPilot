"use client";

import * as React from "react";
import { CompanyBrainSchema, isBrainMeaningful, type CompanyBrain } from "@/mastra/lib/schemas";

/**
 * Company Brain persistence — who the author is, kept in localStorage so it
 * survives reloads and travels with every run. No backend storage needed: the
 * brain is sent along with each agent request.
 */
const KEY = "brandpilot.companyBrain.v1";
const EMPTY: CompanyBrain = { linkedinUrl: "", companyUrl: "", description: "", profile: "" };

export interface UseCompanyBrain {
  brain: CompanyBrain;
  save: (next: CompanyBrain) => void;
  clear: () => void;
  configured: boolean;
  loaded: boolean;
}

export function useCompanyBrain(): UseCompanyBrain {
  const [brain, setBrain] = React.useState<CompanyBrain>(EMPTY);
  const [loaded, setLoaded] = React.useState(false);

  // Hydrate once on mount (client-only).
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = CompanyBrainSchema.safeParse(JSON.parse(raw));
        if (parsed.success) setBrain({ ...EMPTY, ...parsed.data });
      }
    } catch {
      /* corrupted / unavailable storage — start empty */
    }
    setLoaded(true);
  }, []);

  const save = React.useCallback((next: CompanyBrain) => {
    const value: CompanyBrain = { ...EMPTY, ...next, updatedAt: new Date().toISOString() };
    setBrain(value);
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, []);

  const clear = React.useCallback(() => {
    setBrain(EMPTY);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { brain, save, clear, configured: isBrainMeaningful(brain), loaded };
}
