"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    redirectPath?: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  requestPasswordReset: (email: string, redirectPath?: string) => Promise<string | null>;
  resendVerificationEmail: (email: string, redirectPath?: string) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return "Supabase is not configured. Please set .env.local first.";
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, redirectPath = "/en/login") => {
    if (!supabase) {
      return { error: "Supabase is not configured. Please set .env.local first.", needsEmailConfirmation: false };
    }

    const emailRedirectTo = `${window.location.origin}${redirectPath}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    return {
      error: error?.message ?? null,
      needsEmailConfirmation: !error && !data.session,
    };
  }, []);

  const requestPasswordReset = useCallback(
    async (email: string, redirectPath = "/en/reset-password") => {
      if (!supabase) {
        return "Supabase is not configured. Please set .env.local first.";
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${redirectPath}`,
      });

      return error?.message ?? null;
    },
    [],
  );

  const resendVerificationEmail = useCallback(
    async (email: string, redirectPath = "/en/login") => {
      if (!supabase) {
        return "Supabase is not configured. Please set .env.local first.";
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
        },
      });
      return error?.message ?? null;
    },
    [],
  );

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) {
      return "Supabase is not configured. Please set .env.local first.";
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      requestPasswordReset,
      resendVerificationEmail,
      updatePassword,
      signOut,
    }),
    [user, isLoading, signIn, signUp, requestPasswordReset, resendVerificationEmail, updatePassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
