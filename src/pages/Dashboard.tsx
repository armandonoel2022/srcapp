import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { LogOut, Users, Shield, FileText, Clock, Search, UserPlus } from 'lucide-react';
import { RegistroForm } from '@/components/RegistroForm';
import { GestionEmpleados } from '@/components/GestionEmpleados';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavigation } from '@/components/MobileNavigation';
import { ConsultaRegistros } from '@/components/ConsultaRegistros';
import { GestionUsuarios } from '@/components/GestionUsuarios';
import { EditarRegistros } from '@/components/EditarRegistros';
import { EliminarEmpleados } from '@/components/EliminarEmpleados';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { HeatMap } from '@/components/HeatMap';
import { InteractiveHeatMap } from '@/components/InteractiveHeatMap';
import { AutoGeocodingUpdater } from '@/components/AutoGeocodingUpdater';

export const Dashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { requiresPasswordChange } = useUserProfiles();
  
  const isClient = user?.type === 'client' || user?.role === 'cliente';
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSection, setCurrentSection] = useState(isClient ? 'mapa-calor' : 'registros');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [stats, setStats] = useState({
    empleados: 0,
    registrosHoy: 0,
    agentesActivos: 0
  });

  // Check if password change is required
  useEffect(() => {
    if (requiresPasswordChange()) {
      setShowPasswordModal(true);
    }
  }, [requiresPasswordChange]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [empleadosRes, registrosRes, agentesRes] = await Promise.all([
          supabase.from('empleados').select('id', { count: 'exact' }),
          supabase.from('registros').select('id', { count: 'exact' }).eq('fecha', today),
          supabase.from('agente_seguridad').select('id', { count: 'exact' }).eq('fecha', today)
        ]);

        setStats({
          empleados: empleadosRes.count || 0,
          registrosHoy: registrosRes.count || 0,
          agentesActivos: agentesRes.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive"
      });
    }
  };

  const renderCurrentSection = () => {
    // If user is client, only allow access to heat map
    if (isClient) {
      return <InteractiveHeatMap />;
    }
    
    switch (currentSection) {
      case 'registros':
        return (
          <div className="space-y-6">
            <RegistroForm />
            {/* Quick Access Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setCurrentSection('consulta')}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Search className="h-5 w-5" />
                Consultar Horas
              </Button>
              <Button
                onClick={() => setCurrentSection('empleados')}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                Agregar Empleado
              </Button>
            </div>
          </div>
        );
      case 'consulta':
        return <ConsultaRegistros onNavigateToForm={() => setCurrentSection('registros')} />;
      case 'empleados':
        return <GestionEmpleados />;
      case 'usuarios':
        return <GestionUsuarios />;
      case 'editar-registros':
        return <EditarRegistros />;
      case 'eliminar-empleados':
        return <EliminarEmpleados />;
      case 'mapa-calor':
        return <InteractiveHeatMap />;
      default:
        return (
          <div className="space-y-6">
            <RegistroForm />
            {/* Quick Access Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setCurrentSection('consulta')}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Search className="h-5 w-5" />
                Consultar Horas
              </Button>
              <Button
                onClick={() => setCurrentSection('empleados')}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                Agregar Empleado
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background mobile-viewport">
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation 
          onNavigate={setCurrentSection} 
          currentSection={currentSection}
          isClient={isClient}
        />
      )}
      
      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && (
        <Sidebar 
          onNavigate={setCurrentSection} 
          currentSection={currentSection}
          isClient={isClient}
        />
      )}

      {/* Main Content */}
      <main className={`p-4 ${!isMobile ? 'ml-64' : 'pt-16'}`}>
        {renderCurrentSection()}
      </main>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </div>
  );
};