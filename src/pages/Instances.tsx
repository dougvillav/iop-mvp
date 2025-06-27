import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InstanceCard } from '@/components/instances/InstanceCard';
import { InstanceModal } from '@/components/instances/InstanceModal';
import { TariffConfigModal } from '@/components/instances/TariffConfigModal';
import type { Instance } from '@/lib/types';

const Instances = () => {
  const [instanceModalOpen, setInstanceModalOpen] = useState(false);
  const [tariffModalOpen, setTariffModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

  const { data: instances, isLoading, refetch } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Instance[];
    }
  });

  const handleSuccess = () => {
    refetch();
    setInstanceModalOpen(false);
    setTariffModalOpen(false);
    setSelectedInstance(null);
  };

  const openInstanceModal = (instance?: Instance) => {
    setSelectedInstance(instance || null);
    setInstanceModalOpen(true);
  };

  const openTariffModal = (instance: Instance) => {
    setSelectedInstance(instance);
    setTariffModalOpen(true);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Instancias</h1>
          <p className="text-gray-600 mt-2">
            Administra las instancias de tu organización
          </p>
        </div>
        <Button
          onClick={() => openInstanceModal()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Instancia
        </Button>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
        <div>
          <h2 className="text-xl font-semibold">Instancias Registradas</h2>
          <p className="text-gray-600">
            {instances?.length || 0} instancia{instances?.length !== 1 ? 's' : ''} registrada{instances?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {!instances?.length ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay instancias registradas
          </h3>
          <p className="text-gray-600 mb-4">
            Crea tu primera instancia para comenzar a procesar pagos
          </p>
          <Button
            onClick={() => openInstanceModal()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Instancia
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onEdit={() => openInstanceModal(instance)}
              onConfigureTariffs={() => openTariffModal(instance)}
            />
          ))}
        </div>
      )}

      <InstanceModal
        isOpen={instanceModalOpen}
        onClose={() => setInstanceModalOpen(false)}
        onSuccess={handleSuccess}
        instance={selectedInstance}
      />

      <TariffConfigModal
        isOpen={tariffModalOpen}
        onClose={() => setTariffModalOpen(false)}
        onSuccess={handleSuccess}
        instance={selectedInstance}
      />
    </div>
  );
};

export default Instances;
