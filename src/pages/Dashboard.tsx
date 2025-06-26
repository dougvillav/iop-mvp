
import { KPICard } from '@/components/dashboard/KPICard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { RecentPayouts } from '@/components/payouts/RecentPayouts';
import { Wallet, TrendingUp, DollarSign, Clock } from 'lucide-react';

const Dashboard = () => {
  // Datos de ejemplo para el gráfico de volumen
  const volumeData = [
    { date: '2024-01', visa_direct: 12500, mastercard_send: 8300 },
    { date: '2024-02', visa_direct: 15200, mastercard_send: 9100 },
    { date: '2024-03', visa_direct: 18700, mastercard_send: 11200 },
    { date: '2024-04', visa_direct: 16800, mastercard_send: 10500 },
    { date: '2024-05', visa_direct: 21300, mastercard_send: 13400 },
    { date: '2024-06', visa_direct: 19600, mastercard_send: 12800 },
  ];

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
          value="$125,430.00"
          trend={{
            value: 12.5,
            isPositive: true
          }}
          icon={Wallet}
        />
        <KPICard
          title="Payouts Hoy"
          value="47"
          trend={{
            value: 8.2,
            isPositive: true
          }}
          icon={TrendingUp}
        />
        <KPICard
          title="Comisiones"
          value="$2,840.50"
          trend={{
            value: 15.3,
            isPositive: true
          }}
          icon={DollarSign}
        />
        <KPICard
          title="Transacciones Pendientes"
          value="12"
          trend={{
            value: -5.1,
            isPositive: false
          }}
          icon={Clock}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        <VolumeChart data={volumeData} />
        <RecentPayouts />
      </div>
    </div>
  );
};

export default Dashboard;
