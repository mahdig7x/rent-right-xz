import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; phone?: string; location?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<Profile, 'name' | 'phone' | 'location' | 'profile_image'>>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(() => fetchProfile(sess.user.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchProfile(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; phone?: string; location?: string }) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, phone: data.phone, location: data.location },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Pick<Profile, 'name' | 'phone' | 'location' | 'profile_image'>>) => {
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);
    if (error) return false;
    await fetchProfile(user.id);
    return true;
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, isAuthenticated: !!user, loading,
      login, register, loginWithGoogle, logout, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
