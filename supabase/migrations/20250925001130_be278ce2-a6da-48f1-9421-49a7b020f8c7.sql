-- Actualizar las coordenadas de la Oficina Principal SRC con las coordenadas correctas
UPDATE ubicaciones_trabajo 
SET coordenadas = POINT(18.459333, -69.946583),
    direccion = 'F4RX+MG9, C. Club de Leones, Santo Domingo 11504'
WHERE nombre = 'OFICINA SRC SEGURIDAD';