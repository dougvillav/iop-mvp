
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol } from '@/utils/constants';
import type { OrgWallet } from '@/lib/types';

interface DepositModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: OrgWallet;
}

export const DepositModal = ({ isOpen, onOpenChange, wallet }: DepositModalProps) => {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_deposit', {
        p_org_wallet_id: wallet.id,
        p_amount: parseFloat(amount),
        p_reference: reference || `Depósito ${new Date().toLocaleDateString()}`
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-ledger'] });
      toast({
        title: 'Depósito realizado',
        description: `Se ha depositado ${getCurrencySymbol(wallet.currency)}${amount} exitosamente.`,
      });
      onOpenChange(false);
      setAmount('');
      setReference('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error en el depósito',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }
    depositMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Depositar a Wallet {wallet.currency}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {getCurrencySymbol(wallet.currency)}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia</Label>
            <Textarea
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Descripción del depósito (opcional)"
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Balance actual:</strong> {getCurrencySymbol(wallet.currency)}
              {Number(wallet.balance_available).toLocaleString()}
            </p>
            {amount && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Nuevo balance:</strong> {getCurrencySymbol(wallet.currency)}
                {(Number(wallet.balance_available) + parseFloat(amount || '0')).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={depositMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={depositMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {depositMutation.isPending ? 'Procesando...' : 'Realizar Depósito'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
