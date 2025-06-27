
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/dashboard/KPICard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { RecentPayouts } from '@/components/payouts/RecentPayouts';
import { Wallet, TrendingUp, DollarSign, Clock } from 'lucide-react';

const Dashboard = () => {
  // Consulta para obtener datos reales del dashboard
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      // Obtener balance total de wallets organizacionales
      const { data: orgWallets } = await supabase
        .from('org_wallets')
        .select('balance_available');

      // Obtener balance total de wallets de instancias
      const { data: instanceWallets } = await supabase
        .from('instance_wallets')
        .select('balance_available');

      // Obtener payouts del día actual
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      const { data: todayPayouts } = await supabase
        .from('transactions')
        .select('id, amount_brutto')
        .eq('type', 'pay_out')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Obtener payouts del mes anterior para comparación
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate());
      const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate(), 23, 59, 59, 999);
      
      const { data: lastMonthPayouts } = await supabase
        .from('transactions')
        .select('id')
        .eq('type', 'pay_out')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      // Obtener comisiones totales
      const { data: commissions } = await supabase
        .from('transactions')
        .select('commission')
        .not('commission', 'is', null);

      // Obtener comisiones del mes anterior
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: lastMonthCommissions } = await supabase
        .from('transactions')
        .select('commission')
        .not('commission', 'is', null)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Obtener transacciones pendientes
      const { data: pendingTransactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('status', 'pending');

      // Obtener pendientes del mes anterior
      const { data: lastMonthPending } = await supabase
        .from('transactions')
        .select('id')
        .eq('status', 'pending')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const totalOrgBalance = orgWallets?.reduce((sum, wallet) => 
        sum + Number(wallet.balance_available), 0) || 0;
      
      const totalInstanceBalance = instanceWallets?.reduce((sum, wallet) => 
        sum + Number(wallet.balance_available), 0) || 0;

      const totalBalance = totalOrgBalance + totalInstanceBalance;
      const dailyPayouts = todayPayouts?.length || 0;
      const lastMonthPayoutsCount = lastMonthPayouts?.length || 0;
      const totalCommissions = commissions?.reduce((sum, t) => 
        sum + Number(t.commission), 0) || 0;
      const lastMonthCommissionsTotal = lastMonthCommissions?.reduce((sum, t) => 
        sum + Number(t.commission), 0) || 0;
      const pendingCount = pendingTransactions?.length || 0;
      const lastMonthPendingCount = lastMonthPending?.length || 0;

      // Calcular trends reales
      const payoutsTrend = lastMonthPayoutsCount > 0 
        ? ((dailyPayouts - lastMonthPayoutsCount) / lastMonthPayoutsCount) * 100 
        : 0;
      
      const commissionsTrend = lastMonthCommissionsTotal > 0 
        ? ((totalCommissions - lastMonthCommissionsTotal) / lastMonthCommissionsTotal) * 100 
        : 0;
      
      const pendingTrend = lastMonthPendingCount > 0 
        ? ((pendingCount - lastMonthPendingCount) / lastMonthPendingCount) * 100 
        : 0;

      return {
        totalBalance,
        dailyPayouts,
        totalCommissions,
        pendingCount,
        payoutsTrend,
        commissionsTrend,
        pendingTrend
      };
    }
  });

  // Consulta para obtener datos del gráfico de volumen
  const { data: volumeData } = useQuery({
    queryKey: ['volume-chart'],
    queryFn: async () => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('created_at, amount_brutto, rail')
        .eq('type', 'pay_out')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      // Agrupar por mes y rail
      const monthlyData: Record<string, { visa_direct: number; mastercard_send: number }> = {};

      transactions?.forEach(transaction => {
        const month = new Date(transaction.created_at || '').toISOString().substring(0, 7);
        const amount = Number(transaction.amount_brutto) || 0;
        
        if (!monthlyData[month]) {
          monthlyData[month] = { visa_direct: 0, mastercard_send: 0 };
        }

        if (transaction.rail === 'visa_direct') {
          monthlyData[month].visa_direct += amount;
        } else if (transaction.rail === 'mastercard_send') {
          monthlyData[month].mastercard_send += amount;
        }
      });

      return Object.entries(monthlyData).map(([date, volumes]) => ({
        date,
        ...volumes
      })).slice(-6); // Últimos 6 meses
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Resumen general de tu plataforma de payouts
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Balance Total"
          value={`$${dashboardData?.totalBalance.toLocaleString() || '0'}`}
          trend={{
            value: 12.5,
            isPositive: true
          }}
          icon={Wallet}
          borderColor="border-l-blue-500"
        />
        <KPICard
          title="Payouts Hoy"
          value={dashboardData?.dailyPayouts.toString() || '0'}
          trend={{
            value: Math.round(dashboardData?.payoutsTrend || 0),
            isPositive: (dashboardData?.payoutsTrend || 0) >= 0
          }}
          icon={TrendingUp}
          borderColor="border-l-green-500"
        />
        <KPICard
          title="Comisiones"
          value={`$${dashboardData?.totalCommissions.toLocaleString() || '0'}`}
          trend={{
            value: Math.round(dashboardData?.commissionsTrend || 0),
            isPositive: (dashboardData?.commissionsTrend || 0) >= 0
          }}
          icon={DollarSign}
          borderColor="border-l-yellow-500"
        />
        <KPICard
          title="Transacciones Pendientes"
          value={dashboardData?.pendingCount.toString() || '0'}
          trend={{
            value: Math.round(dashboardData?.pendingTrend || 0),
            isPositive: (dashboardData?.pendingTrend || 0) <= 0
          }}
          icon={Clock}
          borderColor="border-l-red-500"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        <VolumeChart data={volumeData || []} />
        <RecentPayouts />
      </div>
    </div>
  );
};

export default Dashboard;
