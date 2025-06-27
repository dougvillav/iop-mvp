
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, CreditCard, ArrowRight, Clock } from 'lucide-react';
import type { Instance, Cardholder } from '@/lib/types';

interface PayoutData {
  instance?: Instance;
  cardholder?: Cardholder;
  amount_brutto?: number; // Monto que recibirá el cardholder
  rail?: 'visa_direct' | 'mastercard_send';
  commission?: number;
  tax?: number;
  processing_fee?: number;
  fx_rate?: number;
  total_debit?: number; // Total a debitar de la wallet
}

interface PayoutConfirmationProps {
  data: PayoutData;
  isLoading: boolean;
}

export const PayoutConfirmation = ({ data, isLoading }: PayoutConfirmationProps) => {
  const getRailDisplayName = (rail?: string) => {
    switch (rail) {
      case 'visa_direct':
        return 'Visa Direct';
      case 'mastercard_send':
        return 'MasterCard Send';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Confirmar Payout</h3>
        <p className="text-gray-600 text-sm">
          Revisa los detalles antes de procesar el payout
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Origen */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Desde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{data.instance?.legal_name}</p>
              <p className="text-sm text-gray-600">{data.instance?.country_iso}</p>
              <Badge variant="secondary">
                {data.instance?.settlement_currency}
              </Badge>
              {data.fx_rate !== 1.0 && (
                <p className="text-xs text-blue-600">
                  FX Rate: {data.fx_rate?.toFixed(4)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Destino */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Hacia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{data.cardholder?.full_name}</p>
              <p className="text-sm text-gray-600">{data.cardholder?.email || 'Sin email'}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  *{data.cardholder?.pan_last4}
                </Badge>
                {data.cardholder?.card_brand && (
                  <span className="text-xs text-gray-500">
                    {data.cardholder.card_brand}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalles del Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles del Payout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Rail de pago:</span>
            <Badge variant="default">
              {getRailDisplayName(data.rail)}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Monto que recibirá el cardholder:</span>
              <span className="font-medium text-green-600">
                ${(data.amount_brutto || 0).toFixed(2)}
              </span>
            </div>
            
            <div className="text-sm text-gray-700 font-medium">Costos adicionales:</div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Comisión:</span>
              <span>${(data.commission || 0).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Impuesto:</span>
              <span>${(data.tax || 0).toFixed(2)}</span>
            </div>

            {data.processing_fee && data.processing_fee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Fee de procesamiento:</span>
                <span>${data.processing_fee.toFixed(2)}</span>
              </div>
            )}

            {data.fx_rate && data.fx_rate !== 1.0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Aplicación FX Rate ({data.fx_rate.toFixed(4)}):</span>
                <span>×{data.fx_rate.toFixed(4)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-semibold">
              <span>Total a debitar de wallet:</span>
              <span className="text-red-600">${(data.total_debit || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Tiempo de procesamiento</p>
              <p className="text-blue-700">
                {data.rail === 'visa_direct' ? '1-3 minutos' : '5-15 minutos'}
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm text-gray-600">Procesando payout...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
