
-- Crear políticas RLS para la tabla allocations
CREATE POLICY "Users can view allocations from their organization" 
  ON public.allocations 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM org_wallets 
    WHERE org_wallets.id = allocations.org_wallet_id 
    AND org_wallets.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can create allocations for their organization" 
  ON public.allocations 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM org_wallets 
    WHERE org_wallets.id = allocations.org_wallet_id 
    AND org_wallets.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update allocations from their organization" 
  ON public.allocations 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM org_wallets 
    WHERE org_wallets.id = allocations.org_wallet_id 
    AND org_wallets.organization_id = get_user_organization_id()
  ));
