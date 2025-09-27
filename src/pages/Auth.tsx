import { useState, useEffect } from 'react';  
import { useNavigate } from 'react-router-dom';  
import { useAuth } from '@/hooks/useAuth';  
import { useBiometricAuthCapacitor } from '@/hooks/useBiometricAuthCapacitor';  
import { Button } from '@/components/ui/button';  
import { Input } from '@/components/ui/input';  
import { Label } from '@/components/ui/label';  
import { useToast } from '@/hooks/use-toast';  
import { supabase } from '@/integrations/supabase/client';  
import { User, Lock, Fingerprint } from 'lucide-react';  
  
export const Auth = () => {  
  const [username, setUsername] = useState('');  
  const [password, setPassword] = useState('');  
  const [loading, setLoading] = useState(false);  
  const [isActive, setIsActive] = useState(false);
  const [showSwipeMenu, setShowSwipeMenu] = useState(false);
  const [startY, setStartY] = useState(0);
    
  const { signIn, signInWithBiometric, user } = useAuth();  
  const {   
    isSupported,  
    isRegistered,   
    authenticateWithBiometric   
  } = useBiometricAuthCapacitor();
  const navigate = useNavigate();  
  const { toast } = useToast();
  
  // Redirect if already authenticated  
  useEffect(() => {  
    if (user) {  
      navigate('/dashboard');  
    }  
  }, [user, navigate]);  
  
  const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();  
      
    if (!username || !password) {  
      toast({  
        title: "Error",  
        description: "Por favor, completa todos los campos",  
        variant: "destructive"  
      });  
      return;  
    }  
  
    setLoading(true);  
  
    try {  
      const { error } = await signIn(username, password);  
  
      if (error) {  
        toast({  
          title: "Error",  
          description: error.message,  
          variant: "destructive"  
        });  
      } else {  
        // Guardar username para autenticación biométrica futura  
        localStorage.setItem('biometric_username', username);  
          
        toast({  
          title: "Éxito",  
          description: "Inicio de sesión exitoso"  
        });  
        navigate('/dashboard');  
      }
    } catch (err) {  
      toast({  
        title: "Error",  
        description: "Ocurrió un error inesperado",  
        variant: "destructive"  
      });  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  const handleBiometricLogin = async () => {  
    setLoading(true);  
      
    try {  
      const { success, error } = await authenticateWithBiometric();  
        
      if (success) {  
        // Usar el hook de auth para login biométrico  
        const { error: authError } = await signInWithBiometric();  
          
        if (authError) {  
          toast({  
            title: "Error",  
            description: authError || "Error en autenticación biométrica",  
            variant: "destructive"  
          });  
        } else {  
          toast({  
            title: "Éxito",  
            description: "Autenticación biométrica exitosa"  
          });  
          // Verificar si es cliente para redirigir al mapa de calor
          const userId = localStorage.getItem('biometric_userId');
          if (userId) {
            const userProfileKey = `userProfile_${userId}`;
            const savedProfile = localStorage.getItem(userProfileKey);
            if (savedProfile) {
              const profile = JSON.parse(savedProfile);
              if (profile.role === 'cliente') {
                navigate('/dashboard?section=mapa-calor');
                return;
              }
            }
          }
          navigate('/dashboard');  
        }
      } else {  
        toast({  
          title: "Error",  
          description: error || "Error en autenticación biométrica",  
          variant: "destructive"  
        });  
      }  
    } catch (err) {  
      toast({  
        title: "Error",  
        description: "Error inesperado en autenticación biométrica",  
        variant: "destructive"  
      });  
    } finally {  
      setLoading(false);  
    }  
  };

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;
    
    // If swiping up (diff > 0) and moved at least 50px
    if (diff > 50 && !showSwipeMenu) {
      setShowSwipeMenu(true);
    }
    // If swiping down and menu is open
    else if (diff < -20 && showSwipeMenu) {
      setShowSwipeMenu(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Show menu when mouse is near bottom of screen
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    
    if (mouseY > windowHeight - 100 && !showSwipeMenu) {
      setShowSwipeMenu(true);
    }
    // Hide when mouse moves away from bottom
    else if (mouseY < windowHeight - 150 && showSwipeMenu) {
      setShowSwipeMenu(false);
    }
  };
  
  
  return (  
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"   
      style={{ background: "var(--gradient-primary)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
    >  
           
      {/* Swipe Menu */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm rounded-t-3xl p-6 transform transition-transform duration-300 z-50 ${
          showSwipeMenu ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.2)" }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        <div className="flex justify-center">
          <Button   
            variant="outline"   
            size="lg"
            onClick={() => {
              navigate('/');
              setShowSwipeMenu(false);
            }}
            className="bg-white hover:bg-gray-50 shadow-md"  
          >  
            Volver a la Pantalla Principal  
          </Button>  
        </div>
      </div>
          
      <div className={`auth-container ${isActive ? 'active' : ''}`}>  
        {/* Login Form */}  
        <div className="form-box login">  
          <form onSubmit={handleSubmit}>  
            <div className="text-center mb-6">  
              <img   
                src="/lovable-uploads/6f1746d0-0b44-447b-a333-82019dfecd73.png"   
                alt="SRC Logo"   
                className="w-16 h-16 mx-auto mb-4 object-contain"  
              />  
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Iniciar Sesión</h1>  
            </div>  
              
            <div className="input-box">  
              <Input  
                type="text"  
                placeholder="Usuario"  
                value={username}  
                onChange={(e) => setUsername(e.target.value)}  
                required  
                className="auth-input"  
              />  
              <User className="input-icon" />  
            </div>  
              
            <div className="input-box">  
              <Input  
                type="password"  
                placeholder="Contraseña"  
                value={password}  
                onChange={(e) => setPassword(e.target.value)}  
                required  
                className="auth-input"  
              />  
              <Lock className="input-icon" />  
            </div>  
  
            <Button   
              type="submit"   
              className="auth-btn"  
              disabled={loading}  
            >  
              {loading ? "Cargando..." : "Iniciar Sesión"}  
            </Button>  
  
            {/* Botón de autenticación biométrica */}  
            {isSupported && isRegistered && (  
              <Button  
                type="button"  
                onClick={handleBiometricLogin}  
                className="auth-btn-biometric"  
                disabled={loading}  
              >  
                <Fingerprint className="h-5 w-5 mr-2" />  
                Acceder con Biometría  
              </Button>  
            )}  
  
          </form>  
        </div>  
  
        {/* Info Panel */}  
        <div className="form-box info">  
          <div className="info-content">  
            <h1 className="text-3xl font-bold text-white mb-4">¡Bienvenido!</h1>  
            <p className="text-white/90 mb-6">  
              Sistema de Control de Acceso SRC  
            </p>  
            <p className="text-white/80 text-sm">  
              Accede con tus credenciales para gestionar el control de acceso  
            </p>  
          </div>  
        </div>  
  
        {/* Toggle Background */}  
        <div className="toggle-box">  
          <div className="toggle-background"></div>  
        </div>  
      </div>  
  
      <style>{`  
        .auth-container {  
          position: relative;  
          width: 850px;  
          height: 550px;  
          background: #fff;  
          border-radius: 30px;  
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);  
          margin: 20px;  
          overflow: hidden;  
          max-width: 90vw;  
        }  
  
        .form-box {  
          position: absolute;  
          width: 50%;  
          height: 100%;  
          display: flex;  
          align-items: center;  
          justify-content: center;  
          padding: 40px;  
          transition: 0.6s ease-in-out;  
        }  
  
        .form-box.login {  
          left: 0;  
          background: #fff;  
          z-index: 2;  
        }  
  
        .form-box.info {  
          right: 0;  
          background: transparent;  
          color: #fff;  
          z-index: 3;  
        }  
  
        .form-box form {  
          width: 100%;  
          max-width: 300px;  
        }  
  
        .input-box {  
          position: relative;  
          margin: 30px 0;  
        }  
  
        .auth-input {  
          width: 100%;  
          padding: 13px 50px 13px 20px !important;  
          background: #eee !important;  
          border-radius: 8px !important;  
          border: none !important;  
          outline: none !important;  
          font-size: 16px !important;  
          color: #333 !important;  
          font-weight: 500 !important;  
        }  
  
        .auth-input::placeholder {  
          color: #888 !important;  
          font-weight: 400 !important;  
        }  
  
        .input-icon {  
          position: absolute;  
          right: 20px;  
          top: 50%;  
          transform: translateY(-50%);  
          width: 20px;  
          height: 20px;  
          color: #888;  
          pointer-events: none;  
        }  
  
        .auth-btn {  
          width: 100%;  
          height: 48px;  
          background: hsl(var(--primary)) !important;  
          border-radius: 8px !important;  
          box-shadow: var(--shadow-form) !important;  
          border: none !important;  
          cursor: pointer !important;  
          font-size: 16px !important;  
          color: hsl(var(--primary-foreground)) !important;  
          font-weight: 600 !important;  
          margin-top: 20px;  
          transition: var(--transition-smooth);  
        }  
  
        .auth-btn:hover {  
          background: hsl(217 91% 55%) !important;  
        }  
  
        .auth-btn-biometric {  
          width: 100%;  
          height: 48px;  
          background: hsl(var(--secondary)) !important;  
          border-radius: 8px !important;  
          box-shadow: var(--shadow-form) !important;  
          border: none !important;  
          cursor: pointer !important;  
          font-size: 14px !important;  
          color: hsl(var(--secondary-foreground)) !important;  
          font-weight: 600 !important;  
          margin-top: 15px;  
          transition: var(--transition-smooth);  
          display: flex;  
          align-items: center;  
          justify-content: center;  
        }  
  
        .auth-btn-biometric:hover {  
          background: hsl(var(--secondary)/0.8) !important;  
        }  
  
        .auth-btn-secondary {  
          width: 100%;  
          height: 40px;  
          background: transparent !important;  
          border: 1px solid hsl(var(--border)) !important;  
          border-radius: 8px !important;  
          cursor: pointer !important;  
          font-size: 12px !important;  
          color: hsl(var(--muted-foreground)) !important;  
          font-weight: 500 !important;  
          margin-top: 15px;  
          transition: var(--transition-smooth);  
        }  
  
        .auth-btn-secondary:hover {  
          background: hsl(var(--muted)/0.1) !important;  
        }  
  
        .info-content {  
          text-align: center;  
          z-index: 5;  
          position: relative;  
        }  
  
        .toggle-box {  
          position: absolute;  
          width: 100%;  
          height: 100%;  
          pointer-events: none;  
        }  
  
        .toggle-background {  
          content: '';  
          position: absolute;  
          right: 0;  
          width: 50%;  
          height: 100%;  
          background: var(--gradient-blue-form);  
          z-index: 2;  
          transition: 1.8s ease-in-out;  
        }  
  
        /* Responsive Design */  
        @media screen and (max-width: 768px) {  
          .auth-container {  
            width: 100%;  
            height: 100vh;  
            border-radius: 0;  
            margin: 0;  
          }  
  
          .form-box {  
            width: 100%;  
            padding: 20px;  
          }  
  
          .form-box.login {  
            position: relative;  
            height: 70%;  
            background: #fff;  
          }  
  
          .form-box.info {  
            position: relative;  
            height: 30%;  
            background: var(--gradient-blue-form);  
          }  
  
          .toggle-background {  
            display: none;  
          }  
  
          .input-box {  
            margin: 20px 0;  
          }  
        }  
  
        @media screen and (max-width: 400px) {  
          .form-box {  
            padding: 15px;  
          }  
            
          .info-content h1 {  
            font-size: 24px;  
          }
        }

        /* Swipe indicator animation */
        @keyframes bounce-up {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        .bounce-up {
          animation: bounce-up 2s infinite;
        }
      `}</style>
    </div>  
  );  
};