
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            Suma de todos los wallets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wallets Organizacionales</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalOrgBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {orgWallets.length} wallet{orgWallets.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wallets de Instancias</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalInstanceBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {instanceWallets.length} wallet{instanceWallets.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monedas Activas</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(currencyGroups).length}</div>
          <p className="text-xs text-muted-foreground">
            {Object.keys(currencyGroups).join(', ')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
