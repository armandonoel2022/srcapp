import { useState, useEffect, createContext, useContext, ReactNode } from 'react';  
import { User, Session } from '@supabase/supabase-js';  
import { supabase } from '@/integrations/supabase/client';  
  
interface CustomUser extends User {  
  username?: string;  
  role?: string;  
  type?: 'admin' | 'user' | 'client';  
  app_metadata: Record<string, any>;  
  user_metadata: Record<string, any>;  
}  
  
interface AuthContextType {  
  user: CustomUser | null;  
  session: Session | null;  
  loading: boolean;  
  signIn: (username: string, password: string) => Promise<{ error: any }>;  
  signInWithBiometric: () => Promise<{ error: any }>;  
  signUp: (username: string, password: string) => Promise<{ error: any }>;  
  signOut: () => Promise<void>;  
  isAdmin: boolean;  
}  
  
const AuthContext = createContext<AuthContextType | undefined>(undefined);  
  
export const AuthProvider = ({ children }: { children: ReactNode }) => {  
  const [user, setUser] = useState<CustomUser | null>(null);  
  const [session, setSession] = useState<Session | null>(null);  
  const [loading, setLoading] = useState(true);  
  
  useEffect(() => {  
    // Set up auth state listener for regular Supabase auth  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(  
      async (event, session) => {  
        setSession(session);  
        if (session?.user) {  
          // Load user profile to get role information  
          const { data: profile } = await supabase  
            .from('user_profiles')  
            .select('username, role')  
            .eq('user_id', session.user.id)  
            .maybeSingle();  
            
          const userWithProfile: CustomUser = {  
            ...session.user,  
            username: profile?.username,  
            role: profile?.role,  
            type: profile?.role === 'administrador' ? 'admin' :   
                  profile?.role === 'cliente' ? 'client' : 'user',  
            app_metadata: session.user.app_metadata || {},  
            user_metadata: session.user.user_metadata || {}  
          };  
          setUser(userWithProfile);  
        } else {  
          setUser(null);  
        }  
        setLoading(false);  
      }  
    );  
  
    // Check for existing session  
    supabase.auth.getSession().then(async ({ data: { session } }) => {  
      setSession(session);  
      if (session?.user) {  
        // Load user profile to get role information  
        const { data: profile } = await supabase  
          .from('user_profiles')  
          .select('username, role')  
          .eq('user_id', session.user.id)  
          .maybeSingle();  
          
        const userWithProfile: CustomUser = {  
          ...session.user,  
          username: profile?.username,  
          role: profile?.role,  
          type: profile?.role === 'administrador' ? 'admin' :   
                profile?.role === 'cliente' ? 'client' : 'user',  
          app_metadata: session.user.app_metadata || {},  
          user_metadata: session.user.user_metadata || {}  
        };  
        setUser(userWithProfile);  
      } else {  
        setUser(null);  
      }  
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
      // Try custom login with username  
      const { data, error } = await supabase.functions.invoke('custom-login', {  
        body: { username, password }  
      });  
  
      if (data?.session && data?.user) {  
        // Set the session from the custom login  
        console.log('Custom login successful:', data.user);  
        console.log('User role:', data.user.role);  
        console.log('User type:', data.user.type);  
        setSession(data.session);  
        setUser(data.user);  
        setLoading(false);  
        return { error: null };  
      }  
  
      // If custom login fails, return the error  
      setLoading(false);  
      return { error: data?.error || error || 'Invalid credentials' };  
    } catch (err) {  
      setLoading(false);  
      return { error: err };  
    }  
  };  
  
  const signInWithBiometric = async (userId?: string) => {  
    setLoading(true);  
      
    try {  
      // Si no se proporciona userId, no se puede autenticar
      if (!userId) {
        setLoading(false);
        return { error: 'ID de usuario requerido para autenticación biométrica' };
      }

      // Verificar si la biometría está habilitada para este usuario específico
      const biometricKey = `biometricEnabled_${userId}`;
      const biometricEnabled = localStorage.getItem(biometricKey) === 'true';  
        
      if (!biometricEnabled) {  
        setLoading(false);  
        return { error: 'Autenticación biométrica no configurada para este usuario' };  
      }  
  
      // Obtener username guardado para este usuario
      const usernameKey = `biometric_username_${userId}`;
      const savedUsername = localStorage.getItem(usernameKey);  
      if (!savedUsername) {
        setLoading(false);
        return { error: 'Datos de usuario biométrico no encontrados' };
      }

      // Intentar login con el usuario guardado  
      const { data, error } = await supabase.functions.invoke('custom-login', {  
        body: {   
          username: savedUsername,   
          password: 'biometric-auth' // Token especial para auth biométrica  
        }  
      });  

      if (data?.session && data?.user) {  
        setSession(data.session);  
        setUser(data.user);  
        setLoading(false);  
        return { error: null };  
      }

      setLoading(false);
      return { error: data?.error || error || 'Error en autenticación biométrica' };
  
    } catch (err) {  
      setLoading(false);  
      return { error: 'Error en autenticación biométrica' };  
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
    // NO eliminar configuraciones biométricas - deben persistir por usuario
    setUser(null);  
    setSession(null);  
    // Redirect to landing page after sign out  
    window.location.href = '/';  
  };
  
  const isAdmin = user?.type === 'admin' || user?.role === 'administrador';  
    
  console.log('Auth Debug - User:', user);  
  console.log('Auth Debug - isAdmin:', isAdmin);  
  console.log('Auth Debug - user.type:', user?.type);  
  console.log('Auth Debug - user.role:', user?.role);  
  
  const value = {  
    user,  
    session,  
    loading,  
    signIn,  
    signInWithBiometric,  
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