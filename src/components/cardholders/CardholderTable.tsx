
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Mail, Phone, MapPin } from 'lucide-react';
import type { Cardholder } from '@/lib/types';

interface CardholderTableProps {
  cardholders: Cardholder[];
  onEdit: (cardholder: Cardholder) => void;
}

export const CardholderTable = ({ cardholders, onEdit }: CardholderTableProps) => {
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
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tarjeta</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>País</TableHead>
            <TableHead>BIN</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cardholders.map((cardholder) => (
            <TableRow key={cardholder.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {cardholder.full_name}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {cardholder.card_brand && (
                    <Badge className={getBrandColor(cardholder.card_brand)} variant="secondary">
                      {cardholder.card_brand}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    *{cardholder.pan_last4}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {cardholder.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-3 w-3 mr-1" />
                      {cardholder.email}
                    </div>
                  )}
                  {cardholder.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-3 w-3 mr-1" />
                      {cardholder.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {cardholder.country && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    {cardholder.country}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {cardholder.pan_first6 ? `${cardholder.pan_first6}****` : '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(cardholder.created_at || '').toLocaleDateString('es-MX')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => onEdit(cardholder)}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
