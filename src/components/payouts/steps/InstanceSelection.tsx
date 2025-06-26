
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import type { Instance } from '@/lib/types';

interface InstanceSelectionProps {
  selectedInstance?: Instance;
  onSelect: (instance: Instance) => void;
}

export const InstanceSelection = ({ selectedInstance, onSelect }: InstanceSelectionProps) => {
  const { data: instances, isLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Selecciona una Instancia</h3>
          <p className="text-gray-600 text-sm">Elige la instancia desde la cual realizar el payout</p>
        </div>
        
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Selecciona una Instancia</h3>
        <p className="text-gray-600 text-sm">Elige la instancia desde la cual realizar el payout</p>
      </div>
      
      <div className="grid gap-3 max-h-80 overflow-y-auto">
        {instances?.map((instance) => (
          <Card
            key={instance.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedInstance?.id === instance.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(instance)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">{instance.legal_name}</h4>
                    <p className="text-sm text-gray-600">{instance.country_iso}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    {instance.settlement_currency}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {!instances?.length && (
        <div className="text-center py-8 text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No hay instancias activas disponibles</p>
        </div>
      )}
    </div>
  );
};
