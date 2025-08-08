import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'administrador' | 'agente_seguridad';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  role: UserRole;
  requires_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserProfiles = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadUserProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar perfiles: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error: any) {
      console.error('Error loading current user profile:', error);
    }
  };

  const createUserProfile = async (email: string, password: string, username: string, role: UserRole) => {
    setLoading(true);
    try {
      // Generate random password for agents
      const finalPassword = role === 'agente_seguridad' ? Math.random().toString(36).slice(-8) + 'A1!' : password;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: finalPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          username,
          role,
          requires_password_change: role === 'agente_seguridad'
        });

      if (profileError) throw profileError;

      await loadUserProfiles();
      
      toast({
        title: "Usuario creado",
        description: role === 'agente_seguridad' 
          ? `Usuario creado. Contraseña temporal: ${finalPassword}` 
          : `Usuario ${username} creado exitosamente`
      });

      return { success: true, temporaryPassword: role === 'agente_seguridad' ? finalPassword : null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al crear usuario: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await loadUserProfiles();
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado exitosamente"
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar rol: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ requires_password_change: false })
          .eq('user_id', user.id);

        if (profileError) throw profileError;
      }

      await loadCurrentUserProfile();
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente"
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar contraseña: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    }
  };

  const isAdmin = () => {
    console.log('useUserProfiles isAdmin - currentUserProfile:', currentUserProfile);
    console.log('useUserProfiles isAdmin - role:', currentUserProfile?.role);
    const result = currentUserProfile?.role === 'administrador';
    console.log('useUserProfiles isAdmin - result:', result);
    return result;
  };
  const requiresPasswordChange = () => currentUserProfile?.requires_password_change === true;

  useEffect(() => {
    loadCurrentUserProfile();
  }, []);

  return {
    profiles,
    currentUserProfile,
    loading,
    loadUserProfiles,
    loadCurrentUserProfile,
    createUserProfile,
    updateUserRole,
    updatePassword,
    isAdmin,
    requiresPasswordChange
  };
};