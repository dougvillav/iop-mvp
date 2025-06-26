
-- Crear tipos enum
CREATE TYPE app_role AS ENUM ('admin', 'operator', 'readonly');
CREATE TYPE transaction_type AS ENUM ('pay_in', 'pay_out');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'disputed');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');
CREATE TYPE entry_type AS ENUM ('deposit', 'allocation_in', 'allocation_out', 'payout', 'refund');
CREATE TYPE wallet_type AS ENUM ('org', 'instance');
CREATE TYPE allocation_type AS ENUM ('allocation', 'return');

-- Tabla de organizaciones
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de instancias (entidades legales por país)
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  legal_name VARCHAR(255) NOT NULL,
  registration_id VARCHAR(100),
  country_iso CHAR(2) NOT NULL,
  settlement_currency CHAR(3) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de wallets de organización (multi-moneda)
CREATE TABLE org_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL,
  balance_available DECIMAL(15,2) DEFAULT 0,
  threshold_min DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, currency)
);

-- Tabla de wallets de instancia
CREATE TABLE instance_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  org_wallet_id UUID REFERENCES org_wallets(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL,
  balance_available DECIMAL(15,2) DEFAULT 0,
  threshold_min DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instance_id, currency)
);

-- Tabla de configuración de rails de pago
CREATE TABLE payout_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rail VARCHAR(50) NOT NULL CHECK (rail IN ('visa_direct', 'mastercard_send')),
  issuer_bin VARCHAR(10) NOT NULL,
  acquirer_bin VARCHAR(10) NOT NULL,
  settlement_account VARCHAR(100) NOT NULL,
  daily_limit DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relación many-to-many instances <-> payout_configs
CREATE TABLE instance_payout_configs (
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  payout_config_id UUID REFERENCES payout_configs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (instance_id, payout_config_id)
);

-- Tabla de portadores de tarjetas (datos tokenizados)
CREATE TABLE cardholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  country CHAR(2),
  address TEXT,
  card_token VARCHAR(255) NOT NULL UNIQUE,
  pan_first6 CHAR(6),
  pan_last4 CHAR(4),
  card_brand VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  cardholder_id UUID REFERENCES cardholders(id) ON DELETE RESTRICT,
  instance_wallet_id UUID REFERENCES instance_wallets(id) ON DELETE RESTRICT,
  type transaction_type NOT NULL,
  rail VARCHAR(50),
  amount_brutto DECIMAL(15,2) NOT NULL,
  commission DECIMAL(15,2) DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  amount_net DECIMAL(15,2) NOT NULL,
  fx_rate DECIMAL(10,6) DEFAULT 1,
  status transaction_status DEFAULT 'pending',
  external_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de disputas
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE UNIQUE,
  reason TEXT,
  status dispute_status DEFAULT 'open',
  evidence_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ledger de wallets (historial inmutable)
CREATE TABLE wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL,
  wallet_type wallet_type NOT NULL,
  entry_type entry_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de depósitos manuales
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_wallet_id UUID REFERENCES org_wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de asignaciones de fondos org -> instance
CREATE TABLE allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_wallet_id UUID REFERENCES org_wallets(id) ON DELETE CASCADE,
  instance_wallet_id UUID REFERENCES instance_wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  type allocation_type DEFAULT 'allocation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de perfiles de usuario
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role app_role NOT NULL DEFAULT 'readonly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_payout_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;

-- Función helper para obtener la organización del usuario actual
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM user_profiles WHERE id = auth.uid();
$$;

-- Políticas RLS para organizations
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "Admins can update their organization" ON organizations
  FOR UPDATE USING (id = get_user_organization_id() AND get_user_role() = 'admin');

-- Políticas RLS para instances
CREATE POLICY "Users can view instances in their organization" ON instances
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage instances" ON instances
  FOR ALL USING (organization_id = get_user_organization_id() AND get_user_role() IN ('admin', 'operator'));

-- Políticas RLS para org_wallets
CREATE POLICY "Users can view org wallets" ON org_wallets
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage org wallets" ON org_wallets
  FOR ALL USING (organization_id = get_user_organization_id() AND get_user_role() IN ('admin', 'operator'));

