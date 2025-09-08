import { useState, useEffect } from 'react';
import { EmpleadoLogin } from '@/components/EmpleadoLogin';
import { EmpleadoDashboard } from '@/components/EmpleadoDashboard';
import { useEmpleadoAuth } from '@/hooks/useEmpleadoAuth';

export const EmpleadoApp = () => {
  const { empleado, checkAuth } = useEmpleadoAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!empleado) {
    return <EmpleadoLogin onSuccess={() => window.location.reload()} />;
  }

  return <EmpleadoDashboard empleado={empleado} />;
};