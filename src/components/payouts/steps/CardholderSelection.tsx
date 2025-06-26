
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Search, Plus } from 'lucide-react';
import type { Cardholder } from '@/lib/types';

interface CardholderSelectionProps {
  selectedCardholder?: Cardholder;
  onSelect: (cardholder: Cardholder) => void;
}

export const CardholderSelection = ({ selectedCardholder, onSelect }: CardholderSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: cardholders, isLoading } = useQuery({
    queryKey: ['cardholders', searchTerm],
    queryFn: async () => {
      let query = supabase.from('cardholders').select('*');
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const filteredCardholders = cardholders?.filter(cardholder =>
    cardholder.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cardholder.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Selecciona un Cardholder</h3>
          <p className="text-gray-600 text-sm">Busca y selecciona el destinatario del payout</p>
        </div>
        
        <Skeleton className="h-10 w-full" />
        
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Selecciona un Cardholder</h3>
        <p className="text-gray-600 text-sm">Busca y selecciona el destinatario del payout</p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 max-h-64 overflow-y-auto">
        {filteredCardholders?.map((cardholder) => (
          <Card
            key={cardholder.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCardholder?.id === cardholder.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(cardholder)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-medium">{cardholder.full_name}</h4>
                    <p className="text-sm text-gray-600">
                      {cardholder.email || 'Sin email'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    *{cardholder.pan_last4}
                  </Badge>
                  {cardholder.card_brand && (
                    <p className="text-xs text-gray-500 mt-1">
                      {cardholder.card_brand}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {!filteredCardholders?.length && (
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No se encontraron cardholders</p>
          <Button variant="outline" className="mt-3" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Crear Nuevo Cardholder
          </Button>
        </div>
      )}
    </div>
  );
};
