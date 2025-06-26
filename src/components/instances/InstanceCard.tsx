
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, CreditCard, Edit } from 'lucide-react';
import type { Instance } from '@/lib/types';

interface InstanceCardProps {
  instance: Instance;
  onEdit: () => void;
}

export const InstanceCard = ({ instance, onEdit }: InstanceCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'inactive':
        return 'Inactiva';
      case 'suspended':
        return 'Suspendida';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            {instance.legal_name}
          </CardTitle>
          <Badge className={getStatusColor(instance.status || 'active')}>
            {getStatusText(instance.status || 'active')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {instance.country_iso}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <CreditCard className="h-4 w-4 mr-2" />
            Moneda: {instance.settlement_currency}
          </div>
          
          {instance.registration_id && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Registro:</span> {instance.registration_id}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>Creada: {new Date(instance.created_at || '').toLocaleDateString('es-MX')}</p>
          {instance.updated_at !== instance.created_at && (
            <p>Actualizada: {new Date(instance.updated_at || '').toLocaleDateString('es-MX')}</p>
          )}
        </div>

        <div className="pt-2 border-t">
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
