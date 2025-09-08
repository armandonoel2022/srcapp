import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cbbbc9dcefa4481098eefb052e77b636',
  appName: 'srcapp',
  webDir: 'dist',
  server: {
    url: 'https://cbbbc9dc-efa4-4810-98ee-fb052e77b636.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    allowsLinkPreview: false,
    handleApplicationURL: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Esta aplicación necesita acceso a la ubicación para registrar la posición durante el registro de turnos.'
    }
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Geolocation: {
      permissions: ['location', 'coarseLocation']
    },
  },
};

export default config;