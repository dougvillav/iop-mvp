
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletCard } from '@/components/wallets/WalletCard';
import { DepositModal } from '@/components/wallets/DepositModal';
import { AllocationModal } from '@/components/wallets/AllocationModal';
import { Plus, ArrowUpDown } from 'lucide-react';
import type { OrgWallet, InstanceWallet, Instance } from '@/lib/types';

const Wallets = () => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<OrgWallet | null>(null);

  // Query para wallets organizacionales
  const { data: orgWallets, isLoading: orgWalletsLoading, refetch: refetchOrgWallets } = useQuery({
    queryKey: ['org-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_wallets')
        .select('*')
        .order('currency');
      
      if (error) throw error;
      return data as OrgWallet[];
    }
  });

  // Query para wallets de instancias con detalles
  const { data: instanceWallets, isLoading: instanceWalletsLoading, refetch: refetchInstanceWallets } = useQuery({
    queryKey: ['instance-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instance_wallets')
        .select(`
          *,
          instance:instances(
            id,
            legal_name,
            country_iso,
            settlement_currency
          )
        `)
        .order('instance_id');
      
      if (error) throw error;
      return data as (InstanceWallet & { instance: Instance })[];
    }
  });

  const handleDepositSuccess = () => {
    refetchOrgWallets();
    setDepositModalOpen(false);
    setSelectedWallet(null);
  };

  const handleAllocationSuccess = () => {
    refetchOrgWallets();
    refetchInstanceWallets();
    setAllocationModalOpen(false);
    setSelectedWallet(null);
  };

  const openDepositModal = (wallet: OrgWallet) => {
    setSelectedWallet(wallet);
    setDepositModalOpen(true);
  };

  const openAllocationModal = (wallet: OrgWallet) => {
    setSelectedWallet(wallet);
    setAllocationModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Wallets</h1>
        <p className="text-gray-600 mt-1">Administra balances y asignaciones de fondos</p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organization">Wallets Organizacionales</TabsTrigger>
          <TabsTrigger value="instances">Wallets de Instancias</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Wallets por Moneda</h2>
            <Button
              onClick={() => setDepositModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Depósito
            </Button>
          </div>

          {orgWalletsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orgWallets?.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  type="org"
                  onDeposit={() => openDepositModal(wallet)}
                  onAllocate={() => openAllocationModal(wallet)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instances" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Wallets por Instancia</h2>
            <p className="text-sm text-gray-600 mt-1">
              Administra fondos asignados a cada instancia legal
            </p>
          </div>

          {instanceWalletsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {instanceWallets?.map((wallet) => (
                <Card key={wallet.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {wallet.instance.legal_name}
                        </CardTitle>
                        <CardDescription>
                          {wallet.instance.country_iso} • {wallet.currency}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const orgWallet = orgWallets?.find(w => w.currency === wallet.currency);
                          if (orgWallet) openAllocationModal(orgWallet);
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Asignar Fondos
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: wallet.currency
                          }).format(Number(wallet.balance_available))}
                        </p>
                        <p className="text-sm text-gray-500">Balance disponible</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          Umbral mínimo: {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: wallet.currency
                          }).format(Number(wallet.threshold_min))}
                        </p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          Number(wallet.balance_available) > Number(wallet.threshold_min)
                            ? 'bg-green-100 text-green-800'
                            : Number(wallet.balance_available) > Number(wallet.threshold_min) * 0.5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {Number(wallet.balance_available) > Number(wallet.threshold_min)
                            ? 'Saludable'
                            : Number(wallet.balance_available) > Number(wallet.threshold_min) * 0.5
                            ? 'Atención'
                            : 'Crítico'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => {
          setDepositModalOpen(false);
          setSelectedWallet(null);
        }}
        onSuccess={handleDepositSuccess}
        wallets={orgWallets || []}
        selectedWallet={selectedWallet}
      />

      <AllocationModal
        isOpen={allocationModalOpen}
        onClose={() => {
          setAllocationModalOpen(false);
          setSelectedWallet(null);
        }}
        onSuccess={handleAllocationSuccess}
        sourceWallet={selectedWallet}
        instanceWallets={instanceWallets || []}
      />
    </div>
  );
};

export default Wallets;
