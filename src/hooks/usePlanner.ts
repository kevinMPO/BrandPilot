"use client";

import * as React from "react";
import { z } from "zod";
import { ScheduledPostSchema, type ScheduledPost, type SocialNetwork } from "@/mastra/lib/schemas";

/**
 * Planner — a client-side publishing queue (localStorage). Real scheduling data
 * you own; automatic publishing is the next step (needs each network's API).
 */
const KEY = "brandpilot.planner.v1";
const ArraySchema = z.array(ScheduledPostSchema);

export interface UsePlanner {
  items: ScheduledPost[];
  add: (input: { network: SocialNetwork; text: string; scheduledAt: string }) => void;
  remove: (id: string) => void;
  clear: () => void;
  loaded: boolean;
}

export function usePlanner(): UsePlanner {
  const [items, setItems] = React.useState<ScheduledPost[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = ArraySchema.safeParse(JSON.parse(raw));
        if (parsed.success) setItems(sortByDate(parsed.data));
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const persist = React.useCallback((next: ScheduledPost[]) => {
    const sorted = sortByDate(next);
    setItems(sorted);
    try {
      localStorage.setItem(KEY, JSON.stringify(sorted));
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const add = React.useCallback(
    (input: { network: SocialNetwork; text: string; scheduledAt: string }) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${input.scheduledAt}-${Math.round(performance.now())}`;
      const post: ScheduledPost = {
        id,
        network: input.network,
        text: input.text,
        scheduledAt: input.scheduledAt,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => {
        const next = sortByDate([...prev, post]);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const remove = React.useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((p) => p.id !== id);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const clear = React.useCallback(() => persist([]), [persist]);

  return { items, add, remove, clear, loaded };
}

function sortByDate(items: ScheduledPost[]): ScheduledPost[] {
  return [...items].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}
