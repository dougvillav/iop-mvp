
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CardholderCard } from '@/components/cardholders/CardholderCard';
import { CardholderModal } from '@/components/cardholders/CardholderModal';
import type { Cardholder } from '@/lib/types';

const Cardholders = () => {
  const [cardholderModalOpen, setCardholderModalOpen] = useState(false);
  const [selectedCardholder, setSelectedCardholder] = useState<Cardholder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: cardholders, isLoading, refetch } = useQuery({
    queryKey: ['cardholders', searchTerm],
    queryFn: async () => {
      let query = supabase.from('cardholders').select('*');
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Cardholder[];
    }
  });

  const handleSuccess = () => {
    refetch();
    setCardholderModalOpen(false);
    setSelectedCardholder(null);
  };

  const openCardholderModal = (cardholder?: Cardholder) => {
    setSelectedCardholder(cardholder || null);
    setCardholderModalOpen(true);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cardholders</h1>
          <p className="text-gray-600 mt-2">
            Administra los portadores de tarjetas para payouts
          </p>
        </div>
        <Button
          onClick={() => openCardholderModal()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cardholder
        </Button>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
        <div>
          <h2 className="text-xl font-semibold">Cardholders Registrados</h2>
          <p className="text-gray-600">
            {cardholders?.length || 0} cardholder{cardholders?.length !== 1 ? 's' : ''} registrado{cardholders?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar cardholders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!cardholders?.length ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay cardholders registrados
          </h3>
          <p className="text-gray-600 mb-4">
            Crea tu primer cardholder para comenzar a procesar payouts
          </p>
          <Button
            onClick={() => openCardholderModal()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Primer Cardholder
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cardholders.map((cardholder) => (
            <CardholderCard
              key={cardholder.id}
              cardholder={cardholder}
              onEdit={() => openCardholderModal(cardholder)}
            />
          ))}
        </div>
      )}

      <CardholderModal
        isOpen={cardholderModalOpen}
        onClose={() => setCardholderModalOpen(false)}
        onSuccess={handleSuccess}
        cardholder={selectedCardholder}
      />
    </div>
  );
};

export default Cardholders;
