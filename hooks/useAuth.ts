import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          // Recover from stale/invalid refresh tokens instead of throwing noisy boot errors.
          await supabase.auth.signOut().catch(() => undefined);
          setSession(null);
        } else {
          setSession(session);
        }
        setLoading(false);
      })
      .catch(async () => {
        await supabase.auth.signOut().catch(() => undefined);
        setSession(null);
        setLoading(false);
      });

    // Listen for session changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}
