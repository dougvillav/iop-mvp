
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { FxRateModal } from '@/components/fx-rates/FxRateModal';
import { FxRateCard } from '@/components/fx-rates/FxRateCard';
import { useToast } from '@/hooks/use-toast';
import type { OrgFxRate } from '@/lib/types';

const FxRates = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<OrgFxRate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fxRates, isLoading } = useQuery({
    queryKey: ['org-fx-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_fx_rates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OrgFxRate[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_fx_rates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Rate eliminado',
        description: 'El tipo de cambio se ha eliminado correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['org-fx-rates'] });
    },
    onError: (error) => {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (rate: OrgFxRate) => {
    setEditingRate(rate);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este tipo de cambio?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingRate(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['org-fx-rates'] });
    handleModalClose();
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
          <h1 className="text-3xl font-bold text-gray-900">Tipos de Cambio</h1>
          <p className="text-gray-600 mt-2">
            Configura los tipos de cambio para conversiones entre monedas
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tipo de Cambio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Tipos de Cambio Configurados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!fxRates?.length ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay tipos de cambio configurados
              </h3>
              <p className="text-gray-600 mb-4">
                Configura tipos de cambio para permitir conversiones entre monedas
              </p>
              <Button
                onClick={() => setModalOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer tipo de cambio
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {fxRates.map((rate) => (
                <FxRateCard
                  key={rate.id}
                  rate={rate}
                  onEdit={() => handleEdit(rate)}
                  onDelete={() => handleDelete(rate.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FxRateModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editingRate={editingRate}
      />
    </div>
  );
};

export default FxRates;
