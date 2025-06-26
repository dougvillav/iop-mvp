
-- Habilitar RLS en las tablas principales si no está habilitado
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instance_wallets ENABLE ROW LEVEL SECURITY;

-- Políticas para instances
CREATE POLICY "Users can view instances from their organization" 
  ON public.instances 
  FOR SELECT 
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create instances for their organization" 
  ON public.instances 
  FOR INSERT 
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update instances from their organization" 
  ON public.instances 
  FOR UPDATE 
  USING (organization_id = get_user_organization_id());

-- Políticas para org_wallets
CREATE POLICY "Users can view org wallets from their organization" 
  ON public.org_wallets 
  FOR SELECT 
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org wallets for their organization" 
  ON public.org_wallets 
  FOR INSERT 
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org wallets from their organization" 
  ON public.org_wallets 
  FOR UPDATE 
  USING (organization_id = get_user_organization_id());

-- Políticas para instance_wallets
CREATE POLICY "Users can view instance wallets from their organization" 
  ON public.instance_wallets 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM instances 
    WHERE instances.id = instance_wallets.instance_id 
    AND instances.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can create instance wallets for their organization" 
  ON public.instance_wallets 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM instances 
    WHERE instances.id = instance_wallets.instance_id 
    AND instances.organization_id = get_user_organization_id()
  ));

-- Crear una organización por defecto si no existe
INSERT INTO public.organizations (commercial_name, status)
SELECT 'Organización Demo', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations);

-- Asignar la organización a usuarios que no la tengan
UPDATE public.user_profiles 
SET organization_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE organization_id IS NULL;
