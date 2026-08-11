<?php
/**
 * ============================================================
 *  MAPA GPS - SRC  |  100% Supabase (sin Traccar)
 *  Archivo único para cPanel / Hostgator.  Requiere PHP 7.4+ con cURL.
 *
 *  Funciones:
 *   - Mapa en vivo con auto-refresco
 *   - Historial por vehículo y rango de fechas (hora local RD)
 *   - Ruta ajustada a calles reales (OSRM público, sin API key)
 *   - Velocidad por punto, máxima, promedio, distancia y duración
 *   - Alertas por exceso de velocidad
 *   - Animación del recorrido (play / pausa / velocidad)
 * ============================================================
 */

date_default_timezone_set('America/Santo_Domingo');
const TZ_OFFSET = '-04:00';

// ====== CONFIGURACIÓN ======
$SUPABASE_URL = 'https://tzfuszsoqgyvzxvqeqeb.supabase.co';
// Usa la ANON key si tus tablas tienen políticas de lectura públicas,
// o la SERVICE_ROLE key si NO las tienen (este archivo corre en el servidor).
$SUPABASE_KEY = 'PEGA_AQUI_TU_KEY';

$SPEED_LIMIT_DEFAULT = 70;              // km/h
$SPEED_LIMITS = [ /* 195 => 60, */ ];   // límites por device_id

// La columna speed de Traccar viene en NUDOS -> km/h
const KNOTS_TO_KMH = 1.852;

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

