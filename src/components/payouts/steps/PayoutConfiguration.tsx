
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Instance, InstanceTariffConfig } from '@/lib/types';

interface PayoutData {
  amount?: number;
  rail?: 'visa_direct' | 'mastercard_send';
  commission?: number;
  tax?: number;
}

interface PayoutConfigurationProps {
  instance: Instance;
  data: PayoutData;
  onChange: (data: Partial<PayoutData>) => void;
}

export const PayoutConfiguration = ({ instance, data, onChange }: PayoutConfigurationProps) => {
  const [amount, setAmount] = useState(data.amount?.toString() || '');
  const [rail, setRail] = useState(data.rail || 'visa_direct');
  const [tariffConfigs, setTariffConfigs] = useState<InstanceTariffConfig[]>([]);
  const [loadingTariffs, setLoadingTariffs] = useState(false);
  const { toast } = useToast();

  const amountNum = parseFloat(amount) || 0;

  // Get current tariff configuration
  const currentTariff = tariffConfigs.find(
    config => config.transaction_type === 'pay_out' && 
              config.rail === rail && 
              config.is_active
  );

  // Calculate commission and tax based on tariff config
  const calculateCosts = () => {
    if (!currentTariff || amountNum === 0) {
      return { commission: 0, tax: 0, processingFee: 0, netAmount: amountNum };
    }

    const commissionPercentage = Number(currentTariff.commission_percentage) || 0;
    const commissionFixed = Number(currentTariff.commission_fixed) || 0;
    const taxPercentage = Number(currentTariff.tax_percentage) || 0;
    const processingFee = Number(currentTariff.processing_fee) || 0;

    const commission = (amountNum * commissionPercentage) + commissionFixed;
    const tax = commission * taxPercentage;
    const netAmount = amountNum - commission - tax - processingFee;

    return { commission, tax, processingFee, netAmount };
  };

  const { commission, tax, processingFee, netAmount } = calculateCosts();

  const loadTariffConfigs = async () => {
    setLoadingTariffs(true);
    try {
      const { data: configs, error } = await supabase
        .from('instance_tariff_configs')
        .select('*')
        .eq('instance_id', instance.id)
        .eq('is_active', true);

      if (error) throw error;
      setTariffConfigs(configs || []);
    } catch (error) {
      console.error('Error loading tariff configs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones de tarifas',
        variant: 'destructive',
      });
    } finally {
      setLoadingTariffs(false);
    }
  };

  useEffect(() => {
    loadTariffConfigs();
  }, [instance.id]);

  useEffect(() => {
    onChange({
      amount: amountNum,
      rail,
      commission,
      tax
    });
  }, [amount, rail, commission, tax, onChange]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const railOptions = [
    {
      value: 'visa_direct',
      label: 'Visa Direct',
      description: 'Rápido y confiable',
      dailyLimit: 100000,
      available: true
    },
    {
      value: 'mastercard_send',
      label: 'MasterCard Send',
      description: 'Cobertura global',
      dailyLimit: 75000,
      available: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configuración del Payout</h3>
        <p className="text-gray-600 text-sm">
          Configura los detalles del payout para {instance.legal_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Monto del Payout</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              className="text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Moneda: {instance.settlement_currency}
            </p>
          </div>

          <div>
            <Label>Selecciona el Rail de Pago</Label>
            {loadingTariffs && (
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Cargando tarifas...</span>
              </div>
            )}
            <RadioGroup value={rail} onValueChange={(value) => setRail(value as 'visa_direct' | 'mastercard_send')}>
              {railOptions.map((option) => {
                const railTariff = tariffConfigs.find(
                  config => config.transaction_type === 'pay_out' && 
                           config.rail === option.value && 
                           config.is_active
                );
                
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-gray-600">{option.description}</p>
                          {railTariff && (
                            <p className="text-xs text-blue-600 mt-1">
                              Comisión: {(Number(railTariff.commission_percentage) * 100).toFixed(2)}% + ${Number(railTariff.commission_fixed).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={option.available ? "default" : "secondary"}>
                            {option.available ? "Disponible" : "No disponible"}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Límite: ${option.dailyLimit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            {!loadingTariffs && tariffConfigs.length === 0 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg mt-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Sin Configuración de Tarifas</p>
                  <p className="text-amber-700">
                    No hay tarifas configuradas para esta instancia. Se aplicarán tarifas por defecto.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Costos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Monto bruto:</span>
              <span className="font-medium">
                {amountNum ? `$${amountNum.toFixed(2)}` : '$0.00'}
              </span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Comisión {currentTariff ? `(${(Number(currentTariff.commission_percentage) * 100).toFixed(2)}% + $${Number(currentTariff.commission_fixed).toFixed(2)})` : ''}:
              </span>
              <span>-${commission.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Impuesto {currentTariff ? `(${(Number(currentTariff.tax_percentage) * 100).toFixed(2)}%)` : ''}:
              </span>
              <span>-${tax.toFixed(2)}</span>
            </div>

            {processingFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Fee de procesamiento:</span>
                <span>-${processingFee.toFixed(2)}</span>
              </div>
            )}
            
            <hr />
            
            <div className="flex justify-between font-semibold">
              <span>Monto neto:</span>
              <span className="text-green-600">${netAmount.toFixed(2)}</span>
            </div>

            {amountNum > 10000 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Monto Alto</p>
                  <p className="text-amber-700">
                    Este payout requerirá aprobación adicional
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
