import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorConfig {
  enabled: boolean;
  created_at: string;
  secret?: string;
}

export const use2FA = () => {
  const [config, setConfig] = useState<TwoFactorConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load 2FA config from localStorage (simulated)
    const saved2FA = localStorage.getItem('twoFactorConfig');
    if (saved2FA) {
      setConfig(JSON.parse(saved2FA));
    }
  }, []);

  const enable2FA = async (verificationCode: string): Promise<{ success: boolean; backupCodes?: string[] }> => {
    setLoading(true);
    try {
      // Simulate verification
      if (verificationCode === '123456') {
        const newConfig: TwoFactorConfig = {
          enabled: true,
          created_at: new Date().toISOString(),
          secret: 'JBSWY3DPEHPK3PXP' // Example secret
        };
        
        setConfig(newConfig);
        localStorage.setItem('twoFactorConfig', JSON.stringify(newConfig));
        
        const backupCodes = [
          'A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2',
          'M3N4O5P6', 'Q7R8S9T0', 'U1V2W3X4'
        ];
        
        toast({
          title: "2FA Habilitado",
          description: "La autenticación de dos factores ha sido activada correctamente",
        });
        
        return { success: true, backupCodes };
      } else {
        toast({
          title: "Código inválido",
          description: "El código de verificación es incorrecto",
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al habilitar 2FA",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async (): Promise<boolean> => {
    setLoading(true);
    try {
      setConfig(null);
      localStorage.removeItem('twoFactorConfig');
      
      toast({
        title: "2FA Deshabilitado",
        description: "La autenticación de dos factores ha sido desactivada",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al deshabilitar 2FA",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    enable2FA,
    disable2FA,
  };
};