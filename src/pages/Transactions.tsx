
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { KPICard } from '@/components/dashboard/KPICard';
import { startTransactionSimulation } from '@/utils/mockTransactionStatus';
import type { TransactionWithDetails } from '@/lib/types';

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilters, setDateFilters] = useState<{
    dateFrom?: Date;
    dateTo?: Date;
  }>({});

  // Iniciar simulación de transacciones al montar el componente
  useEffect(() => {
    const stopSimulation = startTransactionSimulation();
    return stopSimulation;
  }, []);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', searchTerm, dateFilters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          cardholder:cardholders(*),
          instance:instances(*),
          instance_wallet:instance_wallets(*)
        `);
      
      if (searchTerm) {
        query = query.or(`external_reference.ilike.%${searchTerm}%,cardholder.full_name.ilike.%${searchTerm}%`);
      }

      if (dateFilters.dateFrom) {
        query = query.gte('created_at', dateFilters.dateFrom.toISOString());
      }

      if (dateFilters.dateTo) {
        query = query.lte('created_at', dateFilters.dateTo.toISOString());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TransactionWithDetails[];
    }
  });

  const filteredTransactions = transactions?.filter(transaction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pay_in') return transaction.type === 'pay_in';
    if (activeTab === 'pay_out') return transaction.type === 'pay_out';
    if (activeTab === 'pending') return transaction.status === 'pending';
    if (activeTab === 'completed') return transaction.status === 'completed';
    if (activeTab === 'failed') return transaction.status === 'failed';
    return true;
  });

  const handleFiltersChange = (filters: {
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  }) => {
    if (filters.searchTerm !== undefined) {
      setSearchTerm(filters.searchTerm);
    }
    setDateFilters({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
  };

  const getTotalsByType = () => {
    if (!transactions) return { payIn: 0, payOut: 0, pending: 0, completed: 0 };
    
    return transactions.reduce((acc, transaction) => {
      if (transaction.type === 'pay_in') acc.payIn += transaction.amount_brutto;
      if (transaction.type === 'pay_out') acc.payOut += transaction.amount_brutto;
      if (transaction.status === 'pending') acc.pending += transaction.amount_brutto;
      if (transaction.status === 'completed') acc.completed += transaction.amount_brutto;
      return acc;
    }, { payIn: 0, payOut: 0, pending: 0, completed: 0 });
  };

  const totals = getTotalsByType();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transacciones</h1>
          <p className="text-gray-600 mt-2">
            Historial completo de transacciones y payouts
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Pay In"
          value={`$${totals.payIn.toLocaleString()}`}
          icon={ArrowDown}
          borderColor="border-l-green-500"
        />
        
        <KPICard
          title="Pay Out"
          value={`$${totals.payOut.toLocaleString()}`}
          icon={ArrowUp}
          borderColor="border-l-red-500"
        />
        
        <KPICard
          title="Pendientes"
          value={`$${totals.pending.toLocaleString()}`}
          icon={ArrowUpDown}
          borderColor="border-l-yellow-500"
        />
        
        <KPICard
          title="Completadas"
          value={`$${totals.completed.toLocaleString()}`}
          icon={ArrowUpDown}
          borderColor="border-l-blue-500"
        />
      </div>

      {/* Filters */}
      <TransactionFilters
        onFiltersChange={handleFiltersChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
        <div>
          <h2 className="text-xl font-semibold">Historial de Transacciones</h2>
          <p className="text-gray-600">
            {filteredTransactions?.length || 0} transacción{filteredTransactions?.length !== 1 ? 'es' : ''} encontrada{filteredTransactions?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pay_in">Pay In</TabsTrigger>
          <TabsTrigger value="pay_out">Pay Out</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="failed">Fallidas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {!filteredTransactions?.length ? (
            <div className="text-center py-12">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay transacciones
              </h3>
              <p className="text-gray-600">
                Las transacciones aparecerán aquí cuando se procesen
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Transactions;
