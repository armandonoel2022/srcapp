import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users2 } from 'lucide-react';


interface RegistrationTypeSelectorProps {
  onTypeSelect: (type: 'empleado' | 'visitante') => void;
}

export const RegistrationTypeSelector = ({ onTypeSelect }: RegistrationTypeSelectorProps) => {
  const currentTime = new Date();

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--gradient-blue-form)" }}>
      <Card className="w-full max-w-2xl mx-auto" style={{ boxShadow: "var(--shadow-form)" }}>
        <CardHeader className="text-center">
          <div className="flex flex-col items-center mb-4">
            <img 
              src="/lovable-uploads/6f1746d0-0b44-447b-a333-82019dfecd73.png" 
              alt="SRC Logo" 
              className="w-24 h-24 mb-4 object-contain"
            />
            <CardTitle className="text-xl font-bold font-poppins mb-2" style={{ color: "hsl(var(--title-dark))" }}>
              CONTROL DE ACCESO DIARIO EN PUESTO
            </CardTitle>
            <CardTitle className="text-xl font-bold font-poppins" style={{ color: "hsl(var(--title-dark))" }}>
              RESIDENCIA DE FRANCIA
            </CardTitle>
          </div>
          <div className="text-lg font-semibold text-muted-foreground">
            Fecha: {currentTime.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
          <div className="text-xl font-bold font-poppins" style={{ color: "hsl(var(--title-dark))" }}>
            {currentTime.toLocaleTimeString('es-ES', { 
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: "hsl(var(--title-dark))" }}>
              Seleccionar Tipo de Registro
            </h2>
            <p className="text-muted-foreground">
              ¿Para quién desea registrar el acceso?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button
              onClick={() => onTypeSelect('empleado')}
              className="h-32 flex-col space-y-4 text-lg font-semibold"
              variant="outline"
              style={{ 
                borderColor: "hsl(var(--primary))",
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--primary) / 0.15))",
                transition: "var(--transition-smooth)"
              }}
            >
              <User size={48} style={{ color: "hsl(var(--primary))" }} />
              <span style={{ color: "hsl(var(--title-dark))" }}>EMPLEADO</span>
            </Button>

            <Button
              onClick={() => onTypeSelect('visitante')}
              className="h-32 flex-col space-y-4 text-lg font-semibold"
              variant="outline"
              style={{ 
                borderColor: "hsl(var(--primary))",
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--primary) / 0.15))",
                transition: "var(--transition-smooth)"
              }}
            >
              <Users2 size={48} style={{ color: "hsl(var(--primary))" }} />
              <span style={{ color: "hsl(var(--title-dark))" }}>VISITANTE</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};