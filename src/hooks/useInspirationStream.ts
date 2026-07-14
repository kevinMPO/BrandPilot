"use client";

import * as React from "react";
import {
  InspirationEventSchema,
  type CompanyBrain,
  type InspirationIdea,
  type SearchResult,
} from "@/mastra/lib/schemas";

export type InspirationStatus = "idle" | "running" | "done" | "error";

export interface UseInspirationStream {
  status: InspirationStatus;
  reasoning: string;
  reasoningStreaming: boolean;
  searches: string[];
  sources: SearchResult[];
  ideas: InspirationIdea[];
  errorMessage: string | null;
  start: (companyBrain?: CompanyBrain) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

/**
 * Client driver for the inspiration SSE route. Mirrors useAgentStream, with the
 * inspiration event contract: live reasoning + web searches + selectable ideas.
 */
export function useInspirationStream(): UseInspirationStream {
  const [status, setStatus] = React.useState<InspirationStatus>("idle");
  const [reasoning, setReasoning] = React.useState("");
  const [reasoningStreaming, setReasoningStreaming] = React.useState(false);
  const [searches, setSearches] = React.useState<string[]>([]);
  const [sources, setSources] = React.useState<SearchResult[]>([]);
  const [ideas, setIdeas] = React.useState<InspirationIdea[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);

  const reset = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setReasoning("");
    setReasoningStreaming(false);
    setSearches([]);
    setSources([]);
    setIdeas([]);
    setErrorMessage(null);
  }, []);

  const abort = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus((s) => (s === "running" ? "idle" : s));
  }, []);

  const start = React.useCallback(async (companyBrain?: CompanyBrain) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setReasoning("");
    setReasoningStreaming(true);
    setSearches([]);
    setSources([]);
    setIdeas([]);
    setErrorMessage(null);
    setStatus("running");

    try {
      const res = await fetch("/api/inspiration/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyBrain }),
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

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const parsed = parseFrame(frame);
          if (!parsed) continue;
          const result = InspirationEventSchema.safeParse(parsed);
          if (!result.success) continue;
          const ev = result.data;

          switch (ev.type) {
            case "reasoning":
              setReasoning(ev.payload.text);
              setReasoningStreaming(ev.payload.streaming ?? false);
              break;
            case "search":
              setSearches((prev) => [...prev, ev.payload.query]);
              break;
            case "sources":
              setSources((prev) => [...prev, ...ev.payload.results]);
              break;
            case "idea":
              setIdeas((prev) => {
                const next = [...prev];
                next[ev.payload.index] = ev.payload.idea;
                return next.filter(Boolean);
              });
              break;
            case "error":
              sawError = true;
              setErrorMessage(ev.payload.message);
              break;
            case "done":
              break;
          }
        }
      }
      setReasoningStreaming(false);
      setStatus(sawError ? "error" : "done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage((err as Error).message ?? "Erreur réseau.");
      setStatus("error");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => controllerRef.current?.abort(), []);

  return {
    status,
    reasoning,
    reasoningStreaming,
    searches,
    sources,
    ideas,
    errorMessage,
    start,
    reset,
    abort,
  };
}

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
