import { createContext, useContext, useEffect, useState, ReactNode } from 'react';  
  
type Theme = 'light' | 'dark' | 'system';  
  
interface SettingsContextType {  
  theme: Theme;  
  setTheme: (theme: Theme) => void;  
  geolocationEnabled: boolean;  
  setGeolocationEnabled: (enabled: boolean) => void;  
  biometricEnabled: boolean;  
  setBiometricEnabled: (enabled: boolean) => void;  
  mapboxToken: string;  
  setMapboxToken: (token: string) => void;  
}  
  
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
  
export const SettingsProvider = ({ children }: { children: ReactNode }) => {  
  const [theme, setThemeState] = useState<Theme>('system');  
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);  
  const [biometricEnabled, setBiometricEnabled] = useState(false);  
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1IjoiYXJtYW5kb25vZWwiLCJhIjoiY21jeGx1eDF5MDJ4YTJqbjdlamQ4aTRxNCJ9.6M0rLVxf5UTiE7EBw7qjTQ');
  
  // Load settings from localStorage on mount  
  useEffect(() => {  
    const savedTheme = localStorage.getItem('app-theme') as Theme;  
    const savedGeolocation = localStorage.getItem('geolocation-enabled');  
    const savedBiometric = localStorage.getItem('biometricEnabled');  
    const savedMapboxToken = localStorage.getItem('mapbox-token');  
  
    if (savedTheme) setThemeState(savedTheme);  
    if (savedGeolocation) setGeolocationEnabled(savedGeolocation === 'true');  
    if (savedBiometric) setBiometricEnabled(savedBiometric === 'true');  
    if (savedMapboxToken) setMapboxToken(savedMapboxToken);  
  }, []);
  
  // Apply theme to document  
  useEffect(() => {  
    const root = window.document.documentElement;  
      
    const applyTheme = (isDark: boolean) => {  
      if (isDark) {  
        root.classList.add('dark');  
      } else {  
        root.classList.remove('dark');  
      }  
    };  
  
    if (theme === 'system') {  
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');  
      applyTheme(mediaQuery.matches);  
        
      const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);  
      mediaQuery.addEventListener('change', handleChange);  
      return () => mediaQuery.removeEventListener('change', handleChange);  
    } else {  
      applyTheme(theme === 'dark');  
    }  
  }, [theme]);  
  
  const setTheme = (newTheme: Theme) => {  
    setThemeState(newTheme);  
    localStorage.setItem('app-theme', newTheme);  
  };  
  
  const setGeolocationEnabledWithStorage = (enabled: boolean) => {  
    setGeolocationEnabled(enabled);  
    localStorage.setItem('geolocation-enabled', enabled.toString());  
  };
  
  const setBiometricEnabledWithStorage = (enabled: boolean) => {  
    setBiometricEnabled(enabled);  
    localStorage.setItem('biometricEnabled', enabled.toString());  
  };  
  
  const setMapboxTokenWithStorage = (token: string) => {  
    setMapboxToken(token);  
    localStorage.setItem('mapbox-token', token);  
  };  
  
  return (  
    <SettingsContext.Provider value={{  
      theme,  
      setTheme,  
      geolocationEnabled,  
      setGeolocationEnabled: setGeolocationEnabledWithStorage,  
      biometricEnabled,  
      setBiometricEnabled: setBiometricEnabledWithStorage,  
      mapboxToken,  
      setMapboxToken: setMapboxTokenWithStorage,  
    }}>  
      {children}  
    </SettingsContext.Provider>  
  );
};  
  
export const useSettings = () => {  
  const context = useContext(SettingsContext);  
  if (context === undefined) {  
    throw new Error('useSettings must be used within a SettingsProvider');  
  }  
  return context;  
};