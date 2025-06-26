
-- Función para crear wallets de instancia automáticamente
CREATE OR REPLACE FUNCTION create_instance_wallets(
  p_instance_id UUID,
  p_settlement_currency CHAR(3)
) RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
  v_org_wallet_id UUID;
BEGIN
  -- Obtener la organización de la instancia
  SELECT organization_id INTO v_org_id
  FROM instances 
  WHERE id = p_instance_id;
  
  -- Obtener el wallet organizacional de la moneda de liquidación
  SELECT id INTO v_org_wallet_id
  FROM org_wallets 
  WHERE organization_id = v_org_id 
  AND currency = p_settlement_currency;
  
  -- Si no existe el wallet organizacional, crearlo
  IF v_org_wallet_id IS NULL THEN
    INSERT INTO org_wallets (organization_id, currency, balance_available, threshold_min)
    VALUES (v_org_id, p_settlement_currency, 0, 1000)
    RETURNING id INTO v_org_wallet_id;
  END IF;
  
  -- Crear wallet de instancia
  INSERT INTO instance_wallets (
    instance_id, 
    org_wallet_id, 
    currency, 
    balance_available, 
    threshold_min
  ) VALUES (
    p_instance_id,
    v_org_wallet_id,
    p_settlement_currency,
    0,
    500
  ) ON CONFLICT (instance_id, currency) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear wallets automáticamente cuando se crea una instancia
CREATE OR REPLACE FUNCTION handle_new_instance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_instance_wallets(NEW.id, NEW.settlement_currency);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_instance_created ON instances;
CREATE TRIGGER on_instance_created
  AFTER INSERT ON instances
  FOR EACH ROW EXECUTE FUNCTION handle_new_instance();

-- Crear wallets para instancias existentes que no los tengan
DO $$
DECLARE
  instance_record RECORD;
BEGIN
  FOR instance_record IN 
    SELECT i.id, i.settlement_currency 
    FROM instances i
    LEFT JOIN instance_wallets iw ON i.id = iw.instance_id AND i.settlement_currency = iw.currency
    WHERE iw.id IS NULL
  LOOP
    PERFORM create_instance_wallets(instance_record.id, instance_record.settlement_currency);
  END LOOP;
END $$;
