import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GPSDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: 'online' | 'offline';
  latitude?: number;
  longitude?: number;
  speed?: number;
  address?: string;
  lastUpdate?: string;
  model?: string;
  phone?: string;
}

export const useGPSDevices = () => {
  const [devices, setDevices] = useState<GPSDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch devices from traccar_devices table
      const { data: devicesData, error: devicesError } = await supabase
        .from('traccar_devices')
        .select('*')
        .order('name');

      if (devicesError) throw devicesError;

      // Fetch latest positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('traccar_positions')
        .select('*')
        .order('device_time', { ascending: false });

      if (positionsError) throw positionsError;

      // Create a map of device_id to latest position
      const positionMap = new Map();
      positionsData?.forEach(pos => {
        if (!positionMap.has(pos.device_id)) {
          positionMap.set(pos.device_id, pos);
        }
      });

      // Combine devices with their positions
      const combinedDevices: GPSDevice[] = (devicesData || []).map(device => {
        const position = positionMap.get(device.id);
        const lastUpdate = device.last_update || position?.device_time;
        
        // Determine if device is online (updated within last 10 minutes)
        const isOnline = lastUpdate 
          ? (Date.now() - new Date(lastUpdate).getTime()) < 10 * 60 * 1000
          : false;

        return {
          id: device.id,
          name: device.name,
          uniqueId: device.unique_id,
          status: isOnline ? 'online' : 'offline',
          latitude: position?.latitude ? Number(position.latitude) : undefined,
          longitude: position?.longitude ? Number(position.longitude) : undefined,
          speed: position?.speed ? Number(position.speed) : 0,
          address: position?.address || undefined,
          lastUpdate: lastUpdate || undefined,
          model: device.model || undefined,
          phone: device.phone || undefined,
        };
      });

      setDevices(combinedDevices);

      // Get last sync time
      const { data: syncData } = await supabase
        .from('sync_metadata')
        .select('last_sync')
        .eq('id', 'last_sync_timestamp')
        .single();

      if (syncData) {
        setLastSync(syncData.last_sync);
      }

    } catch (err: any) {
      console.error('Error fetching GPS devices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    lastSync,
  };
};