// ====== RUTA REAL POR CALLES (OSRM público, sin key) ======
function snapToRoads($points) {
    if (count($points) < 2) return [];
    // OSRM acepta máx ~100 coordenadas cómodamente
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
        $out = [];
        foreach ($devices as $d) {
            $pos = sb('traccar_positions', [
                'select'    => 'latitude,longitude,speed,address,device_time',
                'device_id' => 'eq.' . $d['id'],
                'order'     => 'device_time.desc',
                'limit'     => 1,
            ]);
            $p = $pos[0] ?? null;
            $last = $d['last_update'] ?? ($p['device_time'] ?? null);
            $out[] = [
                'id'      => (int)$d['id'],
                'name'    => $d['name'],
                'lat'     => $p ? (float)$p['latitude'] : null,
                'lon'     => $p ? (float)$p['longitude'] : null,
                'speed'   => $p ? round((float)$p['speed'] * KNOTS_TO_KMH, 1) : 0,
                'address' => $p['address'] ?? '',
                'time'    => $last,
                'online'  => $last ? ((time() - strtotime($last)) < 600) : false,
                'limit'   => limitFor((int)$d['id']),
            ];
        }
        echo json_encode($out);
        exit;
    }

    if ($_GET['api'] === 'history') {
        $deviceId = (int)($_GET['device'] ?? 0);
        $from     = $_GET['from'] ?? date('Y-m-d');
        $to       = $_GET['to']   ?? date('Y-m-d');
        $freq     = max(0, (int)($_GET['freq'] ?? 60)); // segundos entre puntos

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

        // Estadísticas
        $limit = limitFor($deviceId);
        $dist = 0; $max = 0; $sum = 0; $alerts = [];
        for ($i = 0; $i < count($points); $i++) {
            if ($i > 0) $dist += haversine(
                $points[$i-1]['lat'], $points[$i-1]['lon'],
                $points[$i]['lat'],  $points[$i]['lon']
            );
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
                'limit'    => $limit,
                'alerts'   => count($alerts),
            ],
            'alerts' => array_slice($alerts, 0, 100),
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
  :root{--bg:#0f172a;--panel:#111c33;--line:#22304d;--txt:#e6edf7;--muted:#8ea3c4;--acc:#f97316;--ok:#22c55e;--bad:#ef4444}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--txt)}
  header{padding:12px 16px;background:var(--panel);border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  header h1{font-size:16px;margin:0;font-weight:700}
  .wrap{display:flex;height:calc(100vh - 57px);flex-wrap:wrap}
  aside{width:320px;background:var(--panel);border-right:1px solid var(--line);padding:14px;overflow:auto}
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
  .dev{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:6px 0;border-bottom:1px solid var(--line);cursor:pointer}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px}
  .anim{display:flex;gap:6px;margin-top:10px}
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
  </div>
</aside>
<div id="map"></div>
</div>

<script>
const map = L.map('map').setView([18.4861, -69.9312], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);

let mode='live', liveTimer=null, layers=[], points=[], anim=null, idx=0, spd=1, carMarker=null, trail=null;

const clear=()=>{layers.forEach(l=>map.removeLayer(l));layers=[];carMarker=null;trail=null;};
const add=l=>{layers.push(l.addTo(map));return l;};
setInterval(()=>document.getElementById('clock').textContent=new Date().toLocaleString('es-DO'),1000);

function setMode(m){
  mode=m;
  document.getElementById('tabLive').classList.toggle('on',m==='live');
  document.getElementById('tabHist').classList.toggle('on',m==='history');
  document.getElementById('paneLive').style.display=m==='live'?'':'none';
  document.getElementById('paneHist').style.display=m==='history'?'':'none';
  clear(); stopAnim();
  if(liveTimer){clearInterval(liveTimer);liveTimer=null;}
  if(m==='live'){loadLive();liveTimer=setInterval(loadLive,30000);}
}

function pin(color,label){
  return L.divIcon({html:`<div style="background:${color};width:30px;height:30px;border-radius:50%;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700">${label}</div>`,
    className:'',iconSize:[30,30],iconAnchor:[15,15]});
}

async function loadLive(){
  const r = await fetch('?api=live'); const d = await r.json();
  clear();
  const box=[]; let html='';
  d.forEach(v=>{
    const on=v.online, col=on?'#22c55e':'#94a3b8';
    html+=`<div class="dev" onclick="focusDev(${v.lat},${v.lon})">
      <span><span class="dot" style="background:${col}"></span>${v.name}</span>
      <b style="color:${v.speed>v.limit?'#ef4444':'#f97316'}">${v.speed} km/h</b></div>`;
    if(v.lat&&v.lon){
      box.push([v.lat,v.lon]);
      add(L.marker([v.lat,v.lon],{icon:pin(col,'🚗')}).bindPopup(
        `<b>${v.name}</b><br>Velocidad: ${v.speed} km/h<br>${v.time?new Date(v.time).toLocaleString('es-DO'):''}<br>${v.address||''}`));
    }
  });
  document.getElementById('deviceList').innerHTML = html || 'Sin dispositivos';
  if(box.length) map.fitBounds(box,{padding:[50,50],maxZoom:15});
}
const focusDev=(la,lo)=>{ if(la) map.setView([la,lo],16); };

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

  // Ruta real por calles
  if(d.road&&d.road.length) add(L.polyline(d.road.map(c=>[c[1],c[0]]),{color:'#2563eb',weight:6,opacity:.85}));
  // Trazo GPS crudo
  add(L.polyline(points.map(p=>[p.lat,p.lon]),{color:'#f97316',weight:2,opacity:.5,dashArray:'5,6'}));

  const s=points[0], e=points[points.length-1];
  add(L.marker([s.lat,s.lon],{icon:pin('#22c55e','A')}).bindPopup('<b>Inicio</b><br>'+s.time));
  add(L.marker([e.lat,e.lon],{icon:pin('#ef4444','B')}).bindPopup('<b>Fin</b><br>'+e.time));

  (d.alerts||[]).forEach(a=>add(L.circleMarker([a.lat,a.lon],
    {radius:6,color:'#ef4444',fillColor:'#ef4444',fillOpacity:.8})
    .bindPopup(`<b>Exceso de velocidad</b><br>${a.speed} km/h<br>${a.time}`)));

  map.fitBounds(points.map(p=>[p.lat,p.lon]),{padding:[50,50]});

  const st=d.stats;
  document.getElementById('stats').innerHTML=`
    <div class="stat"><span>Puntos</span><b>${st.total}</b></div>
    <div class="stat"><span>Distancia</span><b>${st.km} km</b></div>
    <div class="stat"><span>Duración</span><b>${st.minutes} min</b></div>
    <div class="stat"><span>Vel. promedio</span><b>${st.avgSpeed} km/h</b></div>
    <div class="stat"><span>Vel. máxima</span><b>${st.maxSpeed} km/h</b></div>
    <div class="stat"><span>Límite</span><b>${st.limit} km/h</b></div>
    <div class="stat"><span>Excesos</span><b style="color:${st.alerts?'#ef4444':'#22c55e'}">${st.alerts}</b></div>`;

  const al=document.getElementById('alerts');
  if((d.alerts||[]).length){
    al.style.display='';
    al.innerHTML='<b style="font-size:13px">⚠️ Excesos de velocidad</b>'+
      d.alerts.slice(0,15).map(a=>`<div class="alert">${a.time} — <b>${a.speed} km/h</b></div>`).join('');
  } else al.style.display='none';
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
