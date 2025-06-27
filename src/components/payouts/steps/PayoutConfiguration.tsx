
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
  amount_brutto?: number; // Monto que recibirá el cardholder
  rail?: 'visa_direct' | 'mastercard_send';
  commission?: number;
  tax?: number;
  processing_fee?: number;
  fx_rate?: number;
  total_debit?: number; // Total a debitar de la wallet
}

interface PayoutConfigurationProps {
  instance: Instance;
  data: PayoutData;
  onChange: (data: Partial<PayoutData>) => void;
}

export const PayoutConfiguration = ({ instance, data, onChange }: PayoutConfigurationProps) => {
  const [amount, setAmount] = useState(data.amount_brutto?.toString() || '');
  const [rail, setRail] = useState(data.rail || 'visa_direct');
  const [tariffConfigs, setTariffConfigs] = useState<InstanceTariffConfig[]>([]);
  const [loadingTariffs, setLoadingTariffs] = useState(false);
  const { toast } = useToast();

  const amountBrutto = parseFloat(amount) || 0;
  const fxRate = instance.fx_rate || 1.0;

  // Get current tariff configuration
  const currentTariff = tariffConfigs.find(
    config => config.transaction_type === 'pay_out' && 
              config.rail === rail && 
              config.is_active
  );

  // Calculate costs and total debit based on corrected logic
  const calculateCosts = () => {
    if (!currentTariff || amountBrutto === 0) {
      return { 
        commission: 0, 
        tax: 0, 
        processingFee: 0, 
        totalBeforeFx: amountBrutto,
        totalDebit: amountBrutto * fxRate 
      };
    }

    const commissionPercentage = Number(currentTariff.commission_percentage) || 0;
    const commissionFixed = Number(currentTariff.commission_fixed) || 0;
    const taxPercentage = Number(currentTariff.tax_percentage) || 0;
    const processingFee = Number(currentTariff.processing_fee) || 0;

    // Calcular comisión sobre el monto bruto
    const commission = (amountBrutto * commissionPercentage) + commissionFixed;
    // Calcular impuesto sobre la comisión
    const tax = commission * taxPercentage;
    
    // Total antes del FX rate = monto bruto + comisión + impuesto + processing fee
    const totalBeforeFx = amountBrutto + commission + tax + processingFee;
    
    // Total a debitar de la wallet = total antes del FX * FX rate
    const totalDebit = totalBeforeFx * fxRate;

    return { commission, tax, processingFee, totalBeforeFx, totalDebit };
  };

  const { commission, tax, processingFee, totalBeforeFx, totalDebit } = calculateCosts();

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
      amount_brutto: amountBrutto,
      rail,
      commission,
      tax,
      processing_fee: processingFee,
      fx_rate: fxRate,
      total_debit: totalDebit
    });
  }, [amount, rail, commission, tax, processingFee, fxRate, totalDebit, onChange]);

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
            <Label htmlFor="amount">Monto que recibirá el cardholder</Label>
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
              {fxRate !== 1.0 && (
                <span className="ml-2 text-blue-600">
                  FX Rate: {fxRate.toFixed(4)}
                </span>
              )}
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
              <span>Monto a recibir (bruto):</span>
              <span className="font-medium text-green-600">
                {amountBrutto ? `$${amountBrutto.toFixed(2)}` : '$0.00'}
              </span>
            </div>
            
            <hr className="my-2" />
            
            <div className="text-sm text-gray-700 font-medium mb-2">Costos adicionales:</div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Comisión {currentTariff ? `(${(Number(currentTariff.commission_percentage) * 100).toFixed(2)}% + $${Number(currentTariff.commission_fixed).toFixed(2)})` : ''}:
              </span>
              <span>${commission.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Impuesto {currentTariff ? `(${(Number(currentTariff.tax_percentage) * 100).toFixed(2)}%)` : ''}:
              </span>
              <span>${tax.toFixed(2)}</span>
            </div>

            {processingFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Fee de procesamiento:</span>
                <span>${processingFee.toFixed(2)}</span>
              </div>
            )}

            {fxRate !== 1.0 && (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({instance.settlement_currency}):</span>
                  <span>${totalBeforeFx.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>FX Rate ({fxRate.toFixed(4)}):</span>
                  <span>×{fxRate.toFixed(4)}</span>
                </div>
              </>
            )}
            
            <hr />
            
            <div className="flex justify-between font-semibold">
              <span>Total a debitar de wallet:</span>
              <span className="text-red-600">${totalDebit.toFixed(2)}</span>
            </div>

            {amountBrutto > 10000 && (
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
