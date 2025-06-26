
import { useState } from 'react';
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
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import type { OrgWallet, InstanceWallet, Instance } from '@/lib/types';

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

interface AllocationForm {
  org_wallet_id: string;
  instance_wallet_id: string;
  amount: number;
}

export const AllocationModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  orgWallets,
  instanceWallets 
}: AllocationModalProps) => {
  const { toast } = useToast();
  
  const form = useForm<AllocationForm>({
    defaultValues: {
      org_wallet_id: '',
      instance_wallet_id: '',
      amount: 0
    }
  });

  const allocationMutation = useMutation({
    mutationFn: async (data: AllocationForm) => {
      // Verificar balances
      const orgWallet = orgWallets.find(w => w.id === data.org_wallet_id);
      if (!orgWallet || Number(orgWallet.balance_available) < data.amount) {
        throw new Error('Fondos insuficientes en el wallet organizacional');
      }

      // Crear la asignación en la tabla allocations
      const { error: allocationError } = await supabase
        .from('allocations')
        .insert({
          org_wallet_id: data.org_wallet_id,
          instance_wallet_id: data.instance_wallet_id,
          amount: data.amount,
          type: 'allocation'
        });

      if (allocationError) throw allocationError;

      // Actualizar balance del wallet organizacional
      const { error: orgUpdateError } = await supabase
        .from('org_wallets')
        .update({
          balance_available: Number(orgWallet.balance_available) - data.amount
        })
        .eq('id', data.org_wallet_id);

      if (orgUpdateError) throw orgUpdateError;

      // Actualizar balance del wallet de instancia
      const instanceWallet = instanceWallets.find(w => w.id === data.instance_wallet_id);
      if (instanceWallet) {
        const { error: instanceUpdateError } = await supabase
          .from('instance_wallets')
          .update({
            balance_available: Number(instanceWallet.balance_available) + data.amount
          })
          .eq('id', data.instance_wallet_id);

        if (instanceUpdateError) throw instanceUpdateError;
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Fondos asignados',
        description: 'Los fondos se han asignado correctamente a la instancia',
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

  const onSubmit = (data: AllocationForm) => {
    allocationMutation.mutate(data);
  };

  const selectedOrgWallet = orgWallets.find(w => w.id === form.watch('org_wallet_id'));
  const selectedInstanceWallet = instanceWallets.find(w => w.id === form.watch('instance_wallet_id'));

  // Filtrar wallets de instancias que coincidan con la moneda del wallet organizacional
  const compatibleInstanceWallets = instanceWallets.filter(iw => 
    selectedOrgWallet ? iw.currency === selectedOrgWallet.currency : true
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Fondos</DialogTitle>
          <DialogDescription>
            Transfiere fondos de un wallet organizacional a una instancia
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
                      {compatibleInstanceWallets.map((wallet) => (
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
              name="amount"
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
                    Monto {selectedInstanceWallet && `(${selectedInstanceWallet.currency})`}
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
