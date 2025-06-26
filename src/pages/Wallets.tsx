
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown } from 'lucide-react';
import { WalletCard } from '@/components/wallets/WalletCard';
import { WalletStats } from '@/components/wallets/WalletStats';
import { DepositModal } from '@/components/wallets/DepositModal';
import { AllocationModal } from '@/components/wallets/AllocationModal';
import type { OrgWallet, InstanceWallet, Instance } from '@/lib/types';

const Wallets = () => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<OrgWallet | null>(null);

  // Fetch organizational wallets
  const { data: orgWallets, isLoading: orgLoading, refetch: refetchOrgWallets } = useQuery({
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

  // Fetch instance wallets with instance data
  const { data: instanceWallets, isLoading: instanceLoading, refetch: refetchInstanceWallets } = useQuery({
    queryKey: ['instance-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instance_wallets')
        .select(`
          *,
          instance:instances(*)
        `)
        .order('currency');
      
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

  const openDepositModal = (wallet?: OrgWallet) => {
    setSelectedWallet(wallet || null);
    setDepositModalOpen(true);
  };

  const openAllocationModal = (wallet: OrgWallet) => {
    setSelectedWallet(wallet);
    setAllocationModalOpen(true);
  };

  if (orgLoading || instanceLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Wallets</h1>
        <Button
          onClick={() => openDepositModal()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Depósito
        </Button>
      </div>

      {/* Estadísticas */}
      <WalletStats />

      <Tabs defaultValue="organizational" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organizational">Wallets Organizacionales</TabsTrigger>
          <TabsTrigger value="instances">Wallets de Instancias</TabsTrigger>
        </TabsList>

        <TabsContent value="organizational" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Wallets Organizacionales</h2>
            <p className="text-gray-600">
              {orgWallets?.length || 0} wallet{orgWallets?.length !== 1 ? 's' : ''}
            </p>
          </div>

          {!orgWallets?.length ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ArrowUpDown className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay wallets organizacionales
              </h3>
              <p className="text-gray-600 mb-4">
                Los wallets se crean automáticamente cuando registras fondos
              </p>
              <Button
                onClick={() => openDepositModal()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primer Depósito
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orgWallets.map((wallet) => (
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Wallets de Instancias</h2>
            <p className="text-gray-600">
              {instanceWallets?.length || 0} wallet{instanceWallets?.length !== 1 ? 's' : ''}
            </p>
          </div>

          {!instanceWallets?.length ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ArrowUpDown className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay wallets de instancias
              </h3>
              <p className="text-gray-600">
                Los wallets se crean automáticamente al registrar instancias
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {instanceWallets.map((wallet) => (
                <div key={wallet.id} className="space-y-2">
                  <WalletCard
                    wallet={wallet}
                    type="instance"
                  />
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <p className="font-medium">{wallet.instance.legal_name}</p>
                    <p>{wallet.instance.country_iso}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={handleDepositSuccess}
        wallets={orgWallets || []}
        selectedWallet={selectedWallet}
      />

      <AllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        onSuccess={handleAllocationSuccess}
        sourceWallet={selectedWallet}
        instanceWallets={instanceWallets || []}
      />
    </div>
  );
};

export default Wallets;
