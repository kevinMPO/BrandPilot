import type { SearchResult } from "./schemas";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SOURCE REGISTRY — captures every result returned by brightDataSearch during
 * a run, so that at the end we can VERIFY (not just trust) that each factual
 * claim in an angle is backed by a real extract.
 *
 * Deduped by URL. This is the evidence base for `verifyClaims` (Phase 2).
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface SourceEntry {
  url: string;
  title: string;
  snippet: string;
}

export class SourceRegistry {
  private byUrl = new Map<string, SourceEntry>();

  /** Record search results (no-ops on entries without a usable URL). */
  add(results: SearchResult[]): void {
    for (const r of results) {
      if (!r.url || this.byUrl.has(r.url)) continue;
      this.byUrl.set(r.url, { url: r.url, title: r.title, snippet: r.snippet });
    }
  }

  all(): SourceEntry[] {
    return [...this.byUrl.values()];
  }

  get size(): number {
    return this.byUrl.size;
  }
}
