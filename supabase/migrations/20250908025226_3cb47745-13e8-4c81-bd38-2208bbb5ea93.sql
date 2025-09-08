-- Deshabilitar verificación de correo en Supabase
-- Nota: Esto también debe configurarse en el dashboard de Supabase
-- en Authentication > Settings > Email auth

-- Función para permitir usuarios sin verificación de correo
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Marcar email como verificado automáticamente
  UPDATE auth.users 
  SET email_confirmed_at = now() 
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-verificar emails en registro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();