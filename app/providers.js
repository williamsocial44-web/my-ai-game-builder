"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";

const AuthContext = createContext({
  user: null,
  loading: true,
  configured: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Create the browser client once.
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(() => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

    return {
      user,
      loading,
      configured: !!supabase,
      async signInWithGoogle() {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) throw error;
      },
      async signInWithEmail(email) {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
        setUser(null);
      },
    };
  }, [supabase, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
