<?php
/**
 * ============================================================
 *  MAPA GPS - SRC  |  100% Supabase (sin Traccar)
 *  Archivo único para cPanel / Hostgator. Requiere PHP 7.4+ con cURL.
 *
 *  EN VIVO:
 *   - Estela (trail) del recorrido reciente de cada vehículo
 *   - Flecha de dirección (rumbo) y velocidad
 *   - Resumen: Total / En movimiento / Ralentí / Detenido / Sin señal
 *   - Seguimiento automático de un vehículo
 *  HISTORIAL:
 *   - Ruta ajustada a calles (OSRM), estadísticas, alertas y animación
 * ============================================================
 */

date_default_timezone_set('America/Santo_Domingo');
const TZ_OFFSET = '-04:00';

// ====== CONFIGURACIÓN ======
$SUPABASE_URL = 'https://tzfuszsoqgyvzxvqeqeb.supabase.co';
// ANON key si hay políticas de lectura públicas, o SERVICE_ROLE si no.
$SUPABASE_KEY = 'PEGA_AQUI_TU_KEY';

$SPEED_LIMIT_DEFAULT = 70;              // km/h
$SPEED_LIMITS = [ /* 195 => 60, */ ];   // límites por device_id

const KNOTS_TO_KMH = 1.852;   // Traccar entrega velocidad en nudos
const TRAIL_MINUTES = 120;    // minutos de estela en vivo
const TRAIL_POINTS  = 60;     // máx puntos de estela por vehículo
const MOVING_KMH    = 5;      // > = en movimiento
const OFFLINE_SECS  = 600;    // sin reporte => sin señal
const IDLE_SECS     = 300;    // detenido reciente => ralentí

// ====== CLIENTE SUPABASE ======
function sb($table, $params = []) {
    global $SUPABASE_URL, $SUPABASE_KEY;
    $url = rtrim($SUPABASE_URL, '/') . '/rest/v1/' . $table;
    if ($params) $url .= '?' . http_build_query($params);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $SUPABASE_KEY,
            'Authorization: Bearer ' . $SUPABASE_KEY,
            'Accept: application/json',
        ],
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 400 || $res === false) return [];
    $json = json_decode($res, true);
    return is_array($json) ? $json : [];
}

function limitFor($deviceId) {
    global $SPEED_LIMITS, $SPEED_LIMIT_DEFAULT;
    return $SPEED_LIMITS[$deviceId] ?? $SPEED_LIMIT_DEFAULT;
}

function haversine($lat1, $lon1, $lat2, $lon2) {
    $R = 6371; // km
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat/2)**2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2)**2;
    return $R * 2 * atan2(sqrt($a), sqrt(1-$a));
}

// Rumbo (0-360) entre dos puntos
function bearing($lat1, $lon1, $lat2, $lon2) {
    $y = sin(deg2rad($lon2-$lon1)) * cos(deg2rad($lat2));
    $x = cos(deg2rad($lat1))*sin(deg2rad($lat2)) -
         sin(deg2rad($lat1))*cos(deg2rad($lat2))*cos(deg2rad($lon2-$lon1));
    return fmod(rad2deg(atan2($y, $x)) + 360, 360);
}

// ====== RUTA REAL POR CALLES (OSRM público, sin key) ======
function snapToRoads($points) {
    if (count($points) < 2) return [];
    $key = $points;
    if (count($points) > 90) {
        $key = [];
        $step = (count($points) - 1) / 89;
        for ($i = 0; $i < 90; $i++) $key[] = $points[(int)round($i * $step)];
    }
    $coords = [];
    foreach ($key as $p) $coords[] = $p['lon'] . ',' . $p['lat'];
    $url = 'https://router.project-osrm.org/route/v1/driving/' . implode(';', $coords)
         . '?overview=full&geometries=geojson';
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25]);
    $res = curl_exec($ch);
    curl_close($ch);
    $j = json_decode($res, true);
    return $j['routes'][0]['geometry']['coordinates'] ?? [];
}

