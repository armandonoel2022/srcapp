-- Crear ubicaciones de trabajo de ejemplo para el sistema de turnos
INSERT INTO ubicaciones_trabajo (nombre, direccion, coordenadas, radio_tolerancia, activa) VALUES 
('Oficina Principal', 'Avenida Winston Churchill, Santo Domingo', '(18.4861, -69.9312)', 100, true),
('Almacén Norte', 'Carretera Mella, Santo Domingo Norte', '(18.5204, -69.8597)', 150, true),
('Puesto Residencia Francia', 'Calle Francia, Gazcue, Santo Domingo', '(18.4700, -69.9100)', 75, true),
('Oficina Comercial', 'Avenida 27 de Febrero, Santo Domingo', '(18.4896, -69.9018)', 100, true);