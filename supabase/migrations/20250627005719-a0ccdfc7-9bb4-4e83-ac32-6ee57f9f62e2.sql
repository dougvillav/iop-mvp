
-- Crear tabla para configuración de tarifas por instancia
CREATE TABLE public.instance_tariff_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  transaction_type public.transaction_type NOT NULL,
  rail VARCHAR(50) NOT NULL,
  commission_percentage NUMERIC(5,4) DEFAULT 0,
  commission_fixed NUMERIC(10,2) DEFAULT 0,
  tax_percentage NUMERIC(5,4) DEFAULT 0,
  processing_fee NUMERIC(10,2) DEFAULT 0,
  currency CHAR(3) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instance_id, transaction_type, rail, currency)
);

-- Habilitar RLS
ALTER TABLE public.instance_tariff_configs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean las configuraciones de tarifas de su organización
CREATE POLICY "Users can view tariff configs from their organization" 
  ON public.instance_tariff_configs 
  FOR SELECT 
  USING (
    instance_id IN (
      SELECT i.id FROM instances i 
      WHERE i.organization_id = get_user_organization_id()
    )
  );

-- Política para crear configuraciones de tarifas
CREATE POLICY "Users can create tariff configs for their organization" 
  ON public.instance_tariff_configs 
  FOR INSERT 
  WITH CHECK (
    instance_id IN (
      SELECT i.id FROM instances i 
      WHERE i.organization_id = get_user_organization_id()
    )
  );

-- Política para actualizar configuraciones de tarifas
CREATE POLICY "Users can update tariff configs from their organization" 
  ON public.instance_tariff_configs 
  FOR UPDATE 
  USING (
    instance_id IN (
      SELECT i.id FROM instances i 
      WHERE i.organization_id = get_user_organization_id()
    )
  );

-- Política para eliminar configuraciones de tarifas
CREATE POLICY "Users can delete tariff configs from their organization" 
  ON public.instance_tariff_configs 
  FOR DELETE 
  USING (
    instance_id IN (
      SELECT i.id FROM instances i 
      WHERE i.organization_id = get_user_organization_id()
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_instance_tariff_configs_updated_at
    BEFORE UPDATE ON public.instance_tariff_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Crear vista para datos de conciliación
CREATE OR REPLACE VIEW public.reconciliation_data AS
SELECT 
  i.id as instance_id,
  i.legal_name as instance_name,
  i.settlement_currency,
  DATE_TRUNC('day', t.created_at) as transaction_date,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_transactions,
  SUM(CASE WHEN t.status = 'completed' THEN t.amount_brutto ELSE 0 END) as total_processed,
  SUM(CASE WHEN t.status = 'completed' THEN t.commission ELSE 0 END) as total_commission,
  SUM(CASE WHEN t.status = 'completed' THEN t.tax ELSE 0 END) as total_tax,
  SUM(CASE WHEN t.status = 'completed' THEN t.amount_net ELSE 0 END) as total_net,
  t.rail,
  t.type as transaction_type
FROM instances i
LEFT JOIN transactions t ON i.id = t.instance_id
WHERE i.organization_id = get_user_organization_id()
GROUP BY i.id, i.legal_name, i.settlement_currency, DATE_TRUNC('day', t.created_at), t.rail, t.type;
