import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  TrendingUp, 
  Clock,
  BarChart3,
  UserPlus,
  Map,
  LogOut,
  Home
} from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (section: string) => void;
  onLogout?: () => void;
  onBackToHome?: () => void;
  isActive: boolean;
}

export const WelcomeScreen = ({ onNavigate, onLogout, onBackToHome, isActive }: WelcomeScreenProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHiddenButtons, setShowHiddenButtons] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuOptions = [
    {
      id: 'registro',
      title: 'Registro Acceso',
      subtitle: 'Residencial de Francia',
      icon: MapPin,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'mapa-calor',
      title: 'Mapa de Calor',
      subtitle: 'Análisis de ubicaciones',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'turnos-enhanced',
      title: 'Control de Turnos',
      subtitle: 'Gestión de empleados',
      icon: Clock,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'dashboard-turnos',
      title: 'Dashboard Turnos',
      subtitle: 'Métricas y reportes',
      icon: BarChart3,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 'crear-usuario-cliente',
      title: 'Crear Usuario Cliente',
      subtitle: 'Gestión de usuarios',
      icon: UserPlus,
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'ubicaciones',
      title: 'Mapa de Ubicaciones',
      subtitle: 'Gestión de sitios',
      icon: Map,
      gradient: 'from-cyan-500 to-blue-500'
    }
  ];

  const handleOptionClick = (sectionId: string) => {
    setIsAnimating(true);
    // Pequeño delay para la animación antes de navegar
    setTimeout(() => {
      onNavigate(sectionId);
      setIsAnimating(false);
    }, 300);
  };

  // Touch handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY - currentY;
    
    if (diffY > 10) { // Reduced threshold - easier to trigger
      setIsDragging(true);
      if (diffY > 30) { // Reduced threshold for showing buttons
        setShowHiddenButtons(true);
      }
    } else if (diffY < -10) { // Reduced threshold for swipe down
      setShowHiddenButtons(false);
      setIsDragging(false);
    }
  };

  // Click handler for easy access (alternative to swipe)
  const handleDoubleClick = () => {
    setShowHiddenButtons(!showHiddenButtons);
  };

  const handleTouchEnd = () => {
    setTouchStartY(0);
    setIsDragging(false);
  };

  // Auto-hide hidden buttons after inactivity
  useEffect(() => {
    if (showHiddenButtons) {
      const timer = setTimeout(() => {
        setShowHiddenButtons(false);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showHiddenButtons]);

  return (
    <>
      <div 
        ref={containerRef}
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "var(--gradient-primary)" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        
        {/* Swipe Indicator - Always visible */}
        <div className="swipe-hint">
          <div className="swipe-hint-content">
            <div className="swipe-hint-line"></div>
            <span className="swipe-hint-text">Desliza hacia arriba o doble click para más opciones</span>
          </div>
        </div>
        
        <div className={`welcome-container ${isActive ? 'active' : ''} ${isAnimating ? 'animating' : ''}`}>
          
          {/* Welcome Message Panel */}
          <div className="message-panel">
            <div className="message-content">
              <img 
                src="/lovable-uploads/6f1746d0-0b44-447b-a333-82019dfecd73.png" 
                alt="SRC Logo" 
                className="w-20 h-20 mx-auto mb-6 object-contain"
              />
              <h1 className="text-4xl font-bold text-white mb-4">¡Bienvenido!</h1>
              <p className="text-white/90 mb-6 text-lg">
                Sistema de Control de Acceso SRC
              </p>
              <p className="text-white/80 text-sm">
                Selecciona una opción para acceder a las funcionalidades del sistema
              </p>
            </div>
          </div>

          {/* Menu Options Panel */}
          <div className="options-panel">
            <div className="options-grid">
              {menuOptions.map((option, index) => (
                <Button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className={`option-card group animate-fade-in`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    background: `linear-gradient(135deg, var(--primary), var(--accent))`
                  }}
                  variant="outline"
                >
                  <div className="option-content">
                    <option.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="font-semibold text-sm mb-1">{option.title}</h3>
                    <p className="text-xs">{option.subtitle}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Toggle Background */}
          <div className="toggle-box">
            <div className="toggle-background"></div>
          </div>
        </div>
      </div>

      {/* Hidden Buttons Panel */}
      <div className={`hidden-buttons-panel ${showHiddenButtons ? 'show' : ''}`}>
        <div className="hidden-buttons-content">
          <Button
            onClick={onBackToHome}
            className="hidden-action-button"
            variant="outline"
          >
            <Home className="w-5 h-5 mr-2" />
            Pantalla Principal
          </Button>
          <Button
            onClick={onLogout}
            className="hidden-action-button logout-button"
            variant="outline"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
        <div className="swipe-indicator">
          <div className="swipe-line"></div>
        </div>
      </div>

      <style>{`
        .welcome-container {
          position: relative;
          width: 1000px;
          height: 600px;
          background: #fff;
          border-radius: 30px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
          margin: 20px;
          overflow: hidden;
          max-width: 90vw;
        }

        .message-panel {
          position: absolute;
          width: 40%;
          height: 100%;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: transparent;
          color: #fff;
          z-index: 3;
          transition: 0.8s ease-in-out;
        }

        .options-panel {
          position: absolute;
          width: 60%;
          height: 100%;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #fff;
          z-index: 2;
          transition: 0.8s ease-in-out;
        }

        .message-content {
          text-align: center;
          z-index: 5;
          position: relative;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          width: 100%;
          max-width: 500px;
        }

        .option-card {
          height: 120px !important;
          border: 2px solid hsl(var(--border)) !important;
          border-radius: 16px !important;
          background: white !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative;
          overflow: hidden;
        }

        .option-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: var(--shadow-elegant) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .option-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gradient-primary);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        .option-card:hover::before {
          opacity: 1;
        }

        .option-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          position: relative;
          z-index: 2;
          transition: color 0.3s ease;
          color: hsl(var(--foreground));
        }

        .option-content h3 {
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .option-content p {
          color: hsl(var(--muted-foreground));
        }

        .option-content svg {
          color: hsl(var(--primary));
        }

        .option-card:hover .option-content h3,
        .option-card:hover .option-content p {
          color: white !important;
        }

        .option-card:hover .option-content svg {
          color: white !important;
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
          left: 0;
          width: 40%;
          height: 100%;
          background: var(--gradient-blue-form);
          z-index: 2;
          transition: 1.8s ease-in-out;
        }

        /* Swipe Hint - Always visible indicator */
        .swipe-hint {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 500;
          pointer-events: none;
        }

        .swipe-hint-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          padding: 12px 20px;
          border-radius: 20px;
          border: 1px solid hsl(var(--border));
          animation: pulse-gentle 3s infinite;
        }

        .swipe-hint-line {
          width: 30px;
          height: 3px;
          background: hsl(var(--primary));
          border-radius: 2px;
          animation: bounce-gentle 2s infinite;
        }

        .swipe-hint-text {
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          text-align: center;
          white-space: nowrap;
        }

        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .welcome-container.animating .message-panel {
          transform: translateX(-100%);
        }

        .welcome-container.animating .options-panel {
          transform: translateX(100%);
        }

        /* Hidden Buttons Panel */
        .hidden-buttons-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid hsl(var(--border));
          padding: 20px;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.1);
        }

        .hidden-buttons-panel.show {
          transform: translateY(0);
        }

        .hidden-buttons-content {
          display: flex;
          gap: 15px;
          justify-content: center;
          align-items: center;
          max-width: 400px;
          margin: 0 auto;
        }

        .hidden-action-button {
          flex: 1;
          height: 50px !important;
          border-radius: 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
          background: white !important;
          border: 2px solid hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }

        .hidden-action-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .logout-button:hover {
          border-color: hsl(var(--destructive)) !important;
          color: hsl(var(--destructive)) !important;
        }

        .swipe-indicator {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }

        .swipe-line {
          width: 40px;
          height: 4px;
          background: hsl(var(--muted-foreground));
          border-radius: 2px;
          opacity: 0.5;
        }

        /* Responsive Design */
        @media screen and (max-width: 768px) {
          .welcome-container {
            width: 100%;
            height: 100vh;
            border-radius: 0;
            margin: 0;
            flex-direction: column;
          }

          .message-panel {
            position: relative;
            width: 100%;
            height: 35%;
            background: var(--gradient-blue-form);
            padding: 20px;
            padding-top: 40px;
          }

          .options-panel {
            position: relative;
            width: 100%;
            height: 65%;
            background: #fff;
            padding: 20px;
            padding-top: 10px;
          }

          .options-grid {
            grid-template-columns: 1fr;
            gap: 15px;
            max-height: calc(100% - 40px);
            overflow-y: auto;
          }

          .option-card {
            height: 100px !important;
          }

          .toggle-background {
            display: none;
          }

          .message-content h1 {
            font-size: 28px;
          }

          .message-content p {
            font-size: 16px;
          }

          /* Hidden buttons for mobile */
          .hidden-buttons-panel {
            padding: 15px;
          }

          .hidden-buttons-content {
            flex-direction: column;
            gap: 12px;
          }

          .hidden-action-button {
            width: 100%;
            height: 45px !important;
          }
        }

        @media screen and (max-width: 400px) {
          .message-panel,
          .options-panel {
            padding: 15px;
          }
          
          .message-content h1 {
            font-size: 24px;
          }

          .option-card {
            height: 80px !important;
          }

          .options-grid {
            gap: 10px;
          }
        }
      `}</style>
    </>
  );
};