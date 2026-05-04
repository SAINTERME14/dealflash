import { supabase } from "@/integrations/supabase/customClient";

export type LogAdminActionParams = {
  actionType: string;
  targetType?: string;
  targetId?: string;
  beforeState?: object;
  afterState?: object;
  note?: string;
};

let cachedIp: string | null = null;
async function getClientIp(): Promise<string | null> {
  if (cachedIp !== null) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2000) });
    const json = await res.json();
    cachedIp = json.ip ?? null;
  } catch {
    cachedIp = null;
  }
  return cachedIp;
}

export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  try {
    const ip = await getClientIp();
    const { error } = await supabase.rpc("log_admin_action", {
      _action_type: params.actionType,
      _target_type: params.targetType ?? null,
      _target_id: params.targetId ?? null,
      _before_state: (params.beforeState as never) ?? null,
      _after_state: (params.afterState as never) ?? null,
      _note: params.note ?? null,
      _ip_address: ip ?? null,
      _user_agent: navigator.userAgent,
    });
    if (error) console.error("logAdminAction error:", error);
  } catch (e) {
    console.error("logAdminAction failed:", e);
  }
}
