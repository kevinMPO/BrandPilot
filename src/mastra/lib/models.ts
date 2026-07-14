import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createMistral } from "@ai-sdk/mistral";
import { wrapLanguageModel, type LanguageModelV1 } from "ai";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MODEL ROUTING — model-agnostic by design.
 *
 * The agent never imports a specific provider. It asks for "the model" and
 * this module reads the MODEL_PROVIDER env var (format "<provider>/<model>")
 * to build the right one. Switching models = changing one env var, NO code
 * change. This is the extension point for adding more providers later.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const DEFAULT_MODEL_PROVIDER = "anthropic/claude-opus-4-8";

/** Supported providers and the env var holding their API key. */
const PROVIDER_KEY_ENV: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  mistral: "MISTRAL_API_KEY",
};

/** Parse "anthropic/claude-opus-4-8" -> { provider, modelId }. */
export function parseModelProvider(raw?: string): {
  provider: string;
  modelId: string;
} {
  const value = (raw ?? DEFAULT_MODEL_PROVIDER).trim();
  const slash = value.indexOf("/");
  if (slash === -1) {
    // No provider prefix: assume anthropic.
    return { provider: "anthropic", modelId: value };
  }
  return {
    provider: value.slice(0, slash).toLowerCase(),
    modelId: value.slice(slash + 1),
  };
}

/** True when the API key for a given provider is present. */
function hasKeyFor(provider: string): boolean {
  const keyEnv = PROVIDER_KEY_ENV[provider];
  return Boolean(keyEnv && process.env[keyEnv]);
}

/**
 * True when the API key required by the configured MODEL_PROVIDER is present.
 * When false, the route falls back to the built-in demo agent so the app
 * still runs with zero paid keys.
 */
export function hasModelCredentials(): boolean {
  const { provider } = parseModelProvider(process.env.MODEL_PROVIDER);
  return hasKeyFor(provider);
}

/** Human-readable model label for the UI / logs. */
export function getModelLabel(): string {
  const { provider, modelId } = parseModelProvider(process.env.MODEL_PROVIDER);
  return `${provider}/${modelId}`;
}

/** Build the AI SDK model for an explicit provider/modelId pair. */
function buildModel(provider: string, modelId: string): LanguageModelV1 {
  const keyEnv = PROVIDER_KEY_ENV[provider];
  const apiKey = keyEnv ? process.env[keyEnv] : undefined;
  if (!apiKey) {
    throw new Error(
      `Aucune clé API pour le provider "${provider}". Renseigne ${keyEnv} dans .env.local, ` +
        `ou laisse vide pour utiliser l'agent de démonstration.`,
    );
  }

  switch (provider) {
    case "anthropic":
      // The Vercel AI SDK v4 forces `temperature: 0` when none is given, but
      // recent Claude models (e.g. Opus 4.8, extended-thinking) reject the
      // param entirely ("temperature is deprecated for this model"). We strip
      // it via middleware so Claude runs on its own default. OpenAI/Mistral
      // are untouched — this keeps the routing model-agnostic.
      return wrapLanguageModel({
        model: createAnthropic({ apiKey })(modelId),
        middleware: {
          transformParams: async ({ params }) => {
            const { temperature: _omit, ...rest } = params;
            return rest;
          },
        },
      });
    case "openai":
      return createOpenAI({ apiKey, compatibility: "strict" })(modelId);
    case "mistral":
      return createMistral({ apiKey })(modelId);
    default:
      throw new Error(
        `Provider inconnu "${provider}". Providers supportés : anthropic, openai, mistral.`,
      );
  }
}

/**
 * The writer/main model, from MODEL_PROVIDER.
 * Throws a clear error if the provider is unknown or the key is missing.
 */
export function resolveModel(): LanguageModelV1 {
  const { provider, modelId } = parseModelProvider(process.env.MODEL_PROVIDER);
  return buildModel(provider, modelId);
}

/**
 * The CRITIC model. A different model than the writer gives a genuinely
 * independent perspective (avoids self-preference bias) — that's the point of
 * a critic. Resolution order:
 *   1. CRITIC_MODEL_PROVIDER if set (and its key is available) — full control.
 *   2. Otherwise, default to a DIFFERENT Anthropic model than the writer
 *      (sonnet↔haiku) for built-in diversity + speed, reusing the same key.
 *   3. Last resort: reuse the writer model (always works, no diversity).
 */
export function resolveCriticModel(): LanguageModelV1 {
  const override = process.env.CRITIC_MODEL_PROVIDER?.trim();
  if (override) {
    const { provider, modelId } = parseModelProvider(override);
    if (hasKeyFor(provider)) return buildModel(provider, modelId);
  }

  const writer = parseModelProvider(process.env.MODEL_PROVIDER);
  if (writer.provider === "anthropic" && hasKeyFor("anthropic")) {
    const sibling = writer.modelId.includes("haiku")
      ? "claude-sonnet-4-6"
      : "claude-haiku-4-5-20251001";
    return buildModel("anthropic", sibling);
  }

  return resolveModel();
}

/** Human-readable label of the critic model (for logs/UI). */
export function getCriticModelLabel(): string {
  const override = process.env.CRITIC_MODEL_PROVIDER?.trim();
  if (override) return override;
  const writer = parseModelProvider(process.env.MODEL_PROVIDER);
  if (writer.provider === "anthropic") {
    return writer.modelId.includes("haiku")
      ? "anthropic/claude-sonnet-4-6"
      : "anthropic/claude-haiku-4-5-20251001";
  }
  return getModelLabel();
}
