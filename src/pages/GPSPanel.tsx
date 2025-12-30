import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Car, 
  Activity, 
  Clock, 
  LogOut, 
  Map, 
  History,
  Menu,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Gauge
} from 'lucide-react';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { toast } from '@/hooks/use-toast';

interface GPSSession {
  type: string;
  user: string;
  name?: string;
  timestamp: number;
}

export const GPSPanel = () => {
  const navigate = useNavigate();
  const { devices, loading, error, refetch, lastSync } = useGPSDevices();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [gpsSession, setGpsSession] = useState<GPSSession | null>(null);

  // Check for GPS session
  useEffect(() => {
    const sessionData = localStorage.getItem('gps_session');
    if (!sessionData) {
      navigate('/gps-login', { replace: true });
      return;
    }
    
    try {
      const session = JSON.parse(sessionData) as GPSSession;
      // Check if session is less than 24 hours old
      if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('gps_session');
        navigate('/gps-login', { replace: true });
        return;
      }
      setGpsSession(session);
    } catch {
      navigate('/gps-login', { replace: true });
    }
  }, [navigate]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleSignOut = () => {
    localStorage.removeItem('gps_session');
    toast({
      title: "Sesión cerrada",
      description: "Has salido del sistema GPS",
    });
    navigate('/');
  };

  const handleViewMap = (deviceId?: number) => {
    if (deviceId) {
      navigate(`/gps-mapa?device=${deviceId}`);
    } else {
      navigate('/gps-mapa');
    }
  };

  const handleViewHistory = (deviceId: number) => {
    navigate(`/gps-mapa?device=${deviceId}&mode=history`);
  };

  // Stats calculations
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const totalDevices = devices.length;
  const avgSpeed = devices.length > 0 
    ? Math.round(devices.reduce((acc, d) => acc + (d.speed || 0), 0) / devices.length)
    : 0;

  if (!gpsSession) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-blue-900 text-white z-50 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              <span className="font-bold text-lg">SRC GPS</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-blue-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={() => navigate('/gps-panel')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={() => handleViewMap()}
          >
            <Map className="h-4 w-4 mr-2" />
            Mapa en Vivo
          </Button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
          <div className="text-sm text-blue-300 mb-2">
            {gpsSession.name || gpsSession.user}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-800">Panel de Control GPS</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              {lastSync && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Última sync: {new Date(lastSync).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Dispositivos</p>
                    <p className="text-3xl font-bold text-blue-600">{totalDevices}</p>
                  </div>
                  <Car className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">En Línea</p>
                    <p className="text-3xl font-bold text-green-600">{onlineDevices}</p>
                  </div>
                  <Wifi className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Velocidad Promedio</p>
                    <p className="text-3xl font-bold text-orange-600">{avgSpeed} km/h</p>
                  </div>
                  <Gauge className="h-10 w-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Estado Sistema</p>
                    <p className="text-lg font-bold text-green-600">Operativo</p>
                  </div>
                  <Activity className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicles List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && devices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Cargando dispositivos...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Error: {error}
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay dispositivos configurados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-gray-500">Vehículo</th>
                        <th className="pb-3 font-medium text-gray-500">Estado</th>
                        <th className="pb-3 font-medium text-gray-500 hidden md:table-cell">Velocidad</th>
                        <th className="pb-3 font-medium text-gray-500 hidden lg:table-cell">Última Actualización</th>
                        <th className="pb-3 font-medium text-gray-500 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {devices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <Car className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{device.name}</p>
                                <p className="text-sm text-gray-500 hidden sm:block">
                                  {device.address || 'Ubicación no disponible'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                              {device.status === 'online' ? (
                                <><Wifi className="h-3 w-3 mr-1" /> En línea</>
                              ) : (
                                <><WifiOff className="h-3 w-3 mr-1" /> Fuera de línea</>
                              )}
                            </Badge>
                          </td>
                          <td className="py-4 hidden md:table-cell">
                            <span className="text-gray-900">{Math.round(device.speed || 0)} km/h</span>
                          </td>
                          <td className="py-4 hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-4 w-4" />
                              {device.lastUpdate 
                                ? new Date(device.lastUpdate).toLocaleString()
                                : 'N/A'
                              }
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewMap(device.id)}
                              >
                                <Map className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewHistory(device.id)}
                              >
                                <History className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Historial</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
