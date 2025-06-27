
-- Add RLS policies for org_fx_rates table (CRITICAL FIX)
CREATE POLICY "Users can view org fx rates from their organization" 
  ON public.org_fx_rates 
  FOR SELECT 
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org fx rates for their organization" 
  ON public.org_fx_rates 
  FOR INSERT 
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org fx rates from their organization" 
  ON public.org_fx_rates 
  FOR UPDATE 
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete org fx rates from their organization" 
  ON public.org_fx_rates 
  FOR DELETE 
  USING (organization_id = get_user_organization_id());

-- Add validation trigger for FX rates
CREATE OR REPLACE FUNCTION validate_fx_rate() 
RETURNS TRIGGER AS $$
BEGIN
  -- Validate rate is within reasonable bounds (0.000001 to 1000000)
  IF NEW.rate < 0.000001 OR NEW.rate > 1000000 THEN
    RAISE EXCEPTION 'FX rate must be between 0.000001 and 1000000, got: %', NEW.rate;
  END IF;
  
  -- Prevent same currency pairs
  IF NEW.from_currency = NEW.to_currency THEN
    RAISE EXCEPTION 'From currency and to currency cannot be the same';
  END IF;
  
  -- Validate currency codes (3 characters, uppercase)
  IF LENGTH(NEW.from_currency) != 3 OR NEW.from_currency != UPPER(NEW.from_currency) THEN
    RAISE EXCEPTION 'Invalid from_currency format: %', NEW.from_currency;
  END IF;
  
  IF LENGTH(NEW.to_currency) != 3 OR NEW.to_currency != UPPER(NEW.to_currency) THEN
    RAISE EXCEPTION 'Invalid to_currency format: %', NEW.to_currency;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_fx_rate_trigger
  BEFORE INSERT OR UPDATE ON public.org_fx_rates
  FOR EACH ROW EXECUTE FUNCTION validate_fx_rate();

-- Improve create_allocation function with better validation and error handling
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
  v_user_org_id UUID;
  v_org_wallet_org_id UUID;
  v_instance_org_id UUID;
BEGIN
  -- Get user's organization ID for authorization
  SELECT get_user_organization_id() INTO v_user_org_id;
  
  IF v_user_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;
  
  -- Validate input parameters
  IF p_amount_origin <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0, got: %', p_amount_origin;
  END IF;
  
  IF p_fx_rate <= 0 OR p_fx_rate > 1000000 THEN
    RAISE EXCEPTION 'FX rate must be between 0.000001 and 1000000, got: %', p_fx_rate;
  END IF;
  
  -- Validate wallet ownership and get details
  SELECT balance_available, currency, organization_id 
  INTO v_org_balance, v_org_currency, v_org_wallet_org_id
  FROM org_wallets 
  WHERE id = p_org_wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization wallet not found';
  END IF;
  
  -- Ensure org wallet belongs to user's organization
  IF v_org_wallet_org_id != v_user_org_id THEN
    RAISE EXCEPTION 'Access denied: wallet does not belong to your organization';
  END IF;
  
  -- Get instance wallet details and verify organization ownership
  SELECT iw.balance_available, iw.currency, i.organization_id
  INTO v_instance_balance, v_instance_currency, v_instance_org_id
  FROM instance_wallets iw
  JOIN instances i ON i.id = iw.instance_id
  WHERE iw.id = p_instance_wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Instance wallet not found';
  END IF;
  
  -- Ensure instance belongs to user's organization
  IF v_instance_org_id != v_user_org_id THEN
    RAISE EXCEPTION 'Access denied: instance does not belong to your organization';
  END IF;
  
  -- Calculate destination amount with proper rounding for financial precision
  v_amount_destination := ROUND(p_amount_origin * p_fx_rate, 2);
  
  -- Validate sufficient funds
  IF v_org_balance < p_amount_origin THEN
    RAISE EXCEPTION 'Insufficient funds. Available: %, Required: %', 
      v_org_balance, p_amount_origin;
  END IF;
  
  -- Create the allocation with audit trail
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
    p_amount_origin,
    p_amount_origin,
    v_amount_destination,
    p_fx_rate,
    v_org_currency,
    v_instance_currency,
    'allocation',
    auth.uid()
  ) RETURNING id INTO v_allocation_id;
  
  -- Update balances in a single transaction
  UPDATE org_wallets 
  SET balance_available = balance_available - p_amount_origin,
      updated_at = NOW()
  WHERE id = p_org_wallet_id;
  
  UPDATE instance_wallets 
  SET balance_available = balance_available + v_amount_destination,
      updated_at = NOW()
  WHERE id = p_instance_wallet_id;
  
  -- Create detailed ledger entries for audit trail
  INSERT INTO wallet_ledger (
    wallet_id, wallet_type, entry_type, amount, balance_after,
    reference, created_by
  ) VALUES 
  (
    p_org_wallet_id, 'org', 'allocation_out', -p_amount_origin,
    v_org_balance - p_amount_origin,
    FORMAT('Allocation to instance %s - FX: %s (%s->%s)', 
           p_instance_wallet_id, p_fx_rate, v_org_currency, v_instance_currency), 
    auth.uid()
  ),
  (
    p_instance_wallet_id, 'instance', 'allocation_in', v_amount_destination,
    v_instance_balance + v_amount_destination,
    FORMAT('Allocation from org %s - FX: %s (%s->%s)', 
           p_org_wallet_id, p_fx_rate, v_org_currency, v_instance_currency), 
    auth.uid()
  );
  
  RETURN v_allocation_id;
END;
$$;

-- Add validation trigger for deposits
CREATE OR REPLACE FUNCTION validate_deposit() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Deposit amount must be greater than 0, got: %', NEW.amount;
  END IF;
  
  IF NEW.amount > 10000000 THEN
    RAISE EXCEPTION 'Deposit amount exceeds maximum limit of 10,000,000';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_deposit_trigger
  BEFORE INSERT OR UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION validate_deposit();
