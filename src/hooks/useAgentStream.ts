"use client";

import * as React from "react";
import { AgentEventSchema, type AgentEvent, type CompanyBrain } from "@/mastra/lib/schemas";

export type RunStatus = "idle" | "running" | "done" | "error";

export interface UseAgentStream {
  status: RunStatus;
  events: AgentEvent[];
  errorMessage: string | null;
  run: (topic: string, companyBrain?: CompanyBrain) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

/**
 * Client-side driver for the SSE route.
 *
 * EventSource only supports GET, and we need to POST the topic, so we use
 * `fetch` + a manual SSE frame parser over the response body. Every parsed
 * frame is validated with the SAME Zod schema the backend used — the wire
 * contract is enforced on both ends.
 */
export function useAgentStream(): UseAgentStream {
  const [status, setStatus] = React.useState<RunStatus>("idle");
  const [events, setEvents] = React.useState<AgentEvent[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);

  const reset = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setEvents([]);
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  const abort = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus((s) => (s === "running" ? "idle" : s));
  }, []);

  const run = React.useCallback(async (topic: string, companyBrain?: CompanyBrain) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setEvents([]);
    setErrorMessage(null);
    setStatus("running");

    try {
      const res = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, companyBrain }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error ?? `Erreur serveur (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const parsed = parseFrame(frame);
          if (!parsed) continue;

          const result = AgentEventSchema.safeParse(parsed);
          if (!result.success) continue; // ignore "done"/comment frames
          const event = result.data;
          setEvents((prev) => [...prev, event]);
          if (event.type === "error") {
            sawError = true;
            setErrorMessage(event.payload.message);
          }
        }
      }

      setStatus(sawError ? "error" : "done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // user-initiated
      setErrorMessage((err as Error).message ?? "Erreur réseau.");
      setStatus("error");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => controllerRef.current?.abort(), []);

  return { status, events, errorMessage, run, reset, abort };
}

/** Pull the JSON `data:` payload out of one SSE frame (ignores comments). */
function parseFrame(frame: string): unknown | null {
  const dataLines = frame
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim());
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  if (!raw || raw === "{}") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
