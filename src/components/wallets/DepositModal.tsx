
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
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import type { OrgWallet } from '@/lib/types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallets: OrgWallet[];
  selectedWallet?: OrgWallet | null;
}

interface DepositForm {
  org_wallet_id: string;
  amount: number;
  reference: string;
}

export const DepositModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  wallets,
  selectedWallet 
}: DepositModalProps) => {
  const { toast } = useToast();
  
  const form = useForm<DepositForm>({
    defaultValues: {
      org_wallet_id: selectedWallet?.id || '',
      amount: 0,
      reference: ''
    }
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      const { data: result, error } = await supabase.rpc('create_deposit', {
        p_org_wallet_id: data.org_wallet_id,
        p_amount: data.amount,
        p_reference: data.reference
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Depósito registrado',
        description: 'El depósito se ha procesado correctamente',
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error al procesar depósito',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: DepositForm) => {
    depositMutation.mutate(data);
  };

  const selectedWalletData = wallets.find(w => w.id === form.watch('org_wallet_id'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Depósito</DialogTitle>
          <DialogDescription>
            Añade fondos a un wallet organizacional
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="org_wallet_id"
              rules={{ required: 'Selecciona un wallet' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet de destino</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={selectedWallet?.id}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
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
              name="amount"
              rules={{ 
                required: 'El monto es requerido',
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Monto {selectedWalletData && `(${selectedWalletData.currency})`}
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      placeholder="0.00"
                      value={field.value ? field.value.toString() : ''}
                      onChange={(value) => field.onChange(parseFloat(value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              rules={{ required: 'La referencia es requerida' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Depósito inicial, Transferencia bancaria..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={depositMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={depositMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {depositMutation.isPending ? 'Procesando...' : 'Registrar Depósito'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
