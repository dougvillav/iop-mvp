
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Cardholder } from '@/lib/types';

const cardholderSchema = z.object({
  full_name: z.string().min(1, 'El nombre completo es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  card_number: z.string().min(13, 'Número de tarjeta inválido').max(19, 'Número de tarjeta inválido'),
  expiry_month: z.string().min(1, 'Mes de expiración requerido'),
  expiry_year: z.string().min(4, 'Año de expiración requerido'),
  cvv: z.string().min(3, 'CVV inválido').max(4, 'CVV inválido'),
});

type CardholderFormData = z.infer<typeof cardholderSchema>;

interface CardholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardholder?: Cardholder | null;
}

export const CardholderModal = ({ isOpen, onClose, onSuccess, cardholder }: CardholderModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CardholderFormData>({
    resolver: zodResolver(cardholderSchema),
    defaultValues: {
      full_name: cardholder?.full_name || '',
      email: cardholder?.email || '',
      phone: cardholder?.phone || '',
      country: cardholder?.country || '',
      address: cardholder?.address || '',
      card_number: '',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
    },
  });

  const onSubmit = async (data: CardholderFormData) => {
    setIsLoading(true);
    
    try {
      // Tokenizar datos de tarjeta (simulado)
      const cardToken = `tok_${Math.random().toString(36).substr(2, 9)}`;
      const panFirst6 = data.card_number.substring(0, 6);
      const panLast4 = data.card_number.substring(data.card_number.length - 4);
      
      // Detectar marca de tarjeta
      let cardBrand = 'Unknown';
      if (panFirst6.startsWith('4')) cardBrand = 'Visa';
      else if (panFirst6.startsWith('5') || panFirst6.startsWith('2')) cardBrand = 'Mastercard';

      const cardholderData = {
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        country: data.country || null,
        address: data.address || null,
        card_token: cardToken,
        pan_first6: panFirst6,
        pan_last4: panLast4,
        card_brand: cardBrand,
      };

      if (cardholder) {
        const { error } = await supabase
          .from('cardholders')
          .update(cardholderData)
          .eq('id', cardholder.id);

        if (error) throw error;

        toast({
          title: 'Cardholder actualizado',
          description: 'El cardholder ha sido actualizado exitosamente.',
        });
      } else {
        const { error } = await supabase
          .from('cardholders')
          .insert([cardholderData]);

        if (error) throw error;

        toast({
          title: 'Cardholder creado',
          description: 'El cardholder ha sido creado exitosamente.',
        });
      }

      onSuccess();
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Error al ${cardholder ? 'actualizar' : 'crear'} el cardholder: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {cardholder ? 'Editar Cardholder' : 'Nuevo Cardholder'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                {...form.register('full_name')}
                error={form.formState.errors.full_name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                error={form.formState.errors.email?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                error={form.formState.errors.phone?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Select onValueChange={(value) => form.setValue('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MX">México</SelectItem>
                  <SelectItem value="US">Estados Unidos</SelectItem>
                  <SelectItem value="CA">Canadá</SelectItem>
                  <SelectItem value="CO">Colombia</SelectItem>
                  <SelectItem value="BR">Brasil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              {...form.register('address')}
              error={form.formState.errors.address?.message}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Información de Tarjeta</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="card_number">Número de Tarjeta *</Label>
                <Input
                  id="card_number"
                  placeholder="1234 5678 9012 3456"
                  {...form.register('card_number')}
                  error={form.formState.errors.card_number?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_month">Mes de Expiración *</Label>
                <Select onValueChange={(value) => form.setValue('expiry_month', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_year">Año de Expiración *</Label>
                <Select onValueChange={(value) => form.setValue('expiry_year', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  maxLength={4}
                  {...form.register('cvv')}
                  error={form.formState.errors.cvv?.message}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : cardholder ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
