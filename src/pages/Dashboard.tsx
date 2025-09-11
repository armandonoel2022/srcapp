import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, Shield, FileText, Clock, Search, UserPlus, Camera, UserCheck } from 'lucide-react';
import { RegistroForm } from '@/components/RegistroForm';
import { GestionEmpleados } from '@/components/GestionEmpleados';
import { Sidebar } from '@/components/Sidebar';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ConsultaRegistros } from '@/components/ConsultaRegistros';
import { CrearUsuarioCliente } from '@/components/CrearUsuarioCliente';
import { EditarRegistros } from '@/components/EditarRegistros';
import { EliminarEmpleados } from '@/components/EliminarEmpleados';
import { EditarEmpleados } from '@/components/EditarEmpleados';
import { DashboardCumplimiento } from '@/components/DashboardCumplimiento';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { HeatMap } from '@/components/HeatMap';
import { InteractiveHeatMap } from '@/components/InteractiveHeatMap';
import { AutoGeocodingUpdater } from '@/components/AutoGeocodingUpdater';
import { TurnosFormEnhanced } from '@/components/TurnosFormEnhanced';
import { TurnosAgentForm } from '@/components/TurnosAgentForm';
import { ConsultaTurnos } from '@/components/ConsultaTurnos';
import { DashboardAnalisisTurnos } from '@/components/DashboardAnalisisTurnos';
import { DashboardTurnos } from '@/components/DashboardTurnos';
import { BiometricAuthSetup } from '@/components/BiometricAuthSetup';
import { AdminTurnosFotos } from '@/components/AdminTurnosFotos';
import { MapaAsignarUbicacion } from '@/components/MapaAsignarUbicacion';

export const Dashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { requiresPasswordChange } = useUserProfiles();
  
  const isClient = user?.type === 'client' || user?.role === 'cliente';
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSection, setCurrentSection] = useState(isClient ? 'mapa-calor' : 'registro');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!isClient); // Solo mostrar bienvenida si no es cliente
  const [stats, setStats] = useState({
    empleados: 0,
    registrosHoy: 0,
    agentesActivos: 0
  });

  // Check if password change is required (only for clients)
  useEffect(() => {
    if (isClient && requiresPasswordChange()) {
      setShowPasswordModal(true);
    }
  }, [isClient, requiresPasswordChange]);

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

  // Función para manejar la navegación entre secciones
  const handleNavigate = (section: string) => {
    setCurrentSection(section);
    setShowWelcome(false); // Ocultar la pantalla de bienvenida cuando se navega
  };

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

    // Botón para volver a la pantalla principal (solo si no estamos en bienvenida)
      const BackButton = () => !showWelcome && (  
      <div className="fixed bottom-6 right-6 z-50">  
        <Button  
          onClick={() => navigate('/')} // Cambiar esta línea  
          variant="outline"  
          size="lg"  
          className="bg-white/90 backdrop-blur-sm shadow-lg border-2 hover:shadow-xl transition-all duration-300"  
          style={{ boxShadow: "var(--shadow-elegant)" }}  
        >  
          <span className="text-sm font-medium">🏠 Pantalla Principal</span>  
        </Button>  
      </div>  
    );
    
    switch (currentSection) {
      case 'registro':
        return (
          <>
            <div className="space-y-6">
              <RegistroForm />
              {/* Quick Access Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => handleNavigate('consulta')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Search className="h-5 w-5" />
                  Consultar Horas
                </Button>
                <Button
                  onClick={() => handleNavigate('empleados')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Agregar Empleado
                </Button>
              </div>
            </div>
            <BackButton />
          </>
        );
      case 'consulta':
        return (
          <>
            <ConsultaRegistros onNavigateToForm={() => handleNavigate('registro')} />
            <BackButton />
          </>
        );
      case 'empleados':
        return (
          <>
            <GestionEmpleados />
            <BackButton />
          </>
        );
      case 'crear-usuario-cliente':
        return (
          <>
            <CrearUsuarioCliente />
            <BackButton />
          </>
        );
      case 'editar-registros':
        return (
          <>
            <EditarRegistros />
            <BackButton />
          </>
        );
      case 'eliminar-empleados':
        return (
          <>
            <EliminarEmpleados />
            <BackButton />
          </>
        );
      case 'editar-empleados':
        return (
          <>
            <EditarEmpleados />
            <BackButton />
          </>
        );
      case 'dashboard-cumplimiento':
        return (
          <>
            <DashboardCumplimiento />
            <BackButton />
          </>
        );
      case 'turnos-enhanced':
        return (
          <>
            <TurnosFormEnhanced />
            <BackButton />
          </>
        );
      case 'dashboard-turnos':
        return (
          <>
            <DashboardTurnos />
            <BackButton />
          </>
        );
      case 'ubicaciones':
        return (
          <>
            <MapaAsignarUbicacion />
            <BackButton />
          </>
        );
      case 'revisar-fotos':
        return (
          <>
            <AdminTurnosFotos />
            <BackButton />
          </>
        );
      case 'mapa-calor':
        return (
          <>
            <InteractiveHeatMap />
            <BackButton />
          </>
        );
      default:
        return (
          <>
            <div className="space-y-6">
              <RegistroForm />
              {/* Quick Access Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => handleNavigate('consulta')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Search className="h-5 w-5" />
                  Consultar Horas
                </Button>
                <Button
                  onClick={() => handleNavigate('empleados')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Agregar Empleado
                </Button>
              </div>
            </div>
            <BackButton />
          </>
        );
    }
  };

  // Mostrar pantalla de bienvenida si está activada y no es cliente
  if (showWelcome && !isClient && !showPasswordModal) {
    return (
      <WelcomeScreen 
        onNavigate={handleNavigate} 
        isActive={true}
        onLogout={() => {
          signOut();
          navigate('/auth');
        }}
        onBackToHome={() => setShowWelcome(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        onNavigate={handleNavigate} 
        currentSection={currentSection}
        isClient={isClient}
      />

      {/* Main Content */}
      <main className="p-6">
        {renderCurrentSection()}
      </main>

      {/* Password Change Modal - Only for clients */}
      {isClient && (
        <PasswordChangeModal 
          isOpen={showPasswordModal} 
          onClose={() => setShowPasswordModal(false)} 
        />
      )}
    </div>
  );
};