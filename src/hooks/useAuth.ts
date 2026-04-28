import { useEffect, useSyncExternalStore } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthSnapshot = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

let authSnapshot: AuthSnapshot = {
  user: null,
  session: null,
  loading: true,
};

let authInitialized = false;
let authInitPromise: Promise<void> | null = null;
let authUnsubscribe: (() => void) | null = null;
const listeners = new Set<() => void>();

function emitAuthChange() {
  listeners.forEach((listener) => listener());
}

function setAuthSnapshot(session: Session | null, loading: boolean) {
  authSnapshot = {
    user: session?.user ?? null,
    session,
    loading,
  };
  emitAuthChange();
}

function ensureAuthInitialized() {
  if (authInitialized) return authInitPromise;

  authInitialized = true;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, newSession) => {
    setAuthSnapshot(newSession, false);
  });

  authUnsubscribe = () => subscription.unsubscribe();

  authInitPromise = supabase.auth
    .getSession()
    .then(({ data: { session } }) => {
      setAuthSnapshot(session, false);
    })
    .catch(() => {
      setAuthSnapshot(null, false);
    });

  return authInitPromise;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureAuthInitialized();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return authSnapshot;
}

export function useAuth() {
  const auth = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    ensureAuthInitialized();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...auth, signOut };
}
