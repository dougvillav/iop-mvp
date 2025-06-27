
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
import { getCurrencySymbol } from '@/utils/constants';
import type { OrgWallet } from '@/lib/types';

export interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallets: OrgWallet[];
}

const depositSchema = z.object({
  org_wallet_id: z.string().min(1, 'Wallet es requerido'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  reference: z.string().min(1, 'Referencia es requerida'),
});

type DepositFormData = z.infer<typeof depositSchema>;

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  wallets,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [amountValue, setAmountValue] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
  });

  const selectedWalletId = watch('org_wallet_id');
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountValue(value);
    setValue('amount', value === '' ? 0 : Number(value));
  };

  const onSubmit = async (data: DepositFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('create_deposit', {
        p_org_wallet_id: data.org_wallet_id,
        p_amount: data.amount,
        p_reference: data.reference,
      });

      if (error) throw error;

      toast({
        title: 'Depósito creado',
        description: `Depósito de ${getCurrencySymbol(selectedWallet?.currency || '')}${data.amount.toLocaleString()} creado correctamente`,
      });

      onSuccess();
      onClose();
      reset();
      setAmountValue('');
    } catch (error) {
      toast({
        title: 'Error al crear depósito',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
    setAmountValue('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Depósito</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org_wallet_id">Wallet Organizacional</Label>
            <Select
              value={selectedWalletId}
              onValueChange={(value) => setValue('org_wallet_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.currency} - Balance: {getCurrencySymbol(wallet.currency)}{wallet.balance_available?.toLocaleString() || '0'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.org_wallet_id && (
              <p className="text-sm text-red-600">{errors.org_wallet_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Monto {selectedWallet && `(${getCurrencySymbol(selectedWallet.currency)})`}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amountValue}
              onChange={handleAmountChange}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia</Label>
            <Input
              id="reference"
              {...register('reference')}
              placeholder="Referencia del depósito"
            />
            {errors.reference && (
              <p className="text-sm text-red-600">{errors.reference.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Depósito'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
