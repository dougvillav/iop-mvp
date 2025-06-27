
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import type { OrgFxRate, FxRateForm } from '@/lib/types';

interface FxRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRate?: OrgFxRate | null;
}

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'MXN', 'CAD', 'AUD', 'CHF', 'CNY', 'BRL'
];

export const FxRateModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingRate 
}: FxRateModalProps) => {
  const { toast } = useToast();
  
  const form = useForm<FxRateForm>({
    defaultValues: {
      from_currency: editingRate?.from_currency || '',
      to_currency: editingRate?.to_currency || '',
      rate: editingRate ? Number(editingRate.rate) : 1.0,
      is_active: editingRate?.is_active ?? true
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FxRateForm) => {
      if (editingRate) {
        // Actualizar rate existente
        const { error } = await supabase
          .from('org_fx_rates')
          .update({
            rate: data.rate,
            is_active: data.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRate.id);
        
        if (error) throw error;
      } else {
        // Crear nuevo rate
        const { error } = await supabase
          .from('org_fx_rates')
          .insert({
            from_currency: data.from_currency,
            to_currency: data.to_currency,
            rate: data.rate,
            is_active: data.is_active,
            organization_id: '00000000-0000-0000-0000-000000000001' // TODO: Obtener de contexto de usuario
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingRate ? 'Rate actualizado' : 'Rate creado',
        description: `El tipo de cambio se ha ${editingRate ? 'actualizado' : 'creado'} correctamente`,
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: FxRateForm) => {
    if (data.from_currency === data.to_currency) {
      toast({
        title: 'Error de validación',
        description: 'Las monedas origen y destino deben ser diferentes',
        variant: 'destructive',
      });
      return;
    }
    
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingRate ? 'Editar Tipo de Cambio' : 'Nuevo Tipo de Cambio'}
          </DialogTitle>
          <DialogDescription>
            {editingRate 
              ? 'Actualiza la configuración del tipo de cambio'
              : 'Configura un nuevo tipo de cambio para conversión entre monedas'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="from_currency"
              rules={{ required: 'Selecciona la moneda origen' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda origen</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!editingRate}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona moneda origen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to_currency"
              rules={{ required: 'Selecciona la moneda destino' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda destino</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!editingRate}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona moneda destino" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate"
              rules={{ 
                required: 'El rate es requerido',
                min: { value: 0.000001, message: 'El rate debe ser mayor a 0' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de cambio</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="1.000000"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {form.watch('from_currency') && form.watch('to_currency') && (
                    <p className="text-xs text-gray-600">
                      1 {form.watch('from_currency')} = {field.value} {form.watch('to_currency')}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Activo</FormLabel>
                    <div className="text-sm text-gray-600">
                      El tipo de cambio estará disponible para usar en asignaciones
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveMutation.isPending 
                  ? (editingRate ? 'Actualizando...' : 'Creando...') 
                  : (editingRate ? 'Actualizar' : 'Crear')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
