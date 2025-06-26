
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Mail, Phone, MapPin, Edit } from 'lucide-react';
import type { Cardholder } from '@/lib/types';

interface CardholderCardProps {
  cardholder: Cardholder;
  onEdit: () => void;
}

export const CardholderCard = ({ cardholder, onEdit }: CardholderCardProps) => {
  const getBrandColor = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'bg-blue-100 text-blue-800';
      case 'mastercard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            {cardholder.full_name}
          </CardTitle>
          <div className="flex gap-1">
            {cardholder.card_brand && (
              <Badge className={getBrandColor(cardholder.card_brand)}>
                {cardholder.card_brand}
              </Badge>
            )}
            <Badge variant="outline">
              *{cardholder.pan_last4}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {cardholder.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {cardholder.email}
            </div>
          )}
          
          {cardholder.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {cardholder.phone}
            </div>
          )}
          
          {cardholder.country && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {cardholder.country}
            </div>
          )}
          
          {cardholder.pan_first6 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">BIN:</span> {cardholder.pan_first6}****
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>Creado: {new Date(cardholder.created_at || '').toLocaleDateString('es-MX')}</p>
          {cardholder.updated_at !== cardholder.created_at && (
            <p>Actualizado: {new Date(cardholder.updated_at || '').toLocaleDateString('es-MX')}</p>
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
