-- Set password for rsantana user
SELECT public.set_empleado_turno_password(
    '3e69c1bf-9b24-400f-badf-c61205656060'::uuid, 
    'rsantana', 
    'SRC_Agente2025'
);