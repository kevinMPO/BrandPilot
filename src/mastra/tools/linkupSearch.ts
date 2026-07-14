import type { SearchResult } from "../lib/schemas";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * linkupSearch — web search for the INSPIRATION flow, via Linkup's MCP server.
 *
 * Same two-backends-one-interface idea as brightDataSearch:
 *   • REAL: Linkup MCP (remote HTTP) when LINKUP_API_KEY is set.
 *   • MOCK: realistic simulated results otherwise.
 *
 * Kept separate from brightDataSearch on purpose: Inspiration uses Linkup
 * (broad idea discovery), the main writer uses Bright Data (SERP grounding).
 * Swapping either is a one-file change.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface LinkupResponse {
  results: SearchResult[];
  source: "linkup" | "mock";
}

// Lazily-created, reused MCP client (cheap connection reuse across queries).
let mcpClientPromise: Promise<unknown> | null = null;

async function getLinkupClient(apiKey: string) {
  if (!mcpClientPromise) {
    mcpClientPromise = (async () => {
      const { MCPClient } = await import("@mastra/mcp");
      return new MCPClient({
        servers: {
          linkup: {
            // Remote streamable-HTTP endpoint; key passed as query param
            // (documented) AND as a Bearer header for good measure.
            url: new URL(`https://mcp.linkup.so/mcp?apiKey=${encodeURIComponent(apiKey)}`),
            requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
          },
        },
      });
    })();
  }
  return mcpClientPromise;
}

export async function runLinkupSearch(
  query: string,
  maxResults = 4,
): Promise<LinkupResponse> {
  const apiKey = process.env.LINKUP_API_KEY;
  if (apiKey) {
    try {
      const results = await linkupMcpSearch(query, maxResults, apiKey);
      if (results.length > 0) return { results, source: "linkup" };
    } catch (err) {
      console.warn(
        "[linkupSearch] Linkup MCP failed, falling back to mock:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return { results: mockSearch(query, maxResults), source: "mock" };
}

async function linkupMcpSearch(
  query: string,
  maxResults: number,
  apiKey: string,
): Promise<SearchResult[]> {
  const client = (await getLinkupClient(apiKey)) as {
    getTools: () => Promise<Record<string, { execute: (a: unknown) => Promise<unknown> }>>;
  };
  const tools = await client.getTools();
  const names = Object.keys(tools);
  // Find the search tool (namespaced, e.g. "linkup_linkup-search").
  const key =
    names.find((k) => /linkup[-_]?search$/i.test(k)) ??
    names.find((k) => /search/i.test(k)) ??
    names[0];
  if (!key) throw new Error("Aucun outil de recherche exposé par le serveur MCP Linkup.");

  const raw = await tools[key].execute({
    context: { query, depth: "standard", outputType: "searchResults" },
  });
  return normalizeLinkup(raw, maxResults);
}

/** Pull text payload out of an MCP result ({ content: [{ text }] } | string). */
function extractMcpText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  const r = raw as { content?: Array<{ text?: string }>; text?: string };
  if (Array.isArray(r?.content)) {
    return r.content.map((c) => (typeof c?.text === "string" ? c.text : "")).join("\n");
  }
  if (typeof r?.text === "string") return r.text;
  return JSON.stringify(raw);
}

/**
 * Normalize a Linkup MCP result into our SearchResult shape.
 * Linkup returns JSON with `results`/`sources` arrays of { name/title, url, content/snippet }.
 * Falls back to markdown link parsing, then a wrapped blob.
 */
function normalizeLinkup(raw: unknown, maxResults: number): SearchResult[] {
  const text = extractMcpText(raw);

  // 1) Structured JSON.
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    const arr =
      (Array.isArray(data.results) && data.results) ||
      (Array.isArray(data.sources) && data.sources) ||
      (Array.isArray((data as { organic?: unknown[] }).organic) &&
        (data as { organic: unknown[] }).organic) ||
      [];
    const fromJson = (arr as Array<Record<string, unknown>>)
      .map((o) => ({
        title: String(o.name ?? o.title ?? "Sans titre").trim(),
        url: String(o.url ?? o.link ?? "").trim(),
        snippet: String(o.content ?? o.snippet ?? o.description ?? "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 300),
        source: "linkup" as const,
      }))
      .filter((r) => r.url.startsWith("http"))
      .slice(0, maxResults);
    if (fromJson.length > 0) return fromJson;
  } catch {
    /* not JSON — fall through */
  }

  // 2) Markdown links fallback.
  const results: SearchResult[] = [];
  const linkRe = /\[([^\]]{4,120})\]\((https?:\/\/[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) && results.length < maxResults) {
    results.push({
      title: m[1].trim(),
      url: m[2].trim(),
      snippet: text
        .slice(m.index + m[0].length, m.index + m[0].length + 180)
        .replace(/\s+/g, " ")
        .trim(),
      source: "linkup",
    });
  }
  if (results.length === 0 && text.trim()) {
    results.push({
      title: "Résultat Linkup",
      url: "https://linkup.so",
      snippet: text.slice(0, 200).replace(/\s+/g, " ").trim(),
      source: "linkup",
    });
  }
  return results;
}

/* ──────────────────────────────── MOCK backend ─────────────────────────── */

function mockSearch(query: string, maxResults: number): SearchResult[] {
  const topic = query.replace(/\s+/g, " ").trim();
  const slug = topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  const templates: Array<Omit<SearchResult, "source">> = [
    {
      title: `${topic} : la tendance qui monte en 2026`,
      url: `https://www.lesechos.fr/tech/${slug}`,
      snippet: `Un mouvement de fond se dessine autour de ${topic}. Les acteurs qui prennent la parole maintenant captent l'attention — et les opportunités.`,
    },
    {
      title: `Ce que 200 dirigeants pensent vraiment de ${topic}`,
      url: `https://hbr.org/2026/${slug}`,
      snippet: `Une enquête révèle un écart net entre le discours public et les convictions privées sur ${topic}. Matière parfaite pour un post à contre-courant.`,
    },
    {
      title: `${topic} : 3 idées reçues à déconstruire`,
      url: `https://www.linkedin.com/pulse/${slug}`,
      snippet: `Les mythes les plus tenaces sur ${topic}, et pourquoi les casser publiquement génère de l'engagement.`,
    },
    {
      title: `Retour d'expérience : 6 mois avec ${topic}`,
      url: `https://medium.com/@pro/${slug}`,
      snippet: `Les leçons concrètes, les erreurs à éviter, et le framework qui a marché. Un angle "terrain" qui inspire confiance.`,
    },
  ];
  return templates.slice(0, maxResults).map((t) => ({ ...t, source: "mock" as const }));
}
