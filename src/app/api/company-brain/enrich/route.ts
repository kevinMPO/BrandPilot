import { NextRequest } from "next/server";
import { EnrichRequestSchema } from "@/mastra/lib/schemas";
import { enrichCompanyBrain } from "@/mastra/lib/companyEnrich";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * COMPANY BRAIN — enrichment endpoint.
 *
 * Takes the user's LinkedIn/company URLs + description and returns a concise,
 * editable author profile (built from real web data when Bright Data is
 * configured, or a graceful echo otherwise). Node runtime: the MCP client and
 * the model both need Node APIs.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let input;
  try {
    input = EnrichRequestSchema.parse(await req.json());
  } catch {
    return Response.json(
      { error: "Requête invalide. Fournis une URL LinkedIn, une URL entreprise ou une description." },
      { status: 400 },
    );
  }

  const hasSignal =
    Boolean(input.linkedinUrl?.trim()) ||
    Boolean(input.companyUrl?.trim()) ||
    Boolean(input.description?.trim());
  if (!hasSignal) {
    return Response.json(
      { error: "Ajoute au moins une URL LinkedIn, une URL d'entreprise ou une courte description." },
      { status: 400 },
    );
  }

  try {
    const result = await enrichCompanyBrain(input);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Échec de l'enrichissement." },
      { status: 500 },
    );
  }
}
