
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';
import type { WalletLedger } from '@/lib/types';

interface WalletHistoryProps {
  walletId: string;
  walletType: 'org' | 'instance';
}

export const WalletHistory = ({ walletId, walletType }: WalletHistoryProps) => {
  const { data: ledgerEntries, isLoading } = useQuery({
    queryKey: ['wallet-ledger', walletId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_ledger')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('wallet_type', walletType)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as WalletLedger[];
    }
  });

  const getEntryIcon = (entryType: string) => {
    switch (entryType) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'allocation_in':
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      case 'allocation_out':
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
      case 'payout':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntryColor = (entryType: string) => {
    switch (entryType) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'allocation_in':
        return 'bg-blue-100 text-blue-800';
      case 'allocation_out':
        return 'bg-orange-100 text-orange-800';
      case 'payout':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntryLabel = (entryType: string) => {
    switch (entryType) {
      case 'deposit':
        return 'Depósito';
      case 'allocation_in':
        return 'Asignación recibida';
      case 'allocation_out':
        return 'Asignación enviada';
      case 'payout':
        return 'Payout';
      case 'refund':
        return 'Reembolso';
      default:
        return entryType;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transacciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {!ledgerEntries?.length ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay transacciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ledgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getEntryIcon(entry.entry_type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">
                          {getEntryLabel(entry.entry_type)}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={getEntryColor(entry.entry_type)}
                        >
                          {entry.entry_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.created_at!).toLocaleString('es-MX')}
                      </p>
                      {entry.reference && (
                        <p className="text-xs text-gray-600">{entry.reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        Number(entry.amount) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {Number(entry.amount) > 0 ? '+' : ''}
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'USD' // Podríamos hacer esto dinámico
                      }).format(Number(entry.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(Number(entry.balance_after))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
