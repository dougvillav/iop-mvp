
-- Crear función para simular estados de transacciones
CREATE OR REPLACE FUNCTION public.simulate_transaction_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_record RECORD;
  random_outcome FLOAT;
  new_status transaction_status;
BEGIN
  -- Actualizar transacciones pendientes creadas hace más de 30 segundos
  FOR transaction_record IN 
    SELECT id, amount_brutto 
    FROM transactions 
    WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '30 seconds'
    ORDER BY created_at DESC
    LIMIT 10
  LOOP
    -- Generar resultado aleatorio
    random_outcome := RANDOM();
    
    -- Determinar estado basado en probabilidades y monto
    IF transaction_record.amount_brutto > 10000 THEN
      -- Montos altos tienen mayor probabilidad de rechazo
      IF random_outcome < 0.15 THEN
        new_status := 'failed';
      ELSIF random_outcome < 0.25 THEN
        new_status := 'pending';
      ELSE
        new_status := 'completed';
      END IF;
    ELSE
      -- Montos normales
      IF random_outcome < 0.10 THEN
        new_status := 'failed';
      ELSIF random_outcome < 0.20 THEN
        new_status := 'pending';
      ELSE
        new_status := 'completed';
      END IF;
    END IF;
    
    -- Actualizar la transacción
    UPDATE transactions 
    SET status = new_status, 
        updated_at = NOW()
    WHERE id = transaction_record.id;
    
  END LOOP;
END;
$$;

-- Agregar colón costarricense a las opciones de moneda (esto es más para documentación)
-- Las monedas se manejan como strings en la aplicación, así que CRC estará disponible

-- Crear índice para mejorar búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status_date ON transactions(status, created_at);
