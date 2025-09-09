-- Crear usuario de prueba especial para testing de geolocalización
INSERT INTO empleados_turnos (
  id,
  nombres,
  apellidos,
  funcion,
  cedula,
  username,
  password_hash,
  lugar_designado,
  sexo,
  fecha_nacimiento,
  requires_password_change,
  active,
  hora_entrada_programada,
  hora_salida_programada
) VALUES (
  gen_random_uuid(),
  'Usuario',
  'Prueba',
  'Tester',
  '00000000000',
  'uprueba',
  crypt('TEST_2025', gen_salt('bf')),
  'Oficina Principal',
  'M',
  '1990-01-01',
  false,
  true,
  '08:00:00',
  '17:00:00'
) ON CONFLICT (username) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  funcion = EXCLUDED.funcion,
  password_hash = EXCLUDED.password_hash,
  lugar_designado = EXCLUDED.lugar_designado,
  requires_password_change = EXCLUDED.requires_password_change,
  active = EXCLUDED.active;