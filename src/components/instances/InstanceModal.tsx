
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CURRENCIES, COUNTRIES } from '@/utils/constants';

export const InstanceModal = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    legal_name: '',
    registration_id: '',
    country_iso: '',
    settlement_currency: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createInstanceMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from('instances')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast({
        title: 'Instancia creada',
        description: 'La instancia se ha creado exitosamente.',
      });
      setOpen(false);
      setFormData({
        legal_name: '',
        registration_id: '',
        country_iso: '',
        settlement_currency: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInstanceMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Instancia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Crear Nueva Instancia
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="legal_name">Nombre Legal *</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              placeholder="Nombre legal de la empresa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_id">ID de Registro</Label>
            <Input
              id="registration_id"
              value={formData.registration_id}
              onChange={(e) => setFormData({ ...formData, registration_id: e.target.value })}
              placeholder="Número de registro comercial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country_iso">País *</Label>
            <Select
              value={formData.country_iso}
              onValueChange={(value) => setFormData({ ...formData, country_iso: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settlement_currency">Moneda de Liquidación *</Label>
            <Select
              value={formData.settlement_currency}
              onValueChange={(value) => setFormData({ ...formData, settlement_currency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createInstanceMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createInstanceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createInstanceMutation.isPending ? 'Creando...' : 'Crear Instancia'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
