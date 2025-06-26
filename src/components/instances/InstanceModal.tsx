
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Instance } from '@/lib/types';

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instance?: Instance | null;
}

const CURRENCIES = [
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  { value: 'CAD', label: 'Dólar Canadiense (CAD)' },
];

const COUNTRIES = [
  { value: 'US', label: 'Estados Unidos' },
  { value: 'MX', label: 'México' },
  { value: 'CA', label: 'Canadá' },
  { value: 'ES', label: 'España' },
  { value: 'FR', label: 'Francia' },
  { value: 'DE', label: 'Alemania' },
];

export const InstanceModal = ({ isOpen, onClose, onSuccess, instance }: InstanceModalProps) => {
  const [formData, setFormData] = useState({
    legal_name: '',
    registration_id: '',
    country_iso: '',
    settlement_currency: '',
    status: 'active'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (instance) {
      setFormData({
        legal_name: instance.legal_name || '',
        registration_id: instance.registration_id || '',
        country_iso: instance.country_iso || '',
        settlement_currency: instance.settlement_currency || '',
        status: instance.status || 'active'
      });
    } else {
      setFormData({
        legal_name: '',
        registration_id: '',
        country_iso: '',
        settlement_currency: '',
        status: 'active'
      });
    }
  }, [instance]);

  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      // Obtener la organización del usuario actual
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No se encontró la organización del usuario');
      }

      const instanceData = {
        ...formData,
        organization_id: profile.organization_id
      };

      if (instance) {
        // Actualizar instancia existente
        const { data, error } = await supabase
          .from('instances')
          .update(instanceData)
          .eq('id', instance.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crear nueva instancia
        const { data, error } = await supabase
          .from('instances')
          .insert([instanceData])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: instance ? 'Instancia actualizada' : 'Instancia creada',
        description: instance 
          ? 'La instancia se ha actualizado exitosamente'
          : 'La instancia se ha creado exitosamente y los wallets han sido configurados automáticamente',
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('Error al crear/actualizar instancia:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo procesar la instancia',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.legal_name || !formData.country_iso || !formData.settlement_currency) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    createInstanceMutation.mutate();
  };

  const handleClose = () => {
    if (!createInstanceMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {instance ? 'Editar Instancia' : 'Nueva Instancia'}
          </DialogTitle>
          <DialogDescription>
            {instance 
              ? 'Modifica los datos de la instancia'
              : 'Crea una nueva instancia para procesar pagos'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="legal_name">Nombre Legal *</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
              placeholder="Ej: Empresa SA de CV"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_id">ID de Registro</Label>
            <Input
              id="registration_id"
              value={formData.registration_id}
              onChange={(e) => setFormData(prev => ({ ...prev, registration_id: e.target.value }))}
              placeholder="Ej: RFC, Tax ID, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country_iso">País *</Label>
            <Select
              value={formData.country_iso}
              onValueChange={(value) => setFormData(prev => ({ ...prev, country_iso: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settlement_currency">Moneda de Liquidación *</Label>
            <Select
              value={formData.settlement_currency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, settlement_currency: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createInstanceMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createInstanceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createInstanceMutation.isPending 
                ? 'Procesando...' 
                : instance 
                ? 'Actualizar' 
                : 'Crear Instancia'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
