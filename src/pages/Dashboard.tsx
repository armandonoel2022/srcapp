import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, Shield, FileText, Clock } from 'lucide-react';
import { RegistroForm } from '@/components/RegistroForm';
import { GestionEmpleados } from '@/components/GestionEmpleados';
import { Sidebar } from '@/components/Sidebar';
import { ConsultaRegistros } from '@/components/ConsultaRegistros';

export const Dashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSection, setCurrentSection] = useState('registros');
  const [stats, setStats] = useState({
    empleados: 0,
    registrosHoy: 0,
    agentesActivos: 0
  });

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
    switch (currentSection) {
      case 'registros':
        return <RegistroForm />;
      case 'consulta':
        return <ConsultaRegistros />;
      case 'empleados':
        return <GestionEmpleados />;
      default:
        return <RegistroForm />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        onNavigate={setCurrentSection} 
        currentSection={currentSection}
      />

      {/* Main Content */}
      <main className="p-6">
        {renderCurrentSection()}
      </main>
    </div>
  );
};