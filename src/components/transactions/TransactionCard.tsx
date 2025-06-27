
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, CreditCard, Building2 } from 'lucide-react';
import type { TransactionWithDetails } from '@/lib/types';

interface TransactionCardProps {
  transaction: TransactionWithDetails;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallida';
      case 'disputed':
        return 'Disputada';
      default:
        return 'Desconocido';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'pay_in' ? 'text-green-600' : 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    return type === 'pay_in' ? ArrowDown : ArrowUp;
  };

  const TypeIcon = getTypeIcon(transaction.type);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full bg-gray-100`}>
              <TypeIcon className={`h-5 w-5 ${getTypeColor(transaction.type)}`} />
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">
                  {transaction.type === 'pay_in' ? 'Pay In' : 'Payout'}
                </h3>
                <Badge className={getStatusColor(transaction.status || 'pending')}>
                  {getStatusText(transaction.status || 'pending')}
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Building2 className="h-4 w-4 mr-1" />
                {transaction.instance?.legal_name}
                {transaction.cardholder && (
                  <>
                    <span className="mx-2">→</span>
                    <CreditCard className="h-4 w-4 mr-1" />
                    {transaction.cardholder.full_name}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
              {transaction.type === 'pay_in' ? '+' : ''}${transaction.amount_brutto.toLocaleString()}
            </div>
            
            <div className="text-sm text-gray-500">
              Total a debitar: ${transaction.amount_net.toLocaleString()}
            </div>
            
            {transaction.commission > 0 && (
              <div className="text-xs text-gray-500">
                Comisión: ${transaction.commission.toLocaleString()}
              </div>
            )}
            
            {transaction.tax > 0 && (
              <div className="text-xs text-gray-500">
                Impuesto: ${transaction.tax.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              {transaction.rail && (
                <span className="text-gray-600">
                  <span className="font-medium">Rail:</span> {transaction.rail}
                </span>
              )}
              
              {transaction.external_reference && (
                <span className="text-gray-600">
                  <span className="font-medium">Ref:</span> {transaction.external_reference}
                </span>
              )}
            </div>
            
            <span className="text-gray-500">
              {new Date(transaction.created_at || '').toLocaleString('es-MX')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
