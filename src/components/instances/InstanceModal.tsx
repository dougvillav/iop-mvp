
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { CURRENCIES, COUNTRIES } from '@/utils/constants';
import type { Instance } from '@/lib/types';

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instance?: Instance | null;
}

const instanceSchema = z.object({
  legal_name: z.string().min(1, 'Nombre legal es requerido'),
  registration_id: z.string().optional(),
  country_iso: z.string().min(2, 'País es requerido'),
  settlement_currency: z.string().min(3, 'Moneda es requerida'),
});

type InstanceFormData = z.infer<typeof instanceSchema>;

export const InstanceModal: React.FC<InstanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  instance,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InstanceFormData>({
    resolver: zodResolver(instanceSchema),
    defaultValues: instance ? {
      legal_name: instance.legal_name,
      registration_id: instance.registration_id || '',
      country_iso: instance.country_iso,
      settlement_currency: instance.settlement_currency,
    } : {},
  });

  const selectedCountry = watch('country_iso');
  const selectedCurrency = watch('settlement_currency');

  const onSubmit = async (data: InstanceFormData) => {
    setIsLoading(true);
    try {
      if (instance) {
        // Update existing instance
        const { error } = await supabase
          .from('instances')
          .update(data)
          .eq('id', instance.id);

        if (error) throw error;

        toast({
          title: 'Instancia actualizada',
          description: 'La instancia se actualizó correctamente',
        });
      } else {
        // Create new instance - corregido para usar sintaxis correcta
        const { error } = await supabase
          .from('instances')
          .insert(data);

        if (error) throw error;

        toast({
          title: 'Instancia creada',
          description: 'La nueva instancia se creó correctamente',
        });
      }

      onSuccess();
      onClose();
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {instance ? 'Editar Instancia' : 'Nueva Instancia'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="legal_name">Nombre Legal</Label>
            <Input
              id="legal_name"
              {...register('legal_name')}
              placeholder="Nombre legal de la instancia"
            />
            {errors.legal_name && (
              <p className="text-sm text-red-600">{errors.legal_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_id">ID de Registro (Opcional)</Label>
            <Input
              id="registration_id"
              {...register('registration_id')}
              placeholder="Número de registro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country_iso">País</Label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => setValue('country_iso', value)}
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
            {errors.country_iso && (
              <p className="text-sm text-red-600">{errors.country_iso.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="settlement_currency">Moneda de Liquidación</Label>
            <Select
              value={selectedCurrency}
              onValueChange={(value) => setValue('settlement_currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.settlement_currency && (
              <p className="text-sm text-red-600">{errors.settlement_currency.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {instance ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                instance ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
