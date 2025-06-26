
import { useState, useEffect } from 'react';
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
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import type { Instance } from '@/lib/types';

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instance?: Instance | null;
}

interface InstanceForm {
  legal_name: string;
  country_iso: string;
  settlement_currency: string;
  registration_id?: string;
  status: string;
}

const countries = [
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'BR', name: 'Brasil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
];

const currencies = [
  { code: 'USD', name: 'Dólar Estadounidense' },
  { code: 'MXN', name: 'Peso Mexicano' },
  { code: 'CAD', name: 'Dólar Canadiense' },
  { code: 'BRL', name: 'Real Brasileño' },
  { code: 'ARS', name: 'Peso Argentino' },
  { code: 'COP', name: 'Peso Colombiano' },
  { code: 'CLP', name: 'Peso Chileno' },
  { code: 'PEN', name: 'Sol Peruano' },
];

export const InstanceModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  instance 
}: InstanceModalProps) => {
  const { toast } = useToast();
  const isEditing = !!instance;
  
  const form = useForm<InstanceForm>({
    defaultValues: {
      legal_name: '',
      country_iso: '',
      settlement_currency: '',
      registration_id: '',
      status: 'active'
    }
  });

  useEffect(() => {
    if (instance) {
      form.reset({
        legal_name: instance.legal_name,
        country_iso: instance.country_iso,
        settlement_currency: instance.settlement_currency,
        registration_id: instance.registration_id || '',
        status: instance.status || 'active'
      });
    } else {
      form.reset({
        legal_name: '',
        country_iso: '',
        settlement_currency: '',
        registration_id: '',
        status: 'active'
      });
    }
  }, [instance, form]);

  const instanceMutation = useMutation({
    mutationFn: async (data: InstanceForm) => {
      // Obtener la organización del usuario actual
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (userError || !userProfile?.organization_id) {
        throw new Error('No se pudo obtener la organización del usuario');
      }

      if (isEditing && instance) {
        const { data: result, error } = await supabase
          .from('instances')
          .update({
            legal_name: data.legal_name,
            country_iso: data.country_iso,
            settlement_currency: data.settlement_currency,
            registration_id: data.registration_id || null,
            status: data.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('instances')
          .insert({
            legal_name: data.legal_name,
            country_iso: data.country_iso,
            settlement_currency: data.settlement_currency,
            registration_id: data.registration_id || null,
            status: data.status,
            organization_id: userProfile.organization_id
          })
          .select()
          .single();
        
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? 'Instancia actualizada' : 'Instancia creada',
        description: isEditing 
          ? 'La instancia se ha actualizado correctamente'
          : 'La instancia se ha creado correctamente y sus wallets están listos',
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: isEditing ? 'Error al actualizar' : 'Error al crear instancia',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: InstanceForm) => {
    instanceMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Instancia' : 'Nueva Instancia'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Actualiza los datos de la instancia'
              : 'Crea una nueva instancia para procesar pagos'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="legal_name"
              rules={{ required: 'El nombre legal es requerido' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Legal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Fintech Solutions México S.A. de C.V."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country_iso"
              rules={{ required: 'Selecciona un país' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un país" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.code})
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
              name="settlement_currency"
              rules={{ required: 'Selecciona una moneda' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda de Liquidación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.name} ({currency.code})
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
              name="registration_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de Registro (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: RFC, Tax ID, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                      <SelectItem value="suspended">Suspendida</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={instanceMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={instanceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {instanceMutation.isPending 
                  ? 'Procesando...' 
                  : isEditing 
                  ? 'Actualizar' 
                  : 'Crear Instancia'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
