
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, TrendingUp, ArrowRight } from 'lucide-react';
import type { OrgFxRate } from '@/lib/types';

interface FxRateCardProps {
  rate: OrgFxRate;
  onEdit: () => void;
  onDelete: () => void;
}

export const FxRateCard = ({ rate, onEdit, onDelete }: FxRateCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm font-medium">
              <span className="text-gray-900">{rate.from_currency}</span>
              <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
              <span className="text-gray-900">{rate.to_currency}</span>
            </div>
          </div>
          <Badge variant={rate.is_active ? "default" : "secondary"}>
            {rate.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        <div className="mb-3">
          <div className="text-2xl font-bold text-gray-900">
            {Number(rate.rate).toFixed(6)}
          </div>
          <p className="text-xs text-gray-500">
            1 {rate.from_currency} = {Number(rate.rate).toFixed(6)} {rate.to_currency}
          </p>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          <p>Creado: {new Date(rate.created_at).toLocaleDateString('es-MX')}</p>
          <p>Actualizado: {new Date(rate.updated_at).toLocaleDateString('es-MX')}</p>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