// ====== API INTERNA (AJAX) ======
if (isset($_GET['api'])) {
    header('Content-Type: application/json; charset=utf-8');

    if ($_GET['api'] === 'live') {
        $devices = sb('traccar_devices', ['select' => '*', 'order' => 'name.asc']);
        $desde = date('Y-m-d\TH:i:s', time() - TRAIL_MINUTES * 60) . TZ_OFFSET;
        $out = [];
        foreach ($devices as $d) {
            // Últimas posiciones para armar la estela
            $rows = sb('traccar_positions', [
                'select'      => 'latitude,longitude,speed,address,device_time,data',
                'device_id'   => 'eq.' . $d['id'],
                'device_time' => 'gte.' . $desde,
                'order'       => 'device_time.desc',
                'limit'       => 300,
            ]);
            if (!$rows) {
                $rows = sb('traccar_positions', [
                    'select'    => 'latitude,longitude,speed,address,device_time,data',
                    'device_id' => 'eq.' . $d['id'],
                    'order'     => 'device_time.desc',
                    'limit'     => 1,
                ]);
            }
            $rows = array_reverse($rows); // cronológico
            $rows = array_values(array_filter($rows, fn($r) => $r['latitude'] !== null && $r['longitude'] !== null));

            // Reducir a TRAIL_POINTS
            if (count($rows) > TRAIL_POINTS) {
                $sel = []; $step = (count($rows) - 1) / (TRAIL_POINTS - 1);
                for ($i = 0; $i < TRAIL_POINTS; $i++) $sel[] = $rows[(int)round($i * $step)];
                $rows = $sel;
            }

            $trail = []; $kmTrail = 0; $maxTrail = 0;
            foreach ($rows as $i => $r) {
                $lat = (float)$r['latitude']; $lon = (float)$r['longitude'];
                $sp  = round((float)$r['speed'] * KNOTS_TO_KMH, 1);
                if ($i > 0) $kmTrail += haversine($trail[$i-1]['lat'], $trail[$i-1]['lon'], $lat, $lon);
                if ($sp > $maxTrail) $maxTrail = $sp;
                $trail[] = ['lat'=>$lat,'lon'=>$lon,'speed'=>$sp,
                            'time'=>date('Y-m-d H:i:s', strtotime($r['device_time']))];
            }

            $p    = $rows ? end($rows) : null;
            $prev = count($rows) > 1 ? $rows[count($rows)-2] : null;
            $last = $p['device_time'] ?? ($d['last_update'] ?? null);
            $age  = $last ? (time() - strtotime($last)) : null;
            $speed = $p ? round((float)$p['speed'] * KNOTS_TO_KMH, 1) : 0;

            // Rumbo: del campo data.course o calculado
            $course = null;
            if ($p && !empty($p['data'])) {
                $dat = is_array($p['data']) ? $p['data'] : json_decode($p['data'], true);
                if (isset($dat['course'])) $course = (float)$dat['course'];
            }
            if ($course === null && $p && $prev) {
                $course = bearing((float)$prev['latitude'], (float)$prev['longitude'],
                                  (float)$p['latitude'], (float)$p['longitude']);
            }

            // Estado
            if ($age === null || $age > OFFLINE_SECS)      $estado = 'sin_senal';
            elseif ($speed >= MOVING_KMH)                  $estado = 'movimiento';
            elseif ($age <= IDLE_SECS)                     $estado = 'ralenti';
            else                                           $estado = 'detenido';

            $out[] = [
                'id'      => (int)$d['id'],
                'name'    => $d['name'],
                'lat'     => $p ? (float)$p['latitude'] : null,
                'lon'     => $p ? (float)$p['longitude'] : null,
                'speed'   => $speed,
                'course'  => $course === null ? 0 : round($course),
                'address' => $p['address'] ?? '',
                'time'    => $last,
                'age'     => $age,
                'estado'  => $estado,
                'online'  => $estado !== 'sin_senal',
                'limit'   => limitFor((int)$d['id']),
                'trail'   => $trail,
                'trailKm' => round($kmTrail, 2),
                'trailMax'=> $maxTrail,
            ];
        }
        echo json_encode($out);
        exit;
    }

    if ($_GET['api'] === 'history') {
        $deviceId = (int)($_GET['device'] ?? 0);
        $from     = $_GET['from'] ?? date('Y-m-d');
        $to       = $_GET['to']   ?? date('Y-m-d');
        $freq     = max(0, (int)($_GET['freq'] ?? 60));

        $rows = sb('traccar_positions', [
            'select'    => 'id,latitude,longitude,speed,address,device_time',
            'device_id' => 'eq.' . $deviceId,
            'and'       => '(device_time.gte.' . $from . 'T00:00:00' . TZ_OFFSET
                         . ',device_time.lte.' . $to . 'T23:59:59' . TZ_OFFSET . ')',
            'order'     => 'device_time.asc',
            'limit'     => 5000,
        ]);

        $points = []; $lastT = 0;
        foreach ($rows as $r) {
            if ($r['latitude'] === null || $r['longitude'] === null) continue;
            $t = strtotime($r['device_time']);
            if ($t - $lastT < $freq) continue;
            $lastT = $t;
            $points[] = [
                'lat'     => (float)$r['latitude'],
                'lon'     => (float)$r['longitude'],
                'speed'   => round((float)$r['speed'] * KNOTS_TO_KMH, 1),
                'time'    => date('Y-m-d H:i:s', $t),
                'address' => $r['address'] ?? '',
            ];
        }

        $limit = limitFor($deviceId);
        $dist = 0; $max = 0; $sum = 0; $alerts = []; $paradas = []; $movSecs = 0;
        for ($i = 0; $i < count($points); $i++) {
            if ($i > 0) {
                $dist += haversine($points[$i-1]['lat'], $points[$i-1]['lon'],
                                   $points[$i]['lat'],  $points[$i]['lon']);
                $dt = strtotime($points[$i]['time']) - strtotime($points[$i-1]['time']);
                if ($points[$i]['speed'] >= MOVING_KMH) $movSecs += $dt;
                elseif ($dt >= 300) $paradas[] = ['lat'=>$points[$i-1]['lat'],'lon'=>$points[$i-1]['lon'],
                                                  'desde'=>$points[$i-1]['time'],'minutos'=>round($dt/60)];
            }
            $s = $points[$i]['speed'];
            $sum += $s;
            if ($s > $max) $max = $s;
            if ($s > $limit) $alerts[] = $points[$i];
        }
        $n = max(1, count($points));
        $dur = count($points) > 1
            ? strtotime(end($points)['time']) - strtotime($points[0]['time']) : 0;

        echo json_encode([
            'points' => $points,
            'road'   => snapToRoads($points),
            'stats'  => [
                'total'    => count($points),
                'km'       => round($dist, 2),
                'maxSpeed' => $max,
                'avgSpeed' => round($sum / $n, 1),
                'minutes'  => round($dur / 60),
                'movMin'   => round($movSecs / 60),
                'stopMin'  => round(max(0, $dur - $movSecs) / 60),
                'limit'    => $limit,
                'alerts'   => count($alerts),
                'paradas'  => count($paradas),
            ],
            'alerts'  => array_slice($alerts, 0, 100),
            'paradas' => array_slice($paradas, 0, 50),
        ]);
        exit;
    }
}

