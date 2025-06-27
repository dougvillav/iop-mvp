
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import type { OrgWallet, InstanceWallet, Instance, OrgFxRate, CreateAllocationForm } from '@/lib/types';

interface InstanceWalletWithInstance extends InstanceWallet {
  instance: Instance;
}

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgWallets: OrgWallet[];
  instanceWallets: InstanceWalletWithInstance[];
}

export const AllocationModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  orgWallets,
  instanceWallets 
}: AllocationModalProps) => {
  const { toast } = useToast();
  
  const form = useForm<CreateAllocationForm>({
    defaultValues: {
      org_wallet_id: '',
      instance_wallet_id: '',
      amount_origin: 0,
      fx_rate: 1.0,
      amount_destination: 0
    }
  });

  const watchedValues = form.watch(['org_wallet_id', 'instance_wallet_id', 'amount_origin', 'fx_rate']);

  // Obtener FX rates de la organización
  const { data: fxRates } = useQuery({
    queryKey: ['org-fx-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_fx_rates')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as OrgFxRate[];
    }
  });

  const allocationMutation = useMutation({
    mutationFn: async (data: CreateAllocationForm) => {
      const { data: result, error } = await supabase.rpc('create_allocation', {
        p_org_wallet_id: data.org_wallet_id,
        p_instance_wallet_id: data.instance_wallet_id,
        p_amount_origin: data.amount_origin,
        p_fx_rate: data.fx_rate
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Fondos asignados',
        description: 'Los fondos se han asignado correctamente con conversión FX',
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error al asignar fondos',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const selectedOrgWallet = orgWallets.find(w => w.id === form.watch('org_wallet_id'));
  const selectedInstanceWallet = instanceWallets.find(w => w.id === form.watch('instance_wallet_id'));

  // Calcular FX rate predeterminado
  useEffect(() => {
    if (selectedOrgWallet && selectedInstanceWallet) {
      const fromCurrency = selectedOrgWallet.currency;
      const toCurrency = selectedInstanceWallet.currency;
      
      if (fromCurrency === toCurrency) {
        form.setValue('fx_rate', 1.0);
      } else {
        // Buscar rate configurado
        const configuredRate = fxRates?.find(rate => 
          rate.from_currency === fromCurrency && 
          rate.to_currency === toCurrency
        );
        
        if (configuredRate) {
          form.setValue('fx_rate', Number(configuredRate.rate));
        }
      }
    }
  }, [selectedOrgWallet, selectedInstanceWallet, fxRates, form]);

  // Calcular monto destino en tiempo real
  useEffect(() => {
    const amountOrigin = form.watch('amount_origin');
    const fxRate = form.watch('fx_rate');
    
    if (amountOrigin && fxRate) {
      const amountDestination = amountOrigin * fxRate;
      form.setValue('amount_destination', amountDestination);
    }
  }, [watchedValues, form]);

  const onSubmit = (data: CreateAllocationForm) => {
    allocationMutation.mutate(data);
  };

  const getCurrencyPair = () => {
    if (selectedOrgWallet && selectedInstanceWallet) {
      return `${selectedOrgWallet.currency} → ${selectedInstanceWallet.currency}`;
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Fondos con FX</DialogTitle>
          <DialogDescription>
            Transfiere fondos entre wallets con conversión de moneda automática
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="org_wallet_id"
              rules={{ required: 'Selecciona un wallet organizacional' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet origen (Organizacional)</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orgWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.currency} - {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: wallet.currency
                          }).format(Number(wallet.balance_available))}
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
              name="instance_wallet_id"
              rules={{ required: 'Selecciona un wallet de instancia' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet destino (Instancia)</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una instancia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instanceWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.instance.legal_name} ({wallet.currency}) - Balance: {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: wallet.currency
                          }).format(Number(wallet.balance_available))}
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
              name="amount_origin"
              rules={{ 
                required: 'El monto es requerido',
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                max: { 
                  value: selectedOrgWallet ? Number(selectedOrgWallet.balance_available) : 0, 
                  message: 'El monto no puede exceder el balance disponible' 
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Monto origen {selectedOrgWallet && `(${selectedOrgWallet.currency})`}
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      placeholder="0.00"
                      value={field.value ? field.value.toString() : ''}
                      onChange={(value) => field.onChange(parseFloat(value) || 0)}
                      max={selectedOrgWallet ? Number(selectedOrgWallet.balance_available) : undefined}
                    />
                  </FormControl>
                  {selectedOrgWallet && (
                    <p className="text-xs text-gray-600">
                      Disponible: {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: selectedOrgWallet.currency
                      }).format(Number(selectedOrgWallet.balance_available))}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedOrgWallet && selectedInstanceWallet && (
              <>
                <FormField
                  control={form.control}
                  name="fx_rate"
                  rules={{ 
                    required: 'El tipo de cambio es requerido',
                    min: { value: 0.000001, message: 'El tipo de cambio debe ser mayor a 0' }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tipo de cambio ({getCurrencyPair()})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="1.000000"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-600">
                        1 {selectedOrgWallet.currency} = {field.value} {selectedInstanceWallet.currency}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-gray-50 p-3 rounded-lg">
                  <FormLabel>Monto destino calculado</FormLabel>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: selectedInstanceWallet.currency
                    }).format(form.watch('amount_destination') || 0)}
                  </div>
                  <p className="text-xs text-gray-600">
                    {form.watch('amount_origin')} {selectedOrgWallet.currency} × {form.watch('fx_rate')} = {form.watch('amount_destination')} {selectedInstanceWallet.currency}
                  </p>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={allocationMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={allocationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {allocationMutation.isPending ? 'Asignando...' : 'Asignar Fondos'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
