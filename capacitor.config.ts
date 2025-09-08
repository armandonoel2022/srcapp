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
    infoPlist: {
      NSCameraUsageDescription: 'Esta aplicación necesita acceso a la cámara para escanear documentos de identidad.',
      NSPhotoLibraryAddUsageDescription: 'Esta aplicación necesita acceso a la galería de fotos para guardar imágenes escaneadas.',
      NSPhotoLibraryUsageDescription: 'Esta aplicación necesita acceso a la galería de fotos para seleccionar imágenes.',
      NSLocationWhenInUseUsageDescription: 'Esta aplicación necesita acceso a la ubicación para registrar la posición durante el registro de turnos.'
    }
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location', 'coarseLocation']
    },
  },
};

export default config;