
-- Asignar el usuario Douglas Villalobos a la organización de IOP Costa Rica
-- y cambiar su rol a operator para que pueda gestionar la instancia
UPDATE user_profiles 
SET 
  organization_id = 'e1a70607-04f4-4efa-84c2-b00d281a835e',
  role = 'operator',
  updated_at = now()
WHERE email = 'douglas.villalobos@gmail.com';
