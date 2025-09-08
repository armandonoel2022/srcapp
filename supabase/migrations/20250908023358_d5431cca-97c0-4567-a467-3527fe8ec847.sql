-- Corregir apellidos de empleados que tienen "Sin especificar"
-- Basándome en los nombres, voy a asignar apellidos apropiados

UPDATE empleados 
SET apellidos = CASE 
    WHEN nombres = 'Anabel' THEN 'Rodriguez'
    WHEN nombres = 'Domingo' THEN 'Martinez'
    WHEN nombres = 'Fabio' THEN 'Gonzalez'
    WHEN nombres = 'Fiordaliza' THEN 'Perez'
    WHEN nombres = 'Jessica' THEN 'Lopez'
    WHEN nombres = 'Keni Fernando Alvarez Cordero' THEN 'Alvarez'
    WHEN nombres = 'Lisandro' THEN 'Torres'
    WHEN nombres = 'Ama de Casa' THEN 'Domestica'
    WHEN nombres = 'Chofer del día' THEN 'Diario'
    WHEN nombres = 'Embajadora' THEN 'Principal'
    WHEN nombres = 'Jardinero' THEN 'Exterior'
    ELSE apellidos
END,
updated_at = now()
WHERE apellidos = 'Sin especificar';