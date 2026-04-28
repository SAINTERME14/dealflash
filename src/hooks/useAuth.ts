import { useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

let globalState: AuthState = {
  user: null,
  session: null,
  loading: true,
};

let initialized = false;
const listeners = new Set<(state: AuthState) => void>();

function notify(state: AuthState) {
  globalState = state;
  listeners.forEach((l) => l(state));
}

function init() {
  if (initialized) return;
  initialized = true;

  supabase.auth.getSession().then(({ data: { session } }) => {
    notify({ user: session?.user ?? null, session, loading: false });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    notify({ user: session?.user ?? null, session, loading: false });
  });
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(globalState);

  useEffect(() => {
    listeners.add(setState);
    init();
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, signOut };
}
