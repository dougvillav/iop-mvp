
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

// Enhanced validation functions for security
const validateAmount = (amount: number, maxAmount?: number): string | undefined => {
  if (amount <= 0) return 'Amount must be greater than 0';
  if (amount > 10000000) return 'Amount cannot exceed 10,000,000';
  if (maxAmount && amount > maxAmount) return `Amount cannot exceed available balance of ${maxAmount}`;
  if (isNaN(amount) || !isFinite(amount)) return 'Amount must be a valid number';
  return undefined;
};

const validateFxRate = (rate: number): string | undefined => {
  if (rate <= 0) return 'Exchange rate must be greater than 0';
  if (rate > 1000000) return 'Exchange rate cannot exceed 1,000,000';
  if (isNaN(rate) || !isFinite(rate)) return 'Exchange rate must be a valid number';
  return undefined;
};

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
      // Enhanced client-side validation
      const selectedOrgWallet = orgWallets.find(w => w.id === data.org_wallet_id);
      if (!selectedOrgWallet) {
        throw new Error('Please select a valid organization wallet');
      }

      const selectedInstanceWallet = instanceWallets.find(w => w.id === data.instance_wallet_id);
      if (!selectedInstanceWallet) {
        throw new Error('Please select a valid instance wallet');
      }

      const amountError = validateAmount(data.amount_origin, Number(selectedOrgWallet.balance_available));
      if (amountError) throw new Error(amountError);

      const fxRateError = validateFxRate(data.fx_rate);
      if (fxRateError) throw new Error(fxRateError);

      // Sanitize and round values for financial precision
      const sanitizedData = {
        ...data,
        amount_origin: Number(parseFloat(data.amount_origin.toString()).toFixed(2)),
        fx_rate: Number(parseFloat(data.fx_rate.toString()).toFixed(6))
      };

      const { data: result, error } = await supabase.rpc('create_allocation', {
        p_org_wallet_id: sanitizedData.org_wallet_id,
        p_instance_wallet_id: sanitizedData.instance_wallet_id,
        p_amount_origin: sanitizedData.amount_origin,
        p_fx_rate: sanitizedData.fx_rate
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Funds allocated successfully',
        description: 'Funds have been allocated with FX conversion applied',
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('Allocation error:', error);
      toast({
        title: 'Error allocating funds',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  });

  const selectedOrgWallet = orgWallets.find(w => w.id === form.watch('org_wallet_id'));
  const selectedInstanceWallet = instanceWallets.find(w => w.id === form.watch('instance_wallet_id'));

  // Calculate FX rate with proper validation
  useEffect(() => {
    if (selectedOrgWallet && selectedInstanceWallet) {
      const fromCurrency = selectedOrgWallet.currency;
      const toCurrency = selectedInstanceWallet.currency;
      
      if (fromCurrency === toCurrency) {
        form.setValue('fx_rate', 1.0);
      } else {
        const configuredRate = fxRates?.find(rate => 
          rate.from_currency === fromCurrency && 
          rate.to_currency === toCurrency &&
          rate.is_active
        );
        
        if (configuredRate) {
          form.setValue('fx_rate', Number(configuredRate.rate));
        } else {
          // Reset to 1.0 if no configured rate found
          form.setValue('fx_rate', 1.0);
        }
      }
    }
  }, [selectedOrgWallet, selectedInstanceWallet, fxRates, form]);

  // Calculate destination amount with proper rounding
  useEffect(() => {
    const amountOrigin = form.watch('amount_origin');
    const fxRate = form.watch('fx_rate');
    
    if (amountOrigin && fxRate && amountOrigin > 0 && fxRate > 0) {
      const amountDestination = Math.round(amountOrigin * fxRate * 100) / 100; // Round to 2 decimal places
      form.setValue('amount_destination', amountDestination);
    } else {
      form.setValue('amount_destination', 0);
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

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Allocate Funds with FX</DialogTitle>
          <DialogDescription>
            Transfer funds between wallets with automatic currency conversion
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="org_wallet_id"
              rules={{ required: 'Please select an organization wallet' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Wallet (Organization)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orgWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.currency} - {new Intl.NumberFormat('en-US', {
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
              rules={{ required: 'Please select an instance wallet' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Wallet (Instance)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instanceWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.instance.legal_name} ({wallet.currency}) - Balance: {new Intl.NumberFormat('en-US', {
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
                required: 'Amount is required',
                validate: (value) => validateAmount(value, selectedOrgWallet ? Number(selectedOrgWallet.balance_available) : undefined)
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Source Amount {selectedOrgWallet && `(${selectedOrgWallet.currency})`}
                  </FormLabel>
                  <FormControl>
                    <AmountInput
                      placeholder="0.00"
                      value={field.value ? field.value.toString() : ''}
                      onChange={(value) => {
                        const numValue = parseFloat(value) || 0;
                        field.onChange(numValue);
                      }}
                      max={selectedOrgWallet ? Number(selectedOrgWallet.balance_available) : undefined}
                    />
                  </FormControl>
                  {selectedOrgWallet && (
                    <p className="text-xs text-gray-600">
                      Available: {new Intl.NumberFormat('en-US', {
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
                    required: 'Exchange rate is required',
                    validate: validateFxRate
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Exchange Rate ({getCurrencyPair()})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          max="1000000"
                          placeholder="1.000000"
                          value={field.value}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 1 : value);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-600">
                        1 {selectedOrgWallet.currency} = {Number(field.value).toFixed(6)} {selectedInstanceWallet.currency}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-gray-50 p-3 rounded-lg">
                  <FormLabel>Calculated Destination Amount</FormLabel>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: selectedInstanceWallet.currency
                    }).format(form.watch('amount_destination') || 0)}
                  </div>
                  <p className="text-xs text-gray-600">
                    {form.watch('amount_origin')} {selectedOrgWallet.currency} × {Number(form.watch('fx_rate')).toFixed(6)} = {Number(form.watch('amount_destination')).toFixed(2)} {selectedInstanceWallet.currency}
                  </p>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={allocationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={allocationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {allocationMutation.isPending ? 'Allocating...' : 'Allocate Funds'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
