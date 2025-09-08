import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmpleadosTurnos } from '@/hooks/useEmpleadosTurnos';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Clock } from 'lucide-react';

export const EmpleadoTurnoForm = () => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    funcion: '',
    cedula: '',
    sexo: '',
    fecha_nacimiento: '',
    lugar_designado: '',
    hora_entrada_programada: '',
    hora_salida_programada: '',
    username: ''
  });

  const { agregarEmpleado, loading } = useEmpleadosTurnos();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombres || !formData.apellidos || !formData.funcion) {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const result = await agregarEmpleado(formData);
    if (result.success) {
      setFormData({
        nombres: '',
        apellidos: '',
        funcion: '',
        cedula: '',
        sexo: '',
        fecha_nacimiento: '',
        lugar_designado: '',
        hora_entrada_programada: '',
        hora_salida_programada: '',
        username: ''
      });
    }
  };

  const getComplianceIndicator = () => {
    if (!formData.hora_entrada_programada) return null;
    
    return (
      <div className="mt-2 p-3 bg-muted rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Sistema de Cumplimiento
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>A tiempo o temprano: Hora programada o antes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Alerta temprana: Hasta 5 minutos de retraso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Amarillo: 5-15 minutos de retraso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Rojo: Más de 15 minutos de retraso</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Agregar Empleado para Turnos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                placeholder="Nombres del empleado"
                required
              />
            </div>
            <div>
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                placeholder="Apellidos del empleado"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cedula">Cédula</Label>
              <Input
                id="cedula"
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                placeholder="Número de cédula"
              />
            </div>
            <div>
              <Label htmlFor="funcion">Función/Rol *</Label>
              <Input
                id="funcion"
                value={formData.funcion}
                onChange={(e) => setFormData({ ...formData, funcion: e.target.value })}
                placeholder="Función o rol del empleado"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lugar_designado">Lugar Designado</Label>
              <Input
                id="lugar_designado"
                value={formData.lugar_designado}
                onChange={(e) => setFormData({ ...formData, lugar_designado: e.target.value })}
                placeholder="Ubicación o localidad designada"
              />
            </div>
            <div>
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Usuario para acceso al sistema"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lugar_designado">Información de Acceso</Label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-900">Credenciales de acceso:</p>
              <p className="text-blue-800">
                • Si proporciona un nombre de usuario, se creará automáticamente con la contraseña temporal: <code className="bg-blue-100 px-1 rounded">SRC_Agente2025</code>
              </p>
              <p className="text-blue-800">
                • El empleado deberá cambiar esta contraseña en su primer acceso
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hora_entrada_programada">Hora de Entrada Programada</Label>
              <Input
                id="hora_entrada_programada"
                type="time"
                value={formData.hora_entrada_programada}
                onChange={(e) => setFormData({ ...formData, hora_entrada_programada: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hora_salida_programada">Hora de Salida Programada</Label>
              <Input
                id="hora_salida_programada"
                type="time"
                value={formData.hora_salida_programada}
                onChange={(e) => setFormData({ ...formData, hora_salida_programada: e.target.value })}
              />
            </div>
          </div>

          {getComplianceIndicator()}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Agregando...' : 'Agregar Empleado'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};