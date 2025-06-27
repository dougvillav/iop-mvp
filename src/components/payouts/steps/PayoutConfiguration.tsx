
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { Instance } from '@/lib/types';

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

  const amountNum = parseFloat(amount) || 0;
  const commission = amountNum * 0.025; // 2.5% commission
  const tax = commission * 0.16; // 16% tax on commission
  const netAmount = amountNum - commission - tax;

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
            <RadioGroup value={rail} onValueChange={(value) => setRail(value as 'visa_direct' | 'mastercard_send')}>
              {railOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-gray-600">{option.description}</p>
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
              ))}
            </RadioGroup>
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
              <span>Comisión (2.5%):</span>
              <span>-${commission.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Impuesto (16%):</span>
              <span>-${tax.toFixed(2)}</span>
            </div>
            
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
