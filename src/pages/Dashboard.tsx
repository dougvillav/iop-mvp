
import { DemoDataGenerator } from '@/components/demo/DemoDataGenerator';
import { KPICard } from '@/components/dashboard/KPICard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { RecentPayouts } from '@/components/payouts/RecentPayouts';

const Dashboard = () => {
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

      {/* Generador de datos demo */}
      <div className="flex justify-center">
        <DemoDataGenerator />
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Balance Total"
          value="$125,430.00"
          change="+12.5%"
          trend="up"
          icon="wallet"
        />
        <KPICard
          title="Payouts Hoy"
          value="47"
          change="+8.2%"
          trend="up"
          icon="trending-up"
        />
        <KPICard
          title="Comisiones"
          value="$2,840.50"
          change="+15.3%"
          trend="up"
          icon="dollar-sign"
        />
        <KPICard
          title="Transacciones Pendientes"
          value="12"
          change="-5.1%"
          trend="down"
          icon="clock"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        <VolumeChart />
        <RecentPayouts />
      </div>
    </div>
  );
};

export default Dashboard;
