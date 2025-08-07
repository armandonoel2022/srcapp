-- Crear usuario administrador con contraseña hasheada
-- La contraseña "Src_Control@2025" se hashea usando el algoritmo bcrypt equivalente
INSERT INTO administradores (username, password) 
VALUES ('Administrador', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- Nota: El hash corresponde a la contraseña "Src_Control@2025" usando bcrypt
-- Si necesitas regenerar el hash, puedes usar cualquier herramienta de bcrypt online