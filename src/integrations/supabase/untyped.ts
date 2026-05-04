// Untyped supabase client for new admin v2 tables (admin_users, audit_logs,
// admin_sessions, system_config, admin_recovery_codes) which aren't yet in
// the auto-generated Database types. Use this only for those tables.
import { supabase } from "./customClient";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sb: any = supabase;
