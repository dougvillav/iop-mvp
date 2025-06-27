
import { KPICard } from '@/components/dashboard/KPICard';
import { Wallet, Building2, TrendingUp, DollarSign } from 'lucide-react';
import type { OrgWallet, InstanceWallet, Instance } from '@/lib/types';

interface InstanceWalletWithInstance extends InstanceWallet {
  instance: Instance;
}

interface WalletStatsProps {
  orgWallets: OrgWallet[];
  instanceWallets: InstanceWalletWithInstance[];
}

export const WalletStats = ({ orgWallets, instanceWallets }: WalletStatsProps) => {
  const totalOrgBalance = orgWallets.reduce((sum, wallet) => 
    sum + Number(wallet.balance_available), 0
  );

  const totalInstanceBalance = instanceWallets.reduce((sum, wallet) => 
    sum + Number(wallet.balance_available), 0
  );

  const totalBalance = totalOrgBalance + totalInstanceBalance;

  const currencyGroups = [...orgWallets, ...instanceWallets].reduce((acc, wallet) => {
    if (!acc[wallet.currency]) {
      acc[wallet.currency] = 0;
    }
    acc[wallet.currency] += Number(wallet.balance_available);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Balance Total"
        value={`$${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        description="Suma de todos los wallets"
        icon={DollarSign}
        borderColor="border-l-blue-500"
      />

      <KPICard
        title="Wallets Organizacionales"
        value={`$${totalOrgBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        description={`${orgWallets.length} wallet${orgWallets.length !== 1 ? 's' : ''}`}
        icon={Building2}
        borderColor="border-l-green-500"
      />

      <KPICard
        title="Wallets de Instancias"
        value={`$${totalInstanceBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        description={`${instanceWallets.length} wallet${instanceWallets.length !== 1 ? 's' : ''}`}
        icon={Wallet}
        borderColor="border-l-yellow-500"
      />

      <KPICard
        title="Monedas Activas"
        value={Object.keys(currencyGroups).length}
        description={Object.keys(currencyGroups).join(', ')}
        icon={TrendingUp}
        borderColor="border-l-purple-500"
      />
    </div>
  );
};