-- Políticas RLS para instance_wallets
CREATE POLICY "Users can view instance wallets" ON instance_wallets
  FOR SELECT USING (
    instance_id IN (
      SELECT id FROM instances WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Operators can manage instance wallets" ON instance_wallets
  FOR ALL USING (
    instance_id IN (
      SELECT id FROM instances WHERE organization_id = get_user_organization_id()
    ) AND get_user_role() IN ('admin', 'operator')
  );

-- Políticas RLS para cardholders
CREATE POLICY "Users can view cardholders" ON cardholders
  FOR SELECT USING (true); -- Todos pueden ver cardholders (datos tokenizados)

CREATE POLICY "Operators can manage cardholders" ON cardholders
  FOR ALL USING (get_user_role() IN ('admin', 'operator'));

-- Políticas RLS para transactions
CREATE POLICY "Users can view transactions in their organization" ON transactions
  FOR SELECT USING (
    instance_id IN (
      SELECT id FROM instances WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Operators can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    instance_id IN (
      SELECT id FROM instances WHERE organization_id = get_user_organization_id()
    ) AND get_user_role() IN ('admin', 'operator')
  );

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view profiles in their organization" ON user_profiles
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can manage user profiles" ON user_profiles
  FOR ALL USING (organization_id = get_user_organization_id() AND get_user_role() = 'admin');

-- Crear índices para optimizar consultas
CREATE INDEX idx_instances_organization_id ON instances(organization_id);
CREATE INDEX idx_org_wallets_organization_id ON org_wallets(organization_id);
CREATE INDEX idx_instance_wallets_instance_id ON instance_wallets(instance_id);
CREATE INDEX idx_transactions_instance_id ON transactions(instance_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX idx_cardholders_email ON cardholders(email);
CREATE INDEX idx_cardholders_full_name ON cardholders USING gin(to_tsvector('english', full_name));

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_wallets_updated_at BEFORE UPDATE ON org_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instance_wallets_updated_at BEFORE UPDATE ON instance_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'readonly'::app_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para crear payout con validaciones atómicas
CREATE OR REPLACE FUNCTION create_payout(
  p_instance_id UUID,
  p_cardholder_id UUID,
  p_amount DECIMAL,
  p_rail VARCHAR,
  p_commission DECIMAL DEFAULT 0,
  p_tax DECIMAL DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_transaction_id UUID;
  v_amount_net DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  -- Calcular monto neto
  v_amount_net := p_amount - p_commission - p_tax;
  
  -- Obtener wallet de instancia
  SELECT id, balance_available INTO v_wallet_id, v_current_balance
  FROM instance_wallets 
  WHERE instance_id = p_instance_id;
  
  -- Validar saldo disponible
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %', v_current_balance, p_amount;
  END IF;
  
  -- Crear transacción
  INSERT INTO transactions (
    instance_id, cardholder_id, instance_wallet_id, type, rail,
    amount_brutto, commission, tax, amount_net, status
  ) VALUES (
    p_instance_id, p_cardholder_id, v_wallet_id, 'pay_out', p_rail,
    p_amount, p_commission, p_tax, v_amount_net, 'pending'
  ) RETURNING id INTO v_transaction_id;
  
  -- Actualizar balance del wallet
  UPDATE instance_wallets 
  SET balance_available = balance_available - p_amount,
      updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Crear entrada en ledger
  INSERT INTO wallet_ledger (
    wallet_id, wallet_type, entry_type, amount, balance_after, 
    transaction_id, reference, created_by
  ) VALUES (
    v_wallet_id, 'instance', 'payout', -p_amount, 
    v_current_balance - p_amount, v_transaction_id, 
    'Payout to cardholder', auth.uid()
  );
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para hacer depósito a wallet organizacional
CREATE OR REPLACE FUNCTION create_deposit(
  p_org_wallet_id UUID,
  p_amount DECIMAL,
  p_reference VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_deposit_id UUID;
  v_current_balance DECIMAL;
BEGIN
  -- Obtener balance actual
  SELECT balance_available INTO v_current_balance
  FROM org_wallets WHERE id = p_org_wallet_id;
  
  -- Crear depósito
  INSERT INTO deposits (org_wallet_id, amount, reference, created_by)
  VALUES (p_org_wallet_id, p_amount, p_reference, auth.uid())
  RETURNING id INTO v_deposit_id;
  
  -- Actualizar balance
  UPDATE org_wallets 
  SET balance_available = balance_available + p_amount,
      updated_at = NOW()
  WHERE id = p_org_wallet_id;
  
  -- Crear entrada en ledger
  INSERT INTO wallet_ledger (
    wallet_id, wallet_type, entry_type, amount, balance_after,
    reference, created_by
  ) VALUES (
    p_org_wallet_id, 'org', 'deposit', p_amount,
    v_current_balance + p_amount, p_reference, auth.uid()
  );
  
  RETURN v_deposit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertar datos de ejemplo para desarrollo
INSERT INTO organizations (commercial_name) VALUES ('Demo Financial Corp');

INSERT INTO instances (organization_id, legal_name, registration_id, country_iso, settlement_currency)
SELECT id, 'Demo Financial Mexico SA', 'RFC123456789', 'MX', 'MXN'
FROM organizations WHERE commercial_name = 'Demo Financial Corp';

INSERT INTO org_wallets (organization_id, currency, balance_available, threshold_min)
SELECT id, 'USD', 50000.00, 1000.00
FROM organizations WHERE commercial_name = 'Demo Financial Corp';

INSERT INTO org_wallets (organization_id, currency, balance_available, threshold_min)
SELECT id, 'MXN', 1000000.00, 10000.00
FROM organizations WHERE commercial_name = 'Demo Financial Corp';

INSERT INTO payout_configs (rail, issuer_bin, acquirer_bin, settlement_account, daily_limit)
VALUES 
  ('visa_direct', '123456', '654321', 'ACC_VISA_001', 100000.00),
  ('mastercard_send', '789012', '210987', 'ACC_MC_001', 75000.00);
