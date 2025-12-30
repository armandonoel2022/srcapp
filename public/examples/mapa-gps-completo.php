<?php
/**
 * GPS Map - Versión PHP equivalente al sistema React/Lovable
 * Incluye: Tiempo real, Historial, Simulación de recorrido, Estadísticas
 */

// Configuración
$MAPBOX_TOKEN = 'TU_TOKEN_MAPBOX';
$SUPABASE_URL = 'https://tu-proyecto.supabase.co';
$SUPABASE_KEY = 'tu-anon-key';

// Función para hacer peticiones a Supabase
function supabaseQuery($endpoint, $params = []) {
    global $SUPABASE_URL, $SUPABASE_KEY;
    
    $url = $SUPABASE_URL . '/rest/v1/' . $endpoint;
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $SUPABASE_KEY,
        'Authorization: Bearer ' . $SUPABASE_KEY,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Obtener dispositivos
function getDevices() {
    $devices = supabaseQuery('traccar_devices', ['order' => 'name']);
    $positions = supabaseQuery('traccar_positions', [
        'order' => 'device_time.desc',
        'limit' => 100
    ]);
    
    // Crear mapa de posiciones por device_id
    $positionMap = [];
    foreach ($positions as $pos) {
        if (!isset($positionMap[$pos['device_id']])) {
            $positionMap[$pos['device_id']] = $pos;
        }
    }
    
    // Combinar dispositivos con posiciones
    $result = [];
    foreach ($devices as $device) {
        $pos = $positionMap[$device['id']] ?? null;
        $lastUpdate = $device['last_update'] ?? ($pos['device_time'] ?? null);
        
        // Online si actualizó en los últimos 10 minutos
        $isOnline = $lastUpdate && (time() - strtotime($lastUpdate)) < 600;
        
        $result[] = [
            'id' => $device['id'],
            'name' => $device['name'],
            'uniqueId' => $device['unique_id'],
            'status' => $isOnline ? 'online' : 'offline',
            'latitude' => $pos['latitude'] ?? null,
            'longitude' => $pos['longitude'] ?? null,
            'speed' => round(($pos['speed'] ?? 0) * 1.852, 1), // knots to km/h
            'address' => $pos['address'] ?? '',
            'lastUpdate' => $lastUpdate
        ];
    }
    
    return $result;
}

// Obtener historial con muestreo inteligente
function getHistory($deviceId, $startDate, $endDate, $frequencySeconds = 60, $timeOfDay = 'all') {
    $startIso = $startDate . 'T00:00:00+00:00';
    $endIso = $endDate . 'T23:59:59+00:00';
    
    $positions = supabaseQuery('traccar_positions', [
        'device_id' => 'eq.' . $deviceId,
        'device_time' => 'gte.' . $startIso,
        'device_time' => 'lte.' . $endIso,
        'order' => 'device_time.asc',
        'limit' => 2000
    ]);
    
    if (empty($positions)) return [];
    
    // Filtrar por frecuencia
    $filtered = [];
    $lastTime = 0;
    
    foreach ($positions as $pos) {
        if (!$pos['latitude'] || !$pos['longitude']) continue;
        
        $pointTime = strtotime($pos['device_time']);
        
        // Filtrar por horario
        if ($timeOfDay !== 'all') {
            $hour = (int)date('H', $pointTime);
            if ($timeOfDay === 'morning' && ($hour < 6 || $hour >= 12)) continue;
            if ($timeOfDay === 'afternoon' && ($hour < 12 || $hour >= 18)) continue;
            if ($timeOfDay === 'night' && ($hour >= 6 && $hour < 18)) continue;
        }
        
        if ($pointTime - $lastTime >= $frequencySeconds) {
            $filtered[] = [
                'id' => $pos['id'],
                'latitude' => (float)$pos['latitude'],
                'longitude' => (float)$pos['longitude'],
                'speed' => round(($pos['speed'] ?? 0) * 1.852, 1),
                'deviceTime' => $pos['device_time'],
                'address' => $pos['address'] ?? ''
            ];
            $lastTime = $pointTime;
        }
    }
    
    // Muestreo inteligente manteniendo inicio y fin
    $maxPoints = 150;
    if (count($filtered) > $maxPoints) {
        $sampled = [];
        $step = (count($filtered) - 1) / ($maxPoints - 1);
        
        for ($i = 0; $i < $maxPoints; $i++) {
            $index = (int)round($i * $step);
            $sampled[] = $filtered[$index];
        }
        
        // Asegurar que el último punto sea el real
        $sampled[count($sampled) - 1] = $filtered[count($filtered) - 1];
        $filtered = $sampled;
    }
    
    return $filtered;
}

// Calcular estadísticas del viaje
function calculateTripStats($history) {
    if (count($history) < 2) return null;
    
    $startTime = strtotime($history[0]['deviceTime']);
    $endTime = strtotime($history[count($history) - 1]['deviceTime']);
    $durationSeconds = $endTime - $startTime;
    
    // Duración formateada
    $hours = floor($durationSeconds / 3600);
    $minutes = floor(($durationSeconds % 3600) / 60);
    $durationFormatted = $hours > 0 ? "{$hours}h {$minutes}min" : "{$minutes} min";
    
    // Calcular distancia con fórmula Haversine
    $totalDistance = 0;
    for ($i = 1; $i < count($history); $i++) {
        $totalDistance += haversineDistance(
            $history[$i-1]['latitude'], $history[$i-1]['longitude'],
            $history[$i]['latitude'], $history[$i]['longitude']
        );
    }
    
    // Velocidades
    $speeds = array_filter(array_column($history, 'speed'), fn($s) => $s > 0);
    $avgSpeed = !empty($speeds) ? array_sum($speeds) / count($speeds) : 0;
    $maxSpeed = !empty($speeds) ? max($speeds) : 0;
    
    // Detectar paradas (velocidad < 5 km/h)
    $stopCount = 0;
    $inStop = false;
    foreach ($history as $point) {
        if ($point['speed'] < 5) {
            if (!$inStop) { $stopCount++; $inStop = true; }
        } else {
            $inStop = false;
        }
    }
    
    return [
        'startTime' => date('H:i', $startTime),
        'endTime' => date('H:i', $endTime),
        'duration' => $durationFormatted,
        'durationSeconds' => $durationSeconds,
        'distance' => round($totalDistance, 2),
        'avgSpeed' => round($avgSpeed, 1),
        'maxSpeed' => round($maxSpeed, 1),
        'stopCount' => $stopCount,
        'pointCount' => count($history)
    ];
}

// Fórmula Haversine para calcular distancia
function haversineDistance($lat1, $lon1, $lat2, $lon2) {
    $R = 6371; // Radio de la Tierra en km
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    return $R * $c;
}

// Obtener waypoints clave
function getWaypoints($history) {
    if (count($history) < 2) return [];
    
    $waypoints = [];
    
    // Inicio
    $waypoints[] = ['point' => $history[0], 'type' => 'start', 'index' => 0];
    
    // Detectar paradas significativas
    $stopStart = -1;
    for ($i = 1; $i < count($history) - 1; $i++) {
        if ($history[$i]['speed'] < 3) {
            if ($stopStart === -1) $stopStart = $i;
        } else {
            if ($stopStart !== -1 && $i - $stopStart >= 2) {
                $midStop = (int)(($stopStart + $i) / 2);
                $waypoints[] = ['point' => $history[$midStop], 'type' => 'stop', 'index' => $midStop];
            }
            $stopStart = -1;
        }
    }
    
    // Fin
    $waypoints[] = ['point' => $history[count($history) - 1], 'type' => 'end', 'index' => count($history) - 1];
    
    return $waypoints;
}

// Procesar solicitud AJAX
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    
    switch ($_GET['action']) {
        case 'devices':
            echo json_encode(getDevices());
            break;
            
        case 'history':
            $history = getHistory(
                $_GET['deviceId'],
                $_GET['startDate'],
                $_GET['endDate'],
                $_GET['frequency'] ?? 60,
                $_GET['timeOfDay'] ?? 'all'
            );
            $stats = calculateTripStats($history);
            $waypoints = getWaypoints($history);
            echo json_encode([
                'history' => $history,
                'stats' => $stats,
                'waypoints' => $waypoints
            ]);
            break;
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GPS Map - Tiempo Real e Historial</title>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        
        .container { display: flex; height: 100vh; }
        
        /* Sidebar */
        .sidebar {
            width: 320px;
            background: white;
            box-shadow: 2px 0 8px rgba(0,0,0,0.1);
            overflow-y: auto;
            padding: 16px;
        }
        
        .sidebar h2 { color: #1e3a8a; margin-bottom: 16px; font-size: 18px; }
        
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
        .form-group select, .form-group input {
            width: 100%; padding: 8px; border: 1px solid #e2e8f0;
            border-radius: 6px; font-size: 14px;
        }
        
        .btn {
            width: 100%; padding: 10px; border: none; border-radius: 6px;
            cursor: pointer; font-weight: 500; margin-top: 8px;
        }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover { background: #2563eb; }
        .btn-success { background: #10b981; color: white; }
        .btn-purple { background: #8b5cf6; color: white; }
        
        .mode-toggle { display: flex; gap: 8px; margin-bottom: 16px; }
        .mode-btn {
            flex: 1; padding: 8px; border: none; border-radius: 6px;
            cursor: pointer; font-size: 12px;
        }
        .mode-btn.active { background: #3b82f6; color: white; }
        .mode-btn:not(.active) { background: #f1f5f9; color: #64748b; }
        
        /* Time of day filter */
        .time-filter { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 12px; }
        .time-btn {
            padding: 6px 4px; border: 1px solid #e2e8f0; border-radius: 4px;
            background: white; cursor: pointer; font-size: 10px; text-align: center;
        }
        .time-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        
        /* Stats card */
        .stats-card {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 8px; padding: 12px; margin-top: 12px;
        }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .stat-item {
            background: white; padding: 8px; border-radius: 6px;
            display: flex; align-items: center; gap: 8px;
        }
        .stat-icon { width: 28px; height: 28px; border-radius: 4px; display: flex;
            align-items: center; justify-content: center; font-size: 12px; }
        .stat-icon.blue { background: #dbeafe; color: #3b82f6; }
        .stat-icon.green { background: #dcfce7; color: #22c55e; }
        .stat-icon.orange { background: #ffedd5; color: #f97316; }
        .stat-icon.red { background: #fee2e2; color: #ef4444; }
        .stat-label { font-size: 10px; color: #64748b; }
        .stat-value { font-size: 13px; font-weight: 600; color: #1e293b; }
        
        /* Waypoints */
        .waypoints { margin-top: 12px; max-height: 180px; overflow-y: auto; }
        .waypoint {
            display: flex; gap: 8px; padding: 8px; border-radius: 6px;
            cursor: pointer; transition: background 0.2s;
        }
        .waypoint:hover { background: #f8fafc; }
        .waypoint-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
        .waypoint-dot.start { background: #22c55e; }
        .waypoint-dot.stop { background: #eab308; }
        .waypoint-dot.end { background: #ef4444; }
        .waypoint-info { flex: 1; min-width: 0; }
        .waypoint-type { font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px; }
        .waypoint-type.start { background: #dcfce7; color: #22c55e; }
        .waypoint-type.stop { background: #fef9c3; color: #ca8a04; }
        .waypoint-type.end { background: #fee2e2; color: #ef4444; }
        .waypoint-time { font-size: 11px; color: #64748b; margin-left: 6px; }
        .waypoint-address { font-size: 11px; color: #64748b; margin-top: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* Map */
        .map-container { flex: 1; position: relative; }
        #map { width: 100%; height: 100%; }
        
        /* Simulation controls */
        .simulation-panel {
            position: absolute; bottom: 16px; right: 16px;
            background: white; border-radius: 12px; padding: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: 280px;
            display: none;
        }
        .simulation-panel.active { display: block; }
        .sim-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .sim-title { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px; }
        .sim-dot { width: 8px; height: 8px; border-radius: 50%; background: #f97316; }
        .sim-dot.playing { animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .speed-badge { font-size: 11px; background: #fff7ed; color: #f97316; padding: 2px 8px; border-radius: 4px; }
        
        .sim-info { background: linear-gradient(135deg, #fff7ed, #fef3c7); padding: 10px; border-radius: 8px; margin-bottom: 12px; }
        .sim-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
        .sim-label { color: #64748b; }
        .sim-value { font-weight: 500; color: #1e293b; }
        .sim-speed { color: #f97316; font-weight: 600; }
        
        .sim-slider { width: 100%; margin-bottom: 8px; }
        .sim-times { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-bottom: 12px; }
        
        .sim-controls { display: flex; justify-content: center; gap: 8px; }
        .sim-btn {
            width: 36px; height: 36px; border: 1px solid #e2e8f0; border-radius: 6px;
            background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .sim-btn:hover { background: #f8fafc; }
        .sim-btn.play { background: #f97316; border-color: #f97316; color: white; }
        .sim-btn.play:hover { background: #ea580c; }
        
        /* Legend */
        .legend {
            position: absolute; bottom: 16px; left: 16px;
            background: white; border-radius: 8px; padding: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 12px;
        }
        .legend-title { font-weight: 500; margin-bottom: 8px; }
        .legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .legend-marker { width: 20px; height: 20px; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; }
        .legend-line { width: 20px; height: 3px; border-radius: 2px; }
        .legend-line.dashed { border-top: 2px dashed #8b5cf6; height: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>🚗 GPS Tracker</h2>
            
            <div class="mode-toggle">
                <button class="mode-btn active" id="btnLive" onclick="setMode('live')">📍 Tiempo Real</button>
                <button class="mode-btn" id="btnHistory" onclick="setMode('history')">📜 Historial</button>
            </div>
            
            <div class="form-group">
                <label>Vehículo</label>
                <select id="deviceSelect" onchange="onDeviceChange()">
                    <option value="">Seleccionar vehículo...</option>
                </select>
            </div>
            
            <div id="liveControls">
                <button class="btn btn-primary" onclick="refreshDevices()">🔄 Actualizar</button>
                <div id="deviceInfo" style="margin-top: 12px;"></div>
            </div>
            
            <div id="historyControls" style="display: none;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div class="form-group">
                        <label>Fecha Inicio</label>
                        <input type="date" id="startDate">
                    </div>
                    <div class="form-group">
                        <label>Fecha Fin</label>
                        <input type="date" id="endDate">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Filtrar por horario</label>
                    <div class="time-filter">
                        <button class="time-btn active" data-time="all" onclick="setTimeFilter('all')">🕐 Todo</button>
                        <button class="time-btn" data-time="morning" onclick="setTimeFilter('morning')">☀️ Mañana</button>
                        <button class="time-btn" data-time="afternoon" onclick="setTimeFilter('afternoon')">🌤 Tarde</button>
                        <button class="time-btn" data-time="night" onclick="setTimeFilter('night')">🌙 Noche</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Frecuencia</label>
                    <select id="frequency">
                        <option value="10">Cada 10 segundos</option>
                        <option value="30">Cada 30 segundos</option>
                        <option value="60" selected>Cada 1 minuto</option>
                        <option value="300">Cada 5 minutos</option>
                    </select>
                </div>
                
                <button class="btn btn-purple" onclick="loadHistory()">▶️ Consultar Recorrido</button>
                
                <div id="statsContainer" style="display: none;"></div>
                <div id="waypointsContainer" style="display: none;"></div>
            </div>
        </div>
        
        <div class="map-container">
            <div id="map"></div>
            
            <div class="simulation-panel" id="simulationPanel">
                <div class="sim-header">
                    <div class="sim-title"><span class="sim-dot" id="simDot"></span> Recorrido</div>
                    <span class="speed-badge" id="speedBadge">1x</span>
                </div>
                <div class="sim-info">
                    <div class="sim-row">
                        <span class="sim-label">Punto:</span>
                        <span class="sim-value" id="simPoint">0 / 0</span>
                    </div>
                    <div class="sim-row">
                        <span class="sim-label">Hora:</span>
                        <span class="sim-value" id="simTime">--:--</span>
                    </div>
                    <div class="sim-row">
                        <span class="sim-label">Velocidad:</span>
                        <span class="sim-value sim-speed" id="simSpeed">0 km/h</span>
                    </div>
                </div>
                <input type="range" class="sim-slider" id="simSlider" min="0" max="100" value="0" oninput="onSimSlider()">
                <div class="sim-times">
                    <span id="simStartTime">--:--</span>
                    <span id="simEndTime">--:--</span>
                </div>
                <div class="sim-controls">
                    <button class="sim-btn" onclick="simRewind()">⏪</button>
                    <button class="sim-btn play" id="simPlayBtn" onclick="simTogglePlay()">▶️</button>
                    <button class="sim-btn" onclick="simForward()">⏩</button>
                    <button class="sim-btn" onclick="simReset()">🔄</button>
                    <button class="sim-btn" onclick="simCycleSpeed()" id="simSpeedBtn">1x</button>
                </div>
            </div>
            
            <div class="legend" id="legend" style="display: none;">
                <div class="legend-title">Leyenda</div>
                <div class="legend-item">
                    <div class="legend-marker" style="background: #22c55e;">A</div>
                    <span>Inicio</span>
                </div>
                <div class="legend-item">
                    <div class="legend-marker" style="background: #ef4444;">B</div>
                    <span>Fin</span>
                </div>
                <div class="legend-item">
                    <div class="legend-line dashed"></div>
                    <span>Puntos GPS</span>
                </div>
                <div class="legend-item">
                    <div class="legend-line" style="background: #f97316;"></div>
                    <span>Recorrido</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Configuración
        mapboxgl.accessToken = '<?= $MAPBOX_TOKEN ?>';
        
        // Estado
        let map, mode = 'live', selectedDevice = null;
        let devices = [], historyData = [], waypoints = [];
        let liveMarkers = [], historyMarkers = [];
        let timeOfDay = 'all';
        
        // Simulación
        let simIndex = 0, simPlaying = false, simSpeed = 1, simInterval = null;
        let simMarker = null, simTrailCoords = [];
        
        // Inicializar mapa
        function initMap() {
            map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-69.9312, 18.4861],
                zoom: 12
            });
            
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
            
            map.on('load', () => {
                refreshDevices();
            });
        }
        
        // Cargar dispositivos
        async function refreshDevices() {
            const res = await fetch('?action=devices');
            devices = await res.json();
            
            const select = document.getElementById('deviceSelect');
            select.innerHTML = '<option value="">Seleccionar vehículo...</option>';
            devices.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = `${d.status === 'online' ? '🟢' : '🔴'} ${d.name}`;
                select.appendChild(opt);
            });
            
            if (mode === 'live') updateLiveMarkers();
        }
        
        // Actualizar marcadores en tiempo real
        function updateLiveMarkers() {
            // Limpiar marcadores anteriores
            liveMarkers.forEach(m => m.remove());
            liveMarkers = [];
            
            devices.forEach(device => {
                if (!device.latitude || !device.longitude) return;
                
                const el = document.createElement('div');
                el.innerHTML = `
                    <div style="position: relative;">
                        <div style="width: 40px; height: 40px; background: ${device.status === 'online' ? '#10b981' : '#ef4444'};
                            border-radius: 50%; display: flex; align-items: center; justify-content: center;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;">
                            <span style="font-size: 18px;">🚗</span>
                        </div>
                        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
                            background: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;
                            font-weight: bold; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                            ${device.name}
                        </div>
                    </div>
                `;
                
                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([device.longitude, device.latitude])
                    .setPopup(new mapboxgl.Popup().setHTML(`
                        <div style="padding: 8px;">
                            <h3 style="font-weight: bold; color: #1e3a8a; margin-bottom: 8px;">${device.name}</h3>
                            <p>Estado: ${device.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea'}</p>
                            <p>Velocidad: ${device.speed} km/h</p>
                            <p style="font-size: 12px; color: #666;">${device.address || 'Sin dirección'}</p>
                        </div>
                    `))
                    .addTo(map);
                
                liveMarkers.push(marker);
                
                if (selectedDevice == device.id) {
                    map.flyTo({ center: [device.longitude, device.latitude], zoom: 15 });
                    showDeviceInfo(device);
                }
            });
        }
        
        // Mostrar info del dispositivo
        function showDeviceInfo(device) {
            document.getElementById('deviceInfo').innerHTML = `
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <p><strong>Estado:</strong> ${device.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea'}</p>
                    <p><strong>Velocidad:</strong> ${device.speed} km/h</p>
                    <p><strong>Ubicación:</strong> ${device.address || 'No disponible'}</p>
                </div>
            `;
        }
        
        // Cambiar modo
        function setMode(newMode) {
            mode = newMode;
            
            document.getElementById('btnLive').classList.toggle('active', mode === 'live');
            document.getElementById('btnHistory').classList.toggle('active', mode === 'history');
            document.getElementById('liveControls').style.display = mode === 'live' ? 'block' : 'none';
            document.getElementById('historyControls').style.display = mode === 'history' ? 'block' : 'none';
            
            if (mode === 'live') {
                clearHistoryLayers();
                refreshDevices();
            }
        }
        
        // Limpiar capas de historial
        function clearHistoryLayers() {
            ['original-route', 'simulation-trail'].forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
                if (map.getSource(id)) map.removeSource(id);
            });
            
            historyMarkers.forEach(m => m.remove());
            historyMarkers = [];
            
            if (simMarker) { simMarker.remove(); simMarker = null; }
            
            document.getElementById('legend').style.display = 'none';
            document.getElementById('simulationPanel').classList.remove('active');
            document.getElementById('statsContainer').style.display = 'none';
            document.getElementById('waypointsContainer').style.display = 'none';
            
            simStop();
        }
        
        // Seleccionar dispositivo
        function onDeviceChange() {
            selectedDevice = document.getElementById('deviceSelect').value;
            if (mode === 'live' && selectedDevice) {
                const device = devices.find(d => d.id == selectedDevice);
                if (device && device.latitude && device.longitude) {
                    map.flyTo({ center: [device.longitude, device.latitude], zoom: 15 });
                    showDeviceInfo(device);
                }
            }
        }
        
        // Filtro de horario
        function setTimeFilter(value) {
            timeOfDay = value;
            document.querySelectorAll('.time-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.time === value);
            });
        }
        
        // Cargar historial
        async function loadHistory() {
            if (!selectedDevice) {
                alert('Selecciona un vehículo');
                return;
            }
            
            clearHistoryLayers();
            liveMarkers.forEach(m => m.remove());
            liveMarkers = [];
            
            const params = new URLSearchParams({
                action: 'history',
                deviceId: selectedDevice,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                frequency: document.getElementById('frequency').value,
                timeOfDay: timeOfDay
            });
            
            const res = await fetch('?' + params);
            const data = await res.json();
            
            historyData = data.history;
            waypoints = data.waypoints;
            
            if (historyData.length < 2) {
                alert('No hay suficientes datos para este período');
                return;
            }
            
            // Dibujar ruta
            drawRoute();
            
            // Mostrar estadísticas
            showStats(data.stats);
            
            // Mostrar waypoints
            showWaypoints();
            
            // Iniciar simulación
            initSimulation();
            
            document.getElementById('legend').style.display = 'block';
        }
        
        // Dibujar ruta en el mapa
        function drawRoute() {
            const coordinates = historyData.map(p => [p.longitude, p.latitude]);
            
            // Ruta original (línea punteada morada)
            map.addSource('original-route', {
                type: 'geojson',
                data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }
            });
            
            map.addLayer({
                id: 'original-route',
                type: 'line',
                source: 'original-route',
                paint: { 'line-color': '#8b5cf6', 'line-width': 4, 'line-opacity': 0.6, 'line-dasharray': [2, 2] }
            });
            
            // Marcador inicio (A)
            const start = historyData[0];
            const startEl = document.createElement('div');
            startEl.innerHTML = `<div style="width: 32px; height: 32px; background: #22c55e; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;
                font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 3px solid white;">A</div>`;
            
            const startMarker = new mapboxgl.Marker({ element: startEl })
                .setLngLat([start.longitude, start.latitude])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <p style="font-weight: bold; color: #22c55e;">INICIO</p>
                    <p>Hora: ${new Date(start.deviceTime).toLocaleString()}</p>
                    <p>Velocidad: ${start.speed} km/h</p>
                `))
                .addTo(map);
            historyMarkers.push(startMarker);
            
            // Marcador fin (B)
            const end = historyData[historyData.length - 1];
            const endEl = document.createElement('div');
            endEl.innerHTML = `<div style="width: 32px; height: 32px; background: #ef4444; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;
                font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 3px solid white;">B</div>`;
            
            const endMarker = new mapboxgl.Marker({ element: endEl })
                .setLngLat([end.longitude, end.latitude])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <p style="font-weight: bold; color: #ef4444;">FIN</p>
                    <p>Hora: ${new Date(end.deviceTime).toLocaleString()}</p>
                    <p>Velocidad: ${end.speed} km/h</p>
                `))
                .addTo(map);
            historyMarkers.push(endMarker);
            
            // Ajustar vista al recorrido
            const bounds = new mapboxgl.LngLatBounds();
            historyData.forEach(p => bounds.extend([p.longitude, p.latitude]));
            map.fitBounds(bounds, { padding: 50 });
        }
        
        // Mostrar estadísticas
        function showStats(stats) {
            if (!stats) return;
            
            document.getElementById('statsContainer').innerHTML = `
                <div class="stats-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 13px; color: #475569;">Resumen del Viaje</strong>
                        <span style="font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
                            ${stats.pointCount} puntos
                        </span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-icon blue">🕐</div>
                            <div><div class="stat-label">Duración</div><div class="stat-value">${stats.duration}</div></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon green">📍</div>
                            <div><div class="stat-label">Distancia</div><div class="stat-value">${stats.distance} km</div></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon orange">⚡</div>
                            <div><div class="stat-label">Vel. Prom.</div><div class="stat-value">${stats.avgSpeed} km/h</div></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon red">⏹</div>
                            <div><div class="stat-label">Paradas</div><div class="stat-value">${stats.stopCount}</div></div>
                        </div>
                    </div>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px;">
                        <span>🟢 Inicio: ${stats.startTime}</span>
                        <span>🔴 Fin: ${stats.endTime}</span>
                    </div>
                    <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 4px;">
                        Vel. máxima: <strong>${stats.maxSpeed} km/h</strong>
                    </div>
                </div>
            `;
            document.getElementById('statsContainer').style.display = 'block';
        }
        
        // Mostrar waypoints
        function showWaypoints() {
            const typeLabels = { start: 'Inicio', stop: 'Parada', end: 'Fin' };
            
            let html = '<div class="waypoints"><strong style="font-size: 12px; display: block; margin-bottom: 8px;">📍 Puntos de Llegada</strong>';
            
            waypoints.forEach(wp => {
                const time = new Date(wp.point.deviceTime).toLocaleTimeString();
                html += `
                    <div class="waypoint" onclick="goToWaypoint(${wp.index})">
                        <div class="waypoint-dot ${wp.type}"></div>
                        <div class="waypoint-info">
                            <span class="waypoint-type ${wp.type}">${typeLabels[wp.type]}</span>
                            <span class="waypoint-time">🕐 ${time}</span>
                            <div class="waypoint-address">${wp.point.address || `${wp.point.latitude.toFixed(5)}, ${wp.point.longitude.toFixed(5)}`}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            document.getElementById('waypointsContainer').innerHTML = html;
            document.getElementById('waypointsContainer').style.display = 'block';
        }
        
        // Ir a waypoint
        function goToWaypoint(index) {
            const point = historyData[index];
            map.flyTo({ center: [point.longitude, point.latitude], zoom: 16 });
            simIndex = index;
            updateSimUI();
            updateSimTrail();
        }
        
        // ==================== SIMULACIÓN ====================
        
        function initSimulation() {
            simIndex = 0;
            simPlaying = false;
            simSpeed = 1;
            simTrailCoords = [];
            
            // Actualizar UI
            document.getElementById('simStartTime').textContent = new Date(historyData[0].deviceTime).toLocaleTimeString().slice(0, 5);
            document.getElementById('simEndTime').textContent = new Date(historyData[historyData.length - 1].deviceTime).toLocaleTimeString().slice(0, 5);
            document.getElementById('simSlider').max = historyData.length - 1;
            
            document.getElementById('simulationPanel').classList.add('active');
            
            // Crear marcador de simulación
            const el = document.createElement('div');
            el.innerHTML = `<div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f97316, #ea580c);
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 12px rgba(249, 115, 22, 0.5); border: 4px solid white;">
                <span style="font-size: 24px;">🚗</span>
            </div>`;
            
            simMarker = new mapboxgl.Marker({ element: el })
                .setLngLat([historyData[0].longitude, historyData[0].latitude])
                .addTo(map);
            
            updateSimUI();
            
            // Auto-iniciar simulación
            setTimeout(() => simPlay(), 500);
        }
        
        function updateSimUI() {
            const point = historyData[simIndex];
            document.getElementById('simPoint').textContent = `${simIndex + 1} / ${historyData.length}`;
            document.getElementById('simTime').textContent = new Date(point.deviceTime).toLocaleTimeString();
            document.getElementById('simSpeed').textContent = `${point.speed} km/h`;
            document.getElementById('simSlider').value = simIndex;
            
            if (simMarker) {
                simMarker.setLngLat([point.longitude, point.latitude]);
                map.easeTo({ center: [point.longitude, point.latitude], duration: 300 });
            }
        }
        
        function updateSimTrail() {
            simTrailCoords = historyData.slice(0, simIndex + 1).map(p => [p.longitude, p.latitude]);
            
            if (map.getSource('simulation-trail')) {
                map.getSource('simulation-trail').setData({
                    type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: simTrailCoords }
                });
            } else if (simTrailCoords.length > 1) {
                map.addSource('simulation-trail', {
                    type: 'geojson',
                    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: simTrailCoords } }
                });
                map.addLayer({
                    id: 'simulation-trail',
                    type: 'line',
                    source: 'simulation-trail',
                    paint: { 'line-color': '#f97316', 'line-width': 5, 'line-opacity': 0.9 }
                });
            }
        }
        
        function simPlay() {
            simPlaying = true;
            document.getElementById('simPlayBtn').textContent = '⏸';
            document.getElementById('simDot').classList.add('playing');
            
            simInterval = setInterval(() => {
                if (simIndex < historyData.length - 1) {
                    simIndex++;
                    updateSimUI();
                    updateSimTrail();
                } else {
                    simStop();
                }
            }, 1000 / simSpeed);
        }
        
        function simStop() {
            simPlaying = false;
            if (simInterval) clearInterval(simInterval);
            document.getElementById('simPlayBtn').textContent = '▶️';
            document.getElementById('simDot').classList.remove('playing');
        }
        
        function simTogglePlay() {
            if (simPlaying) simStop();
            else simPlay();
        }
        
        function simRewind() {
            simIndex = Math.max(0, simIndex - 5);
            updateSimUI();
            updateSimTrail();
        }
        
        function simForward() {
            simIndex = Math.min(historyData.length - 1, simIndex + 5);
            updateSimUI();
            updateSimTrail();
        }
        
        function simReset() {
            simStop();
            simIndex = 0;
            simTrailCoords = [];
            if (map.getLayer('simulation-trail')) map.removeLayer('simulation-trail');
            if (map.getSource('simulation-trail')) map.removeSource('simulation-trail');
            updateSimUI();
        }
        
        function simCycleSpeed() {
            simSpeed = simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1;
            document.getElementById('speedBadge').textContent = simSpeed + 'x';
            document.getElementById('simSpeedBtn').textContent = simSpeed + 'x';
            
            if (simPlaying) {
                simStop();
                simPlay();
            }
        }
        
        function onSimSlider() {
            simIndex = parseInt(document.getElementById('simSlider').value);
            updateSimUI();
            updateSimTrail();
        }
        
        // Inicializar
        document.addEventListener('DOMContentLoaded', () => {
            // Fechas por defecto
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            document.getElementById('endDate').value = today.toISOString().split('T')[0];
            document.getElementById('startDate').value = yesterday.toISOString().split('T')[0];
            
            initMap();
            
            // Auto-refresh cada 30 segundos en modo live
            setInterval(() => {
                if (mode === 'live') refreshDevices();
            }, 30000);
        });
    </script>
</body>
</html>
