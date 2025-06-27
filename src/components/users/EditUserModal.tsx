
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/lib/types';

interface InstanceForUsers {
  id: string;
  legal_name: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: UserProfile | null;
  instances: InstanceForUsers[];
}

export const EditUserModal = ({ isOpen, onClose, onUserUpdated, user, instances }: EditUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'readonly' as 'admin' | 'operator' | 'readonly',
    instance_id: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role,
        instance_id: user.organization_id ? 
          instances.find(i => instances.some(inst => inst.id === user.organization_id))?.id || 'unassigned' : 'unassigned'
      });
    }
  }, [user, instances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const updateData: any = {
        full_name: formData.full_name,
        role: formData.role,
        organization_id: null as string | null
      };

      if (formData.role !== 'admin' && formData.instance_id && formData.instance_id !== 'unassigned') {
        // Si no es admin y tiene instancia, obtener la organización de la instancia
        const { data: instance } = await supabase
          .from('instances')
          .select('organization_id')
          .eq('id', formData.instance_id)
          .single();
        
        if (instance) {
          updateData.organization_id = instance.organization_id;
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Usuario actualizado',
        description: 'Los cambios se han guardado exitosamente',
      });

      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error al actualizar usuario',
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
      instance_id: role === 'admin' ? 'unassigned' : prev.instance_id
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-100"
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
            <Label htmlFor="role">Rol</Label>
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
                  <SelectItem value="unassigned">Sin instancia específica</SelectItem>
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
