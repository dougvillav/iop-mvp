
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

// Enhanced validation functions for security
const validateRate = (rate: number): string | undefined => {
  if (rate < 0.000001) return 'Rate must be at least 0.000001';
  if (rate > 1000000) return 'Rate cannot exceed 1,000,000';
  if (isNaN(rate) || !isFinite(rate)) return 'Rate must be a valid number';
  return undefined;
};

const validateCurrency = (currency: string): string | undefined => {
  if (!currency || currency.length !== 3) return 'Currency must be 3 characters';
  if (currency !== currency.toUpperCase()) return 'Currency must be uppercase';
  if (!/^[A-Z]{3}$/.test(currency)) return 'Currency must contain only letters';
  return undefined;
};

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
      // Client-side validation before sending to server
      const rateError = validateRate(data.rate);
      if (rateError) throw new Error(rateError);

      const fromCurrencyError = validateCurrency(data.from_currency);
      if (fromCurrencyError) throw new Error(`From currency: ${fromCurrencyError}`);

      const toCurrencyError = validateCurrency(data.to_currency);
      if (toCurrencyError) throw new Error(`To currency: ${toCurrencyError}`);

      if (data.from_currency === data.to_currency) {
        throw new Error('From and to currencies must be different');
      }

      // Sanitize inputs
      const sanitizedData = {
        ...data,
        from_currency: data.from_currency.toUpperCase().trim(),
        to_currency: data.to_currency.toUpperCase().trim(),
        rate: Number(parseFloat(data.rate.toString()).toFixed(6)) // Ensure proper precision
      };

      if (editingRate) {
        const { error } = await supabase
          .from('org_fx_rates')
          .update({
            rate: sanitizedData.rate,
            is_active: sanitizedData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRate.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('org_fx_rates')
          .insert({
            from_currency: sanitizedData.from_currency,
            to_currency: sanitizedData.to_currency,
            rate: sanitizedData.rate,
            is_active: sanitizedData.is_active,
            organization_id: '00000000-0000-0000-0000-000000000001' // TODO: Get from user context
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingRate ? 'Rate updated' : 'Rate created',
        description: `Exchange rate has been ${editingRate ? 'updated' : 'created'} successfully`,
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('FX Rate save error:', error);
      toast({
        title: 'Error saving rate',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: FxRateForm) => {
    saveMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingRate ? 'Edit Exchange Rate' : 'New Exchange Rate'}
          </DialogTitle>
          <DialogDescription>
            {editingRate 
              ? 'Update the exchange rate configuration'
              : 'Configure a new exchange rate for currency conversion'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="from_currency"
              rules={{ 
                required: 'From currency is required',
                validate: validateCurrency
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Currency</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!editingRate}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source currency" />
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
              rules={{ 
                required: 'To currency is required',
                validate: validateCurrency
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Currency</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!editingRate}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target currency" />
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
                required: 'Exchange rate is required',
                validate: validateRate
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate</FormLabel>
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
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  {form.watch('from_currency') && form.watch('to_currency') && (
                    <p className="text-xs text-gray-600">
                      1 {form.watch('from_currency')} = {Number(field.value).toFixed(6)} {form.watch('to_currency')}
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
                    <FormLabel>Active</FormLabel>
                    <div className="text-sm text-gray-600">
                      Exchange rate will be available for fund allocations
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
                onClick={handleClose}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saveMutation.isPending 
                  ? (editingRate ? 'Updating...' : 'Creating...') 
                  : (editingRate ? 'Update' : 'Create')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
