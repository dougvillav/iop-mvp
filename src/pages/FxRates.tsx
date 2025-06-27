
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { FxRateModal } from '@/components/fx-rates/FxRateModal';
import { FxRateCard } from '@/components/fx-rates/FxRateCard';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import type { OrgFxRate } from '@/lib/types';

const FxRates = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<OrgFxRate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fxRates, isLoading, error } = useQuery({
    queryKey: ['org-fx-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_fx_rates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching FX rates:', error);
        throw error;
      }
      return data as OrgFxRate[];
    },
    retry: (failureCount, error) => {
      // Don't retry on authorization errors
      if (error?.message?.includes('Row Level Security')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_fx_rates')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting FX rate:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Rate deleted',
        description: 'Exchange rate has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['org-fx-rates'] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: 'Error deleting rate',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (rate: OrgFxRate) => {
    setEditingRate(rate);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this exchange rate? This action cannot be undone.')) {
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

  // Show error state if there's an authorization error
  if (error && error.message?.includes('Row Level Security')) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-gray-600 mb-4">
                You don't have permission to view exchange rates. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exchange Rates</h1>
            <p className="text-gray-600 mt-2">
              Configure exchange rates for currency conversions
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Exchange Rate
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Configured Exchange Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!fxRates?.length ? (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Exchange Rates Configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Configure exchange rates to enable currency conversions
                </p>
                <Button
                  onClick={() => setModalOpen(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Exchange Rate
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
    </Layout>
  );
};

export default FxRates;
