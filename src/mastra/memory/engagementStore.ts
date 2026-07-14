/**
 * Closed-loop scaffolding (NOT implemented yet — interface only).
 *
 * The goal: published → engagement → reinforcement. Once posts are published,
 * real engagement metrics flow back here to inform future runs.
 *
 * TODO (jalon ultérieur) : brancher Apify sur le profil LinkedIn de l'auteur
 * pour ingérer les impressions/commentaires réels par post publié, puis
 * alimenter la mémoire (renforcer les angles qui performent). Stub pour l'instant.
 */
export interface EngagementMetrics {
  postUrl: string;
  impressions: number;
  comments: number;
  reactions: number;
  capturedAt: string;
}

export interface EngagementStore {
  ingest(metrics: EngagementMetrics): Promise<void>;
  forSubject(subject: string): Promise<EngagementMetrics[]>;
}

export const engagementStore: EngagementStore = {
  async ingest() {
    /* stub — see TODO above */
  },
  async forSubject() {
    return [];
  },
};
