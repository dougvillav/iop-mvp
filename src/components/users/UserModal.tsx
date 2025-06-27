
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Instance } from '@/lib/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  instances: Instance[];
}

export const UserModal = ({ isOpen, onClose, onUserCreated, instances }: UserModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'readonly' as 'admin' | 'operator' | 'readonly',
    instance_id: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Crear perfil de usuario
        const profileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          organization_id: null as string | null
        };

        if (formData.role !== 'admin' && formData.instance_id) {
          // Si no es admin y tiene instancia, obtener la organización de la instancia
          const { data: instance } = await supabase
            .from('instances')
            .select('organization_id')
            .eq('id', formData.instance_id)
            .single();
          
          if (instance) {
            profileData.organization_id = instance.organization_id;
          }
        }

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (profileError) throw profileError;

        toast({
          title: 'Usuario creado exitosamente',
          description: `Se ha enviado un email de invitación a ${formData.email}`,
        });

        setFormData({
          email: '',
          full_name: '',
          role: 'readonly',
          instance_id: '',
          password: ''
        });

        onUserCreated();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error al crear usuario',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role: role as 'admin' | 'operator' | 'readonly',
      instance_id: role === 'admin' ? '' : prev.instance_id
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña Temporal *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              placeholder="Mínimo 8 caracteres"
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              value={formData.role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador de Organización</SelectItem>
                <SelectItem value="operator">Gerente de Instancia</SelectItem>
                <SelectItem value="readonly">Solo Lectura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role !== 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="instance">Instancia {formData.role === 'operator' ? '*' : ''}</Label>
              <Select
                value={formData.instance_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, instance_id: value }))}
                required={formData.role === 'operator'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar instancia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin instancia específica</SelectItem>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
