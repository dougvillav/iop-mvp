
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, Building2 } from 'lucide-react';
import { WalletCard } from '@/components/wallets/WalletCard';
import { WalletStats } from '@/components/wallets/WalletStats';
import { DepositModal } from '@/components/wallets/DepositModal';
import { AllocationModal } from '@/components/wallets/AllocationModal';
import type { OrgWallet, InstanceWallet, Instance } from '@/lib/types';

interface InstanceWalletWithInstance extends InstanceWallet {
  instance: Instance;
}

const Wallets = () => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);

  const { data: orgWallets, isLoading: loadingOrgWallets, refetch: refetchOrgWallets } = useQuery({
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

  const { data: instanceWallets, isLoading: loadingInstanceWallets, refetch: refetchInstanceWallets } = useQuery({
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
      return data as InstanceWalletWithInstance[];
    }
  });

  const handleSuccess = () => {
    refetchOrgWallets();
    refetchInstanceWallets();
    setDepositModalOpen(false);
    setAllocationModalOpen(false);
  };

  if (loadingOrgWallets || loadingInstanceWallets) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Wallets</h1>
          <p className="text-gray-600 mt-2">
            Administra los fondos de tu organización e instancias
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setDepositModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Depósito
          </Button>
          <Button
            onClick={() => setAllocationModalOpen(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Asignar Fondos
          </Button>
        </div>
      </div>

      <WalletStats 
        orgWallets={orgWallets || []} 
        instanceWallets={instanceWallets || []} 
      />

      <Tabs defaultValue="organizational" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organizational" className="flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Wallets Organizacionales
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center">
            <Wallet className="h-4 w-4 mr-2" />
            Wallets de Instancias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizational" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wallets Organizacionales</CardTitle>
            </CardHeader>
            <CardContent>
              {!orgWallets?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay wallets organizacionales</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {orgWallets.map((wallet) => (
                    <WalletCard
                      key={wallet.id}
                      wallet={wallet}
                      type="org"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wallets de Instancias</CardTitle>
            </CardHeader>
            <CardContent>
              {!instanceWallets?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay wallets de instancias</p>
                  <p className="text-sm mt-2">Crea una instancia para generar wallets automáticamente</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {instanceWallets.map((wallet) => (
                    <WalletCard
                      key={wallet.id}
                      wallet={{
                        ...wallet,
                        organization_id: wallet.instance.organization_id || ''
                      }}
                      type="instance"
                      instanceName={wallet.instance.legal_name}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={handleSuccess}
        orgWallets={orgWallets || []}
      />

      <AllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        onSuccess={handleSuccess}
        orgWallets={orgWallets || []}
        instanceWallets={instanceWallets || []}
      />
    </div>
  );
};

export default Wallets;
