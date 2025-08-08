import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface CustomUser {
  id: string;
  username: string;
  type: 'admin' | 'user';
  email?: string;
}

interface AuthContextType {
  user: User | CustomUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | CustomUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener for regular Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Check for custom admin session in localStorage
    const customUser = localStorage.getItem('customUser');
    if (customUser) {
      const parsedUser = JSON.parse(customUser);
      setUser(parsedUser);
      setLoading(false);
    }

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    
    try {
      // First try custom login (admin/usuarios tables)
      const { data, error } = await supabase.functions.invoke('custom-login', {
        body: { username, password }
      });

      if (data?.success) {
        const customUser = data.user;
        setUser(customUser);
        setSession(null); // No Supabase session for custom users
        localStorage.setItem('customUser', JSON.stringify(customUser));
        setLoading(false);
        return { error: null };
      }

      // If custom login fails, try regular Supabase auth
      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email: username, // Use the username directly as email
        password,
      });
      
      setLoading(false);
      return { error: supabaseError || data?.error };
    } catch (err) {
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (username: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: username, // Use the username directly as email
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('customUser');
    setUser(null);
    setSession(null);
  };

  const isAdmin = (user as CustomUser)?.type === 'admin';

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};