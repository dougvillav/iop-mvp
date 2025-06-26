
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/dashboard/KPICard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardKPIs } from '@/lib/types';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Clock,
  AlertTriangle 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    
    // Suscripción para actualizaciones en tiempo real
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'org_wallets'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Obtener KPIs principales
      const { data: wallets } = await supabase
        .from('org_wallets')
        .select('balance_available, currency');

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_brutto, commission, rail, status, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (wallets && transactions) {
        const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance_available || 0), 0);
        
        const today = new Date().toISOString().split('T')[0];
        const dailyPayouts = transactions
          .filter(t => t.created_at?.startsWith(today) && t.type === 'pay_out')
          .reduce((sum, t) => sum + t.amount_brutto, 0);

        const totalCommissions = transactions
          .reduce((sum, t) => sum + (t.commission || 0), 0);

        const pendingTransactions = transactions
          .filter(t => t.status === 'pending').length;

        const visaVolume = transactions
          .filter(t => t.rail === 'visa_direct')
          .reduce((sum, t) => sum + t.amount_brutto, 0);

        const mastercardVolume = transactions
          .filter(t => t.rail === 'mastercard_send')
          .reduce((sum, t) => sum + t.amount_brutto, 0);

        setKpis({
          total_balance: totalBalance,
          daily_payouts: dailyPayouts,
          total_commissions: totalCommissions,
          pending_transactions: pendingTransactions,
          visa_volume: visaVolume,
          mastercard_volume: mastercardVolume
        });

        // Datos para el gráfico (últimos 7 días)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const chartData = last7Days.map(date => {
          const dayTransactions = transactions.filter(t => 
            t.created_at?.startsWith(date)
          );
          
          return {
            date: new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
            visa_direct: dayTransactions
              .filter(t => t.rail === 'visa_direct')
              .reduce((sum, t) => sum + t.amount_brutto, 0),
            mastercard_send: dayTransactions
              .filter(t => t.rail === 'mastercard_send')
              .reduce((sum, t) => sum + t.amount_brutto, 0)
          };
        });

        setChartData(chartData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido, {profile?.full_name || profile?.email}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Balance Total"
          value={new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
          }).format(kpis?.total_balance || 0)}
          description="Fondos disponibles"
          icon={Wallet}
          className="border-l-4 border-l-blue-500"
        />
        
        <KPICard
          title="Payouts del Día"
          value={new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
          }).format(kpis?.daily_payouts || 0)}
          description="Procesados hoy"
          icon={TrendingUp}
          className="border-l-4 border-l-green-500"
        />
        
        <KPICard
          title="Comisiones"
          value={new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
          }).format(kpis?.total_commissions || 0)}
          description="Últimos 30 días"
          icon={DollarSign}
          className="border-l-4 border-l-yellow-500"
        />
        
        <KPICard
          title="Transacciones Pendientes"
          value={kpis?.pending_transactions || 0}
          description="Requieren atención"
          icon={Clock}
          className="border-l-4 border-l-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Volumen por Rail</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Rails</CardTitle>
            <CardDescription>Volumen total último mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  <span className="text-sm font-medium">Visa Direct</span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(kpis?.visa_volume || 0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full" />
                  <span className="text-sm font-medium">MasterCard Send</span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(kpis?.mastercard_volume || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {kpis?.pending_transactions && kpis.pending_transactions > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Atención Requerida</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Tienes {kpis.pending_transactions} transacciones pendientes que requieren revisión.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
