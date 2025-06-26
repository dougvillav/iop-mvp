
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

export const WalletStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['wallet-stats'],
    queryFn: async () => {
      // Obtener estadísticas de wallets organizacionales
      const { data: orgWallets, error: orgError } = await supabase
        .from('org_wallets')
        .select('balance_available, threshold_min, currency');
      
      if (orgError) throw orgError;

      // Obtener estadísticas de wallets de instancia
      const { data: instanceWallets, error: instanceError } = await supabase
        .from('instance_wallets')
        .select('balance_available, threshold_min, currency');
      
      if (instanceError) throw instanceError;

      // Calcular estadísticas
      const totalOrgBalance = orgWallets?.reduce((sum, wallet) => 
        sum + Number(wallet.balance_available), 0) || 0;
      
      const totalInstanceBalance = instanceWallets?.reduce((sum, wallet) => 
        sum + Number(wallet.balance_available), 0) || 0;
      
      const totalBalance = totalOrgBalance + totalInstanceBalance;
      
      // Wallets con balance bajo
      const lowBalanceWallets = [
        ...orgWallets?.filter(w => Number(w.balance_available) < Number(w.threshold_min)) || [],
        ...instanceWallets?.filter(w => Number(w.balance_available) < Number(w.threshold_min)) || []
      ];

      // Monedas activas
      const activeCurrencies = new Set([
        ...orgWallets?.map(w => w.currency) || [],
        ...instanceWallets?.map(w => w.currency) || []
      ]);

      return {
        totalBalance,
        totalOrgBalance,
        totalInstanceBalance,
        orgWalletsCount: orgWallets?.length || 0,
        instanceWalletsCount: instanceWallets?.length || 0,
        lowBalanceCount: lowBalanceWallets.length,
        activeCurrenciesCount: activeCurrencies.size
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'USD'
            }).format(stats?.totalBalance || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Todos los wallets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wallets Activos</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(stats?.orgWalletsCount || 0) + (stats?.instanceWalletsCount || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.orgWalletsCount} org + {stats?.instanceWalletsCount} instancia
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance Bajo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            (stats?.lowBalanceCount || 0) > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {stats?.lowBalanceCount || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Wallets bajo umbral
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monedas</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.activeCurrenciesCount || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Monedas activas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
