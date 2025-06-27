
-- Agregar campo fx_rate a la tabla instances
ALTER TABLE public.instances 
ADD COLUMN fx_rate NUMERIC NOT NULL DEFAULT 1.0;

-- Agregar constraint para asegurar que fx_rate sea mínimo 1.0
ALTER TABLE public.instances 
ADD CONSTRAINT instances_fx_rate_min CHECK (fx_rate >= 1.0);

-- Comentario para documentar el campo
COMMENT ON COLUMN public.instances.fx_rate IS 'Tipo de cambio asociado a la instancia, mínimo 1.0';
