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
      NSLocationWhenInUseUsageDescription: 'Esta aplicación necesita acceso a tu ubicación para registrar turnos',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Esta aplicación necesita acceso a tu ubicación para registrar turnos'
    }
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Geolocation: {
      permissions: ['location']
    },
  },
};

export default config;