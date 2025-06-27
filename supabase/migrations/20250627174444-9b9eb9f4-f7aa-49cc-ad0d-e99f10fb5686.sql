
-- Crear tabla para configuración de rates de FX por organización
CREATE TABLE public.org_fx_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_currency CHAR(3) NOT NULL,
  to_currency CHAR(3) NOT NULL,
  rate NUMERIC(10, 6) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, from_currency, to_currency)
);

-- Modificar tabla allocations para incluir información de conversión
ALTER TABLE public.allocations 
ADD COLUMN fx_rate NUMERIC(10, 6) DEFAULT 1.0,
ADD COLUMN amount_origin NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN amount_destination NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN currency_origin CHAR(3),
ADD COLUMN currency_destination CHAR(3);

-- Actualizar registros existentes para mantener consistencia
UPDATE public.allocations 
SET amount_origin = amount, 
    amount_destination = amount,
    fx_rate = 1.0;

-- Función para crear asignación con conversión FX
CREATE OR REPLACE FUNCTION public.create_allocation(
  p_org_wallet_id UUID,
  p_instance_wallet_id UUID,
  p_amount_origin NUMERIC,
  p_fx_rate NUMERIC DEFAULT 1.0
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allocation_id UUID;
  v_org_balance NUMERIC;
  v_instance_balance NUMERIC;
  v_amount_destination NUMERIC;
  v_org_currency CHAR(3);
  v_instance_currency CHAR(3);
BEGIN
  -- Calcular monto destino
  v_amount_destination := p_amount_origin * p_fx_rate;
  
  -- Obtener balances y monedas actuales
  SELECT balance_available, currency INTO v_org_balance, v_org_currency
  FROM org_wallets WHERE id = p_org_wallet_id;
  
  SELECT balance_available, currency INTO v_instance_balance, v_instance_currency
  FROM instance_wallets WHERE id = p_instance_wallet_id;
  
  -- Validar fondos suficientes
  IF v_org_balance < p_amount_origin THEN
    RAISE EXCEPTION 'Fondos insuficientes en el wallet organizacional. Disponible: %, Requerido: %', 
      v_org_balance, p_amount_origin;
  END IF;
  
  -- Crear la asignación
  INSERT INTO allocations (
    org_wallet_id, 
    instance_wallet_id, 
    amount, 
    amount_origin, 
    amount_destination,
    fx_rate,
    currency_origin,
    currency_destination,
    type,
    created_by
  ) VALUES (
    p_org_wallet_id,
    p_instance_wallet_id,
    p_amount_origin, -- amount sigue siendo el monto origen para compatibilidad
    p_amount_origin,
    v_amount_destination,
    p_fx_rate,
    v_org_currency,
    v_instance_currency,
    'allocation',
    auth.uid()
  ) RETURNING id INTO v_allocation_id;
  
  -- Actualizar balance del wallet organizacional (debitar en moneda origen)
  UPDATE org_wallets 
  SET balance_available = balance_available - p_amount_origin,
      updated_at = NOW()
  WHERE id = p_org_wallet_id;
  
  -- Actualizar balance del wallet de instancia (acreditar en moneda destino)
  UPDATE instance_wallets 
  SET balance_available = balance_available + v_amount_destination,
      updated_at = NOW()
  WHERE id = p_instance_wallet_id;
  
  -- Crear entradas en ledger
  INSERT INTO wallet_ledger (
    wallet_id, wallet_type, entry_type, amount, balance_after,
    reference, created_by
  ) VALUES 
  (
    p_org_wallet_id, 'org', 'allocation_out', -p_amount_origin,
    v_org_balance - p_amount_origin,
    'Allocation to instance - FX: ' || p_fx_rate::text, auth.uid()
  ),
  (
    p_instance_wallet_id, 'instance', 'allocation_in', v_amount_destination,
    v_instance_balance + v_amount_destination,
    'Allocation from org - FX: ' || p_fx_rate::text, auth.uid()
  );
  
  RETURN v_allocation_id;
END;
$$;

-- Trigger para actualizar updated_at en org_fx_rates
CREATE TRIGGER update_org_fx_rates_updated_at
  BEFORE UPDATE ON public.org_fx_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_org_fx_rates_organization_id ON public.org_fx_rates(organization_id);
CREATE INDEX idx_org_fx_rates_currencies ON public.org_fx_rates(organization_id, from_currency, to_currency);
CREATE INDEX idx_allocations_currencies ON public.allocations(currency_origin, currency_destination);
