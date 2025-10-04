import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface TermsConsentModalProps {
  open: boolean;
  onAccept: () => void;
  isLoading?: boolean;
}

const CURRENT_VERSION = "1.0";

const TermsContent = ({ accepted, onAcceptedChange }: { accepted: boolean; onAcceptedChange: (checked: boolean) => void }) => (
  <div className="space-y-4">
    <ScrollArea className="h-[400px] rounded-md border p-4">
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-base mb-2">Autorización de Uso de Fotografías y Geolocalización</h3>
          <p className="text-muted-foreground">Versión {CURRENT_VERSION} - Última actualización: Septiembre 2025</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">1. Responsable del Tratamiento</h4>
          <p className="text-muted-foreground">
            Seguridad Residencial y Comercial S.R.L.<br />
            C/ Luis F. Thomen No. 255, Evaristo Morales, Sto. Dgo. R.D.<br />
            Correo: contacto@src.com.do
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">2. Autorización de Fotografías</h4>
          <p className="text-muted-foreground">
            Al aceptar estos términos, usted autoriza a Seguridad Residencial y Comercial S.R.L. a utilizar 
            las fotografías capturadas durante el registro de asistencia (punch) como prueba de que está 
            cumpliendo con su horario de trabajo y se encuentra en el lugar designado por la empresa.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">3. Autorización de Geolocalización</h4>
          <p className="text-muted-foreground">
            El empleado permite que Seguridad Residencial y Comercial S.R.L. pueda validar su ubicación 
            al momento de registrar el punch para constatar que se está realizando el registro en el lugar 
            adecuado. En el futuro, podrán realizarse modificaciones para hacer que el sistema sea cada vez 
            más preciso.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">4. Finalidad del Tratamiento</h4>
          <p className="text-muted-foreground">
            Control de asistencia, verificación de cumplimiento de horario laboral, verificación de ubicación 
            durante el servicio y auditoría de seguridad.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">5. Medidas de Seguridad</h4>
          <p className="text-muted-foreground">
            Sus datos están protegidos mediante cifrado en tránsito y reposo, controles de acceso basados 
            en roles, auditoría de accesos y almacenamiento seguro en la nube.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">6. Derechos del Usuario</h4>
          <p className="text-muted-foreground">
            Usted tiene derecho al acceso, rectificación, supresión, limitación del tratamiento, oposición 
            y portabilidad de sus datos. Para ejercer estos derechos, envíe su solicitud a contacto@src.com.do. 
            Recibirá respuesta en un máximo de 30 días.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">7. Retención de Datos</h4>
          <p className="text-muted-foreground">
            Los datos se conservan solo el tiempo necesario para fines de seguridad y control laboral, 
            y se eliminan o anonimizan posteriormente conforme a la normativa vigente.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">8. Modificaciones</h4>
          <p className="text-muted-foreground">
            Se notificará cualquier cambio sustancial en esta política mediante la aplicación. 
            En caso de cambios importantes, se le solicitará nuevamente su consentimiento.
          </p>
        </div>
      </div>
    </ScrollArea>

    <div className="flex items-start space-x-2">
      <Checkbox 
        id="terms" 
        checked={accepted}
        onCheckedChange={onAcceptedChange}
      />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        He leído y acepto los términos y condiciones de uso de fotografías y geolocalización
      </label>
    </div>
  </div>
);

export function TermsConsentModal({ open, onAccept, isLoading }: TermsConsentModalProps) {
  const [accepted, setAccepted] = useState(false);
  const isMobile = useIsMobile();

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} modal>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Términos y Condiciones</DrawerTitle>
            <DrawerDescription>
              Por favor, lea y acepte los términos para continuar
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <TermsContent accepted={accepted} onAcceptedChange={setAccepted} />
            <Button 
              onClick={handleAccept} 
              disabled={!accepted || isLoading}
              className="w-full mt-4"
            >
              {isLoading ? "Procesando..." : "Aceptar y Continuar"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} modal>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Términos y Condiciones</DialogTitle>
          <DialogDescription>
            Por favor, lea y acepte los términos para continuar
          </DialogDescription>
        </DialogHeader>
        <TermsContent accepted={accepted} onAcceptedChange={setAccepted} />
        <Button 
          onClick={handleAccept} 
          disabled={!accepted || isLoading}
          className="w-full"
        >
          {isLoading ? "Procesando..." : "Aceptar y Continuar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