// ====== DATOS INICIALES ======
$devices  = sb('traccar_devices', ['select' => 'id,name', 'order' => 'name.asc']);
$hoy      = date('Y-m-d');
$selected = (int)($_GET['device'] ?? ($devices[0]['id'] ?? 0));
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mapa GPS - SRC</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  :root{--bg:#0f172a;--panel:#111c33;--line:#22304d;--txt:#e6edf7;--muted:#8ea3c4;--acc:#f97316;--ok:#22c55e;--bad:#ef4444;--warn:#eab308}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--txt)}
  header{padding:12px 16px;background:var(--panel);border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  header h1{font-size:16px;margin:0;font-weight:700}
  .wrap{display:flex;height:calc(100vh - 57px);flex-wrap:wrap}
  aside{width:340px;background:var(--panel);border-right:1px solid var(--line);padding:14px;overflow:auto}
  #map{flex:1;min-width:280px;min-height:60vh}
  label{display:block;font-size:12px;color:var(--muted);margin:10px 0 4px}
  select,input,button{width:100%;padding:9px;border-radius:8px;border:1px solid var(--line);background:#0c1729;color:var(--txt);font-size:14px}
  button{cursor:pointer;font-weight:600}
  .btn-acc{background:var(--acc);border-color:var(--acc);color:#fff;margin-top:12px}
  .tabs{display:flex;gap:8px;margin-bottom:8px}
  .tabs button{background:#0c1729}
  .tabs button.on{background:var(--acc);border-color:var(--acc);color:#fff}
  .row{display:flex;gap:8px}
  .card{background:#0c1729;border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:12px}
  .stat{display:flex;justify-content:space-between;font-size:13px;padding:3px 0}
  .stat b{color:var(--acc)}
  .alert{font-size:12px;border-left:3px solid var(--bad);padding:4px 8px;margin:6px 0;background:rgba(239,68,68,.1)}
  .stop{font-size:12px;border-left:3px solid var(--warn);padding:4px 8px;margin:6px 0;background:rgba(234,179,8,.1)}
  .dev{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;padding:7px 0;border-bottom:1px solid var(--line);cursor:pointer}
  .dev:hover{background:rgba(249,115,22,.08)}
  .dev.sel{background:rgba(249,115,22,.15)}
  .dev small{display:block;color:var(--muted);font-size:11px}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px}
  .sum{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .sum div{background:#0c1729;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:12px;color:var(--muted)}
  .sum b{display:block;font-size:18px;color:var(--txt)}
  .anim{display:flex;gap:6px;margin-top:10px}
  .chk{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-top:8px}
  .chk input{width:auto}
  @media(max-width:820px){aside{width:100%;border-right:none}.wrap{height:auto}}
</style>
</head>
<body>
<header>
  <h1>🛰️ Mapa GPS — Seguridad Residencial y Comercial S.R.L.</h1>
  <span id="clock" style="margin-left:auto;font-size:12px;color:var(--muted)"></span>
</header>

<div class="wrap">
<aside>
  <div class="tabs">
    <button id="tabLive" class="on" onclick="setMode('live')">En vivo</button>
    <button id="tabHist" onclick="setMode('history')">Historial</button>
  </div>

  <div id="paneLive">
    <div class="sum" id="summary"></div>
    <label>Filtrar</label>
    <select id="filtro" onchange="renderLive()">
      <option value="todos">Todos</option>
      <option value="movimiento">En movimiento</option>
      <option value="ralenti">Ralentí</option>
      <option value="detenido">Detenido</option>
      <option value="sin_senal">Sin señal</option>
    </select>
    <div class="chk"><input type="checkbox" id="verEstela" checked onchange="renderLive()"><label for="verEstela" style="margin:0">Mostrar estela de recorrido (últimas 2 h)</label></div>
    <div class="chk"><input type="checkbox" id="seguir"><label for="seguir" style="margin:0">Seguir vehículo seleccionado</label></div>
    <div class="card" id="deviceList">Cargando…</div>
  </div>

  <div id="paneHist" style="display:none">
    <label>Vehículo</label>
    <select id="device">
      <?php foreach ($devices as $d): ?>
        <option value="<?= (int)$d['id'] ?>" <?= $selected == $d['id'] ? 'selected' : '' ?>>
          <?= htmlspecialchars($d['name']) ?>
        </option>
      <?php endforeach; ?>
    </select>

    <div class="row">
      <div style="flex:1"><label>Fecha inicio</label><input type="date" id="from" value="<?= $hoy ?>" max="<?= $hoy ?>"></div>
      <div style="flex:1"><label>Fecha fin</label><input type="date" id="to" value="<?= $hoy ?>" max="<?= $hoy ?>"></div>
    </div>

    <label>Frecuencia de puntos</label>
    <select id="freq">
      <option value="30">Cada 30 segundos</option>
      <option value="60" selected>Cada 1 minuto</option>
      <option value="300">Cada 5 minutos</option>
      <option value="900">Cada 15 minutos</option>
    </select>

    <button class="btn-acc" onclick="loadHistory()">Ver recorrido</button>

    <div class="anim">
      <button onclick="playPause()" id="playBtn">▶ Reproducir</button>
      <button onclick="resetAnim()" style="max-width:80px">⟲</button>
      <button onclick="cycleSpeed()" id="spdBtn" style="max-width:70px">1x</button>
    </div>

    <div class="card" id="stats" style="display:none"></div>
    <div class="card" id="alerts" style="display:none"></div>
    <div class="card" id="stops" style="display:none"></div>
  </div>
</aside>
<div id="map"></div>
</div>

<script>
const map = L.map('map').setView([18.4861, -69.9312], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);

let mode='live', liveTimer=null, layers=[], liveData=[], selId=null, firstFit=true;
let points=[], anim=null, idx=0, spd=1, carMarker=null, trail=null;

const clear=()=>{layers.forEach(l=>map.removeLayer(l));layers=[];carMarker=null;trail=null;};
const add=l=>{layers.push(l.addTo(map));return l;};
setInterval(()=>document.getElementById('clock').textContent=new Date().toLocaleString('es-DO'),1000);

const COLORES={movimiento:'#22c55e',ralenti:'#eab308',detenido:'#ef4444',sin_senal:'#94a3b8'};
const ETIQ={movimiento:'En movimiento',ralenti:'Ralentí',detenido:'Detenido',sin_senal:'Sin señal'};

function setMode(m){
  mode=m;
  document.getElementById('tabLive').classList.toggle('on',m==='live');
  document.getElementById('tabHist').classList.toggle('on',m==='history');
  document.getElementById('paneLive').style.display=m==='live'?'':'none';
  document.getElementById('paneHist').style.display=m==='history'?'':'none';
  clear(); stopAnim(); firstFit=true;
  if(liveTimer){clearInterval(liveTimer);liveTimer=null;}
  if(m==='live'){loadLive();liveTimer=setInterval(loadLive,20000);}
}

function pin(color,label){
  return L.divIcon({html:`<div style="background:${color};width:30px;height:30px;border-radius:50%;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700">${label}</div>`,
    className:'',iconSize:[30,30],iconAnchor:[15,15]});
}
// Marcador tipo flecha que apunta según el rumbo
function arrowIcon(color,deg,name){
  return L.divIcon({html:`<div style="transform:rotate(${deg}deg);width:34px;height:34px;display:flex;align-items:center;justify-content:center">
      <div style="width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-bottom:26px solid ${color};filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))"></div>
    </div>
    <div style="position:absolute;top:34px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:700;color:#fff;background:rgba(15,23,42,.85);padding:1px 5px;border-radius:4px">${name}</div>`,
    className:'',iconSize:[34,34],iconAnchor:[17,17]});
}

async function loadLive(){
  const r = await fetch('?api=live'); liveData = await r.json();
  renderLive();
}

function renderLive(){
  clear();
  const filtro=document.getElementById('filtro').value;
  const verEstela=document.getElementById('verEstela').checked;
  const cont={movimiento:0,ralenti:0,detenido:0,sin_senal:0};
  liveData.forEach(v=>cont[v.estado]++);

  document.getElementById('summary').innerHTML=`
    <div>Total<b>${liveData.length}</b></div>
    <div>En movimiento<b style="color:${COLORES.movimiento}">${cont.movimiento}</b></div>
    <div>Ralentí<b style="color:${COLORES.ralenti}">${cont.ralenti}</b></div>
    <div>Detenido<b style="color:${COLORES.detenido}">${cont.detenido}</b></div>
    <div>Sin señal<b style="color:${COLORES.sin_senal}">${cont.sin_senal}</b></div>
    <div>Excesos<b style="color:${COLORES.detenido}">${liveData.filter(v=>v.speed>v.limit).length}</b></div>`;

  const lista = liveData.filter(v=>filtro==='todos'||v.estado===filtro);
  const box=[]; let html='';

  lista.forEach(v=>{
    const col=COLORES[v.estado];
    html+=`<div class="dev ${selId===v.id?'sel':''}" onclick="selectDev(${v.id})">
      <span><span class="dot" style="background:${col}"></span><b>${v.name}</b>
        <small>${ETIQ[v.estado]} · ${v.trailKm} km (2h) · ${v.address?v.address.substring(0,32):'sin dirección'}</small></span>
      <b style="color:${v.speed>v.limit?'#ef4444':'#f97316'};white-space:nowrap">${v.speed} km/h</b></div>`;

    if(v.lat==null) return;
    box.push([v.lat,v.lon]);

    // Estela de recorrido reciente
    if(verEstela && v.trail && v.trail.length>1){
      const latlngs=v.trail.map(p=>[p.lat,p.lon]);
      add(L.polyline(latlngs,{color:col,weight:5,opacity:.35}));
      add(L.polyline(latlngs.slice(-12),{color:col,weight:5,opacity:.9}));
      // Punto de origen del tramo
      add(L.circleMarker(latlngs[0],{radius:5,color:col,fillColor:'#0f172a',fillOpacity:1,weight:2})
        .bindPopup(`<b>${v.name}</b><br>Inicio del tramo<br>${v.trail[0].time}`));
      // Flechitas intermedias de dirección
      for(let i=6;i<latlngs.length-1;i+=10){
        const a=latlngs[i-1], b=latlngs[i];
        const ang=Math.atan2(b[1]-a[1], b[0]-a[0])*180/Math.PI;
        add(L.marker(b,{icon:L.divIcon({className:'',iconSize:[10,10],iconAnchor:[5,5],
          html:`<div style="transform:rotate(${90-ang}deg);color:${col};font-size:12px;line-height:10px">➤</div>`})}));
      }
    }

    add(L.marker([v.lat,v.lon],{icon:arrowIcon(col,v.course||0,v.name)}).bindPopup(
      `<b>${v.name}</b><br>Estado: ${ETIQ[v.estado]}<br>Velocidad: ${v.speed} km/h (límite ${v.limit})<br>
       Rumbo: ${v.course}°<br>Recorrido 2 h: ${v.trailKm} km · máx ${v.trailMax} km/h<br>
       ${v.time?new Date(v.time).toLocaleString('es-DO'):''}<br>${v.address||''}`));
  });

  document.getElementById('deviceList').innerHTML = html || 'Sin dispositivos';

  const sel = liveData.find(v=>v.id===selId);
  if(document.getElementById('seguir').checked && sel && sel.lat!=null){
    map.setView([sel.lat,sel.lon], Math.max(map.getZoom(),15));
  } else if(firstFit && box.length){
    map.fitBounds(box,{padding:[50,50],maxZoom:15}); firstFit=false;
  }
}

function selectDev(id){
  selId=id;
  const v=liveData.find(x=>x.id===id);
  renderLive();
  if(v&&v.lat!=null){
    if(v.trail&&v.trail.length>1) map.fitBounds(v.trail.map(p=>[p.lat,p.lon]),{padding:[60,60],maxZoom:16});
    else map.setView([v.lat,v.lon],16);
  }
}

async function loadHistory(){
  const dev=document.getElementById('device').value;
  const from=document.getElementById('from').value;
  const to=document.getElementById('to').value;
  const freq=document.getElementById('freq').value;
  clear(); stopAnim();
  document.getElementById('stats').style.display='';
  document.getElementById('stats').innerHTML='Cargando recorrido…';

  const r=await fetch(`?api=history&device=${dev}&from=${from}&to=${to}&freq=${freq}`);
  const d=await r.json();
  points=d.points||[];
  if(!points.length){document.getElementById('stats').innerHTML='Sin datos en ese rango.';return;}

  if(d.road&&d.road.length) add(L.polyline(d.road.map(c=>[c[1],c[0]]),{color:'#2563eb',weight:6,opacity:.85}));
  add(L.polyline(points.map(p=>[p.lat,p.lon]),{color:'#f97316',weight:2,opacity:.5,dashArray:'5,6'}));

  const s=points[0], e=points[points.length-1];
  add(L.marker([s.lat,s.lon],{icon:pin('#22c55e','A')}).bindPopup('<b>Inicio</b><br>'+s.time));
  add(L.marker([e.lat,e.lon],{icon:pin('#ef4444','B')}).bindPopup('<b>Fin</b><br>'+e.time));

  (d.alerts||[]).forEach(a=>add(L.circleMarker([a.lat,a.lon],
    {radius:6,color:'#ef4444',fillColor:'#ef4444',fillOpacity:.8})
    .bindPopup(`<b>Exceso de velocidad</b><br>${a.speed} km/h<br>${a.time}`)));

  (d.paradas||[]).forEach(p=>add(L.circleMarker([p.lat,p.lon],
    {radius:7,color:'#eab308',fillColor:'#eab308',fillOpacity:.7})
    .bindPopup(`<b>Parada</b><br>${p.minutos} min<br>desde ${p.desde}`)));

  map.fitBounds(points.map(p=>[p.lat,p.lon]),{padding:[50,50]});

  const st=d.stats;
  document.getElementById('stats').innerHTML=`
    <div class="stat"><span>Puntos</span><b>${st.total}</b></div>
    <div class="stat"><span>Distancia</span><b>${st.km} km</b></div>
    <div class="stat"><span>Duración</span><b>${st.minutes} min</b></div>
    <div class="stat"><span>En movimiento</span><b>${st.movMin} min</b></div>
    <div class="stat"><span>Detenido</span><b>${st.stopMin} min</b></div>
    <div class="stat"><span>Vel. promedio</span><b>${st.avgSpeed} km/h</b></div>
    <div class="stat"><span>Vel. máxima</span><b>${st.maxSpeed} km/h</b></div>
    <div class="stat"><span>Límite</span><b>${st.limit} km/h</b></div>
    <div class="stat"><span>Paradas</span><b>${st.paradas}</b></div>
    <div class="stat"><span>Excesos</span><b style="color:${st.alerts?'#ef4444':'#22c55e'}">${st.alerts}</b></div>`;

  const al=document.getElementById('alerts');
  if((d.alerts||[]).length){
    al.style.display='';
    al.innerHTML='<b style="font-size:13px">⚠️ Excesos de velocidad</b>'+
      d.alerts.slice(0,15).map(a=>`<div class="alert">${a.time} — <b>${a.speed} km/h</b></div>`).join('');
  } else al.style.display='none';

  const sp=document.getElementById('stops');
  if((d.paradas||[]).length){
    sp.style.display='';
    sp.innerHTML='<b style="font-size:13px">🅿️ Paradas</b>'+
      d.paradas.slice(0,15).map(p=>`<div class="stop">${p.desde} — <b>${p.minutos} min</b></div>`).join('');
  } else sp.style.display='none';
}

/* ===== Animación del recorrido ===== */
function playPause(){ anim?stopAnim():startAnim(); }
function startAnim(){
  if(points.length<2)return;
  document.getElementById('playBtn').textContent='⏸ Pausar';
  anim=setInterval(step,1000/spd);
}
function stopAnim(){ if(anim)clearInterval(anim); anim=null;
  const b=document.getElementById('playBtn'); if(b)b.textContent='▶ Reproducir'; }
function resetAnim(){ stopAnim(); idx=0;
  if(carMarker){map.removeLayer(carMarker);carMarker=null;}
  if(trail){map.removeLayer(trail);trail=null;} }
function cycleSpeed(){ spd = spd===1?2:spd===2?4:1;
  document.getElementById('spdBtn').textContent=spd+'x';
  if(anim){stopAnim();startAnim();} }
function step(){
  if(idx>=points.length){stopAnim();return;}
  const p=points[idx];
  if(!carMarker) carMarker=L.marker([p.lat,p.lon],{icon:pin('#f97316','🚙')}).addTo(map);
  else carMarker.setLatLng([p.lat,p.lon]);
  carMarker.bindPopup(`<b>${p.time}</b><br>${p.speed} km/h<br>${p.address||''}`);
  const seg=points.slice(0,idx+1).map(q=>[q.lat,q.lon]);
  if(!trail) trail=L.polyline(seg,{color:'#ef4444',weight:5}).addTo(map);
  else trail.setLatLngs(seg);
  map.panTo([p.lat,p.lon],{animate:true,duration:.3});
  idx++;
}

setMode('live');
</script>
</body>
</html>
