import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, BarChart3, Settings } from 'lucide-react';
import { TurnosAdminConsulta } from './TurnosAdminConsulta';
import { EmpleadoTurnoForm } from './EmpleadoTurnoForm';
import { DashboardAnalisisTurnos } from './DashboardAnalisisTurnos';

export const TurnosFormEnhanced = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sistema de Control de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="consulta" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="consulta" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Consulta de Turnos
              </TabsTrigger>
              <TabsTrigger value="empleados" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gestión de Empleados
              </TabsTrigger>
              <TabsTrigger value="analisis" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Análisis y Reportes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="consulta" className="space-y-4">
              <TurnosAdminConsulta />
            </TabsContent>

            <TabsContent value="empleados" className="space-y-4">
              <EmpleadoTurnoForm />
            </TabsContent>

            <TabsContent value="analisis" className="space-y-4">
              <DashboardAnalisisTurnos />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};