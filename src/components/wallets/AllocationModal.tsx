
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import type { OrgWallet, InstanceWallet, Instance } from '@/lib/types';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourceWallet: OrgWallet | null;
  instanceWallets: (InstanceWallet & { instance: Instance })[];
}

interface AllocationForm {
  instance_wallet_id: string;
  amount: number;
}

export const AllocationModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  sourceWallet,
  instanceWallets 
}: AllocationModalProps) => {
  const { toast } = useToast();
  
  const form = useForm<AllocationForm>({
    defaultValues: {
      instance_wallet_id: '',
      amount: 0
    }
  });

  // Filtrar wallets de instancia que coincidan con la moneda del wallet fuente
  const compatibleWallets = instanceWallets.filter(
    wallet => wallet.currency === sourceWallet?.currency
  );

  const allocationMutation = useMutation({
    mutationFn: async (data: AllocationForm) => {
      if (!sourceWallet) throw new Error('No source wallet selected');
      
      // Crear allocation
      const { error: allocationError } = await supabase
        .from('allocations')
        .insert({
          org_wallet_id: sourceWallet.id,
          instance_wallet_id: data.instance_wallet_id,
          amount: data.amount,
          type: 'allocation'
        });
      
      if (allocationError) throw allocationError;

      // Actualizar balance del wallet organizacional
      const { error: orgUpdateError } = await supabase
        .from('org_wallets')
        .update({
          balance_available: Number(sourceWallet.balance_available) - data.amount
        })
        .eq('id', sourceWallet.id);
      
      if (orgUpdateError) throw orgUpdateError;

      // Actualizar balance del wallet de instancia
      const targetWallet = instanceWallets.find(w => w.id === data.instance_wallet_id);
      if (targetWallet) {
        const { error: instanceUpdateError } = await supabase
          .from('instance_wallets')
          .update({
            balance_available: Number(targetWallet.balance_available) + data.amount
          })
          .eq('id', data.instance_wallet_id);
        
        if (instanceUpdateError) throw instanceUpdateError;
      }

      // Crear entradas en el ledger
      const { error: ledgerError1 } = await supabase
        .from('wallet_ledger')
        .insert({
          wallet_id: sourceWallet.id,
          wallet_type: 'org',
          entry_type: 'allocation_out',
          amount: -data.amount,
          balance_after: Number(sourceWallet.balance_available) - data.amount,
          reference: `Asignación a instancia`
        });

      if (ledgerError1) throw ledgerError1;

      if (targetWallet) {
        const { error: ledgerError2 } = await supabase
          .from('wallet_ledger')
          .insert({
            wallet_id: targetWallet.id,
            wallet_type: 'instance',
            entry_type: 'allocation_in',
            amount: data.amount,
            balance_after: Number(targetWallet.balance_available) + data.amount,
            reference: `Recibido de wallet organizacional`
          });

        if (ledgerError2) throw ledgerError2;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Asignación completada',
        description: 'Los fondos se han asignado correctamente',
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error en la asignación',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: AllocationForm) => {
    const amount = data.amount;
    const availableBalance = Number(sourceWallet?.balance_available || 0);
    
    if (amount > availableBalance) {
      toast({
        title: 'Saldo insuficiente',
        description: `Solo tienes ${new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: sourceWallet?.currency || 'USD'
        }).format(availableBalance)} disponible`,
        variant: 'destructive',
      });
      return;
    }

    allocationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Fondos</DialogTitle>
          <DialogDescription>
            Transfiere fondos del wallet organizacional a una instancia
          </DialogDescription>
        </DialogHeader>

        {sourceWallet && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Wallet origen:</p>
            <p className="text-lg font-bold text-blue-900">
              {sourceWallet.currency} - {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: sourceWallet.currency
              }).format(Number(sourceWallet.balance_available))}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="instance_wallet_id"
              rules={{ required: 'Selecciona un wallet de destino' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet de destino</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una instancia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {compatibleWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.instance.legal_name} ({wallet.instance.country_iso}) - {
                            new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: wallet.currency
                            }).format(Number(wallet.balance_available))
                          }
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
                  value: Number(sourceWallet?.balance_available || 0), 
                  message: 'El monto excede el saldo disponible' 
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Monto {sourceWallet && `(${sourceWallet.currency})`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={Number(sourceWallet?.balance_available || 0)}
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Máximo disponible: {sourceWallet && new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: sourceWallet.currency
                    }).format(Number(sourceWallet.balance_available))}
                  </p>
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
                {allocationMutation.isPending ? 'Procesando...' : 'Asignar Fondos'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
