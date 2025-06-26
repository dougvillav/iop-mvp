
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const RecentPayouts = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['recent-payouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          cardholder:cardholders(*),
          instance:instances(*),
          instance_wallet:instance_wallets(*)
        `)
        .eq('type', 'pay_out')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      default:
        return 'Desconocido';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay payouts recientes</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cardholder</TableHead>
          <TableHead>Instancia</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Rail</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div>
                <p className="font-medium">{transaction.cardholder?.full_name}</p>
                <p className="text-sm text-gray-600">
                  *{transaction.cardholder?.pan_last4}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm">{transaction.instance?.legal_name}</p>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">
                  ${Number(transaction.amount_brutto).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Neto: ${Number(transaction.amount_net).toFixed(2)}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {transaction.rail === 'visa_direct' ? 'Visa Direct' : 'MasterCard Send'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(transaction.status)}>
                {getStatusText(transaction.status)}
              </Badge>
            </TableCell>
            <TableCell>
              <p className="text-sm">
                {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
