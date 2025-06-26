
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/dashboard/KPICard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { 
  Wallet, 
  ArrowUpDown, 
  CircleDollarSign, 
  AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  // Query para obtener KPIs básicos
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      // Obtener balances totales de wallets organizacionales
      const { data: orgWallets } = await supabase
        .from('org_wallets')
        .select('balance_available, currency');

      // Obtener transacciones del día actual
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTransactions } = await supabase
        .from('transactions')
        .select('amount_brutto, commission, status, rail')
        .gte('created_at', today);

      // Obtener transacciones pendientes
      const { data: pendingTransactions } = await supabase
        .from('transactions')
        .select('amount_brutto')
        .eq('status', 'pending');

      const totalBalance = orgWallets?.reduce((sum, wallet) => sum + Number(wallet.balance_available), 0) || 0;
      const dailyPayouts = todayTransactions?.filter(t => t.status === 'completed').length || 0;
      const totalCommissions = todayTransactions?.reduce((sum, t) => sum + Number(t.commission || 0), 0) || 0;
      const pendingCount = pendingTransactions?.length || 0;
      
      const visaVolume = todayTransactions?.filter(t => t.rail === 'visa_direct').reduce((sum, t) => sum + Number(t.amount_brutto), 0) || 0;
      const mastercardVolume = todayTransactions?.filter(t => t.rail === 'mastercard_send').reduce((sum, t) => sum + Number(t.amount_brutto), 0) || 0;

      return {
        totalBalance,
        dailyPayouts,
        totalCommissions,
        pendingCount,
        visaVolume,
        mastercardVolume
      };
    }
  });

  // Query para datos del gráfico de volumen
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['volume-chart'],
    queryFn: async () => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_brutto, rail, created_at')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      // Agrupar por día y rail
      const groupedData: Record<string, { visa_direct: number; mastercard_send: number }> = {};
      
      transactions?.forEach(transaction => {
        const date = new Date(transaction.created_at).toISOString().split('T')[0];
        if (!groupedData[date]) {
          groupedData[date] = { visa_direct: 0, mastercard_send: 0 };
        }
        
        if (transaction.rail === 'visa_direct') {
          groupedData[date].visa_direct += Number(transaction.amount_brutto);
        } else if (transaction.rail === 'mastercard_send') {
          groupedData[date].mastercard_send += Number(transaction.amount_brutto);
        }
      });

      return Object.entries(groupedData).map(([date, data]) => ({
        date: new Intl.DateTimeFormat('es-MX', { 
          month: 'short', 
          day: 'numeric' 
        }).format(new Date(date)),
        ...data
      }));
    }
  });

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de operaciones y métricas clave</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Balance Total"
          value={new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
          }).format(kpis?.totalBalance || 0)}
          description="Todos los wallets"
          icon={Wallet}
          trend={{ value: 5.2, isPositive: true }}
        />
        
        <KPICard
          title="Payouts Hoy"
          value={kpis?.dailyPayouts || 0}
          description="Transacciones completadas"
          icon={ArrowUpDown}
          trend={{ value: 12.3, isPositive: true }}
        />
        
        <KPICard
          title="Comisiones"
          value={new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
          }).format(kpis?.totalCommissions || 0)}
          description="Generadas hoy"
          icon={CircleDollarSign}
          trend={{ value: 8.1, isPositive: true }}
        />
        
        <KPICard
          title="Pendientes"
          value={kpis?.pendingCount || 0}
          description="Transacciones"
          icon={AlertTriangle}
          className={kpis?.pendingCount && kpis.pendingCount > 5 ? "border-yellow-200 bg-yellow-50" : ""}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Volumen por Rail - Últimos 7 días</CardTitle>
            <CardDescription>
              Comparación entre Visa Direct y MasterCard Send
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <VolumeChart data={chartData || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Rail</CardTitle>
            <CardDescription>Volumen por plataforma hoy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Visa Direct</p>
                <p className="text-xs text-blue-600">Volumen procesado</p>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'USD'
                }).format(kpis?.visaVolume || 0)}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-900">MasterCard Send</p>
                <p className="text-xs text-red-600">Volumen procesado</p>
              </div>
              <p className="text-lg font-bold text-red-900">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'USD'
                }).format(kpis?.mastercardVolume || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
