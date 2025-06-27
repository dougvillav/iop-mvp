
-- Eliminar la función existente y recrearla con el parámetro correcto
DROP FUNCTION IF EXISTS public.create_payout(uuid, uuid, numeric, character varying, numeric, numeric);

-- Crear la función con el parámetro correcto
CREATE OR REPLACE FUNCTION public.create_payout(
  p_instance_id uuid, 
  p_cardholder_id uuid, 
  p_amount_brutto numeric, 
  p_rail character varying, 
  p_commission numeric DEFAULT 0, 
  p_tax numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_wallet_id UUID;
  v_transaction_id UUID;
  v_current_balance DECIMAL;
  v_fx_rate DECIMAL;
  v_processing_fee DECIMAL DEFAULT 0;
  v_total_debit DECIMAL;
  v_amount_net DECIMAL;
BEGIN
  -- Obtener wallet de instancia y FX rate
  SELECT iw.id, iw.balance_available, i.fx_rate 
  INTO v_wallet_id, v_current_balance, v_fx_rate
  FROM instance_wallets iw
  JOIN instances i ON i.id = iw.instance_id
  WHERE iw.instance_id = p_instance_id;
  
  -- Obtener configuración de tarifas para obtener processing fee
  SELECT processing_fee INTO v_processing_fee
  FROM instance_tariff_configs 
  WHERE instance_id = p_instance_id 
    AND transaction_type = 'pay_out' 
    AND rail = p_rail 
    AND is_active = true
  LIMIT 1;
  
  -- Si no hay configuración, usar 0
  v_processing_fee := COALESCE(v_processing_fee, 0);
  
  -- Calcular el total a debitar del wallet (brutto + comisión + impuesto + processing fee) * fx_rate
  v_total_debit := (p_amount_brutto + p_commission + p_tax + v_processing_fee) * v_fx_rate;
  
  -- El amount_net es lo que efectivamente se debita del wallet
  v_amount_net := v_total_debit;
  
  -- Validar saldo disponible
  IF v_current_balance < v_total_debit THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponible: %, Requerido: %', v_current_balance, v_total_debit;
  END IF;
  
  -- Crear transacción
  INSERT INTO transactions (
    instance_id, cardholder_id, instance_wallet_id, type, rail,
    amount_brutto, commission, tax, amount_net, status, fx_rate
  ) VALUES (
    p_instance_id, p_cardholder_id, v_wallet_id, 'pay_out', p_rail,
    p_amount_brutto, p_commission, p_tax, v_amount_net, 'pending', v_fx_rate
  ) RETURNING id INTO v_transaction_id;
  
  -- Actualizar balance del wallet (debitar el total)
  UPDATE instance_wallets 
  SET balance_available = balance_available - v_total_debit,
      updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Crear entrada en ledger
  INSERT INTO wallet_ledger (
    wallet_id, wallet_type, entry_type, amount, balance_after, 
    transaction_id, reference, created_by
  ) VALUES (
    v_wallet_id, 'instance', 'payout', -v_total_debit, 
    v_current_balance - v_total_debit, v_transaction_id, 
    'Payout to cardholder', auth.uid()
  );
  
  RETURN v_transaction_id;
END;
$function$
