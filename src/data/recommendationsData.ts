export type RecoPriority = "info" | "attention" | "urgent";
export type RecoTarget = "flash" | "boutique" | "service" | "annonce";

export interface Recommendation {
  id: string;
  targetType: RecoTarget;
  targetId: number;
  targetName: string;
  message: string;
  priority: RecoPriority;
  createdAt: string;
}

export const RECO_PRIORITY_LABELS: Record<RecoPriority, string> = {
  info: "ℹ️ Info",
  attention: "⚠️ Attention",
  urgent: "🚨 Urgent",
};

export const RECO_PRIORITY_COLORS: Record<RecoPriority, string> = {
  info: "#3b82f6",
  attention: "#f59e0b",
  urgent: "#ef4444",
};

const RECO_KEY = "df_admin_recommendations";

export function getRecommendations(): Recommendation[] {
  try {
    const stored = localStorage.getItem(RECO_KEY);
    if (stored) return JSON.parse(stored) as Recommendation[];
  } catch {
    // ignore
  }
  return [];
}

export function getItemReco(targetType: RecoTarget, targetId: number): Recommendation | undefined {
  return getRecommendations().find(
    (r) => r.targetType === targetType && r.targetId === targetId
  );
}

export function upsertReco(reco: Omit<Recommendation, "id" | "createdAt">): void {
  const all = getRecommendations().filter(
    (r) => !(r.targetType === reco.targetType && r.targetId === reco.targetId)
  );
  all.push({
    ...reco,
    id: `${reco.targetType}-${reco.targetId}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(RECO_KEY, JSON.stringify(all));
}

export function deleteReco(targetType: RecoTarget, targetId: number): void {
  const all = getRecommendations().filter(
    (r) => !(r.targetType === targetType && r.targetId === targetId)
  );
  localStorage.setItem(RECO_KEY, JSON.stringify(all));
}
