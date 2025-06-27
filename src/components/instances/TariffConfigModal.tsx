
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Percent, DollarSign, CreditCard, Building2 } from 'lucide-react';
import type { Instance, InstanceTariffConfig, TariffConfigForm } from '@/lib/types';

interface TariffConfigModalProps {
  instance: Instance | null;
  open: boolean;
  onClose: () => void;
}

export const TariffConfigModal = ({ instance, open, onClose }: TariffConfigModalProps) => {
  // Early return if instance is null
  if (!instance) {
    return null;
  }

  const [configs, setConfigs] = useState<InstanceTariffConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<TariffConfigForm>({
    transaction_type: 'pay_out',
    rail: 'visa_direct',
    commission_percentage: 0,
    commission_fixed: 0,
    tax_percentage: 0,
    processing_fee: 0,
    currency: instance.settlement_currency,
    is_active: true,
  });

  // Separate state for form display values (strings)
  const [formDisplayValues, setFormDisplayValues] = useState({
    commission_percentage: '',
    commission_fixed: '',
    tax_percentage: '',
    processing_fee: '',
  });

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('instance_tariff_configs')
        .select('*')
        .eq('instance_id', instance.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading tariff configs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones de tarifas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('instance_tariff_configs')
        .upsert({
          instance_id: instance.id,
          ...formData,
        }, {
          onConflict: 'instance_id,transaction_type,rail,currency'
        });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Configuración de tarifas guardada correctamente',
      });

      await loadConfigs();
      resetForm();
    } catch (error) {
      console.error('Error saving tariff config:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_type: 'pay_out',
      rail: 'visa_direct',
      commission_percentage: 0,
      commission_fixed: 0,
      tax_percentage: 0,
      processing_fee: 0,
      currency: instance.settlement_currency,
      is_active: true,
    });
    setFormDisplayValues({
      commission_percentage: '',
      commission_fixed: '',
      tax_percentage: '',
      processing_fee: '',
    });
  };

  const handleNumericChange = (field: keyof typeof formDisplayValues, value: string) => {
    // Update display value
    setFormDisplayValues(prev => ({ ...prev, [field]: value }));
    
    // Update actual numeric value
    const numericValue = value === '' ? 0 : Number(value);
    if (field === 'commission_percentage' || field === 'tax_percentage') {
      // Convert percentage to decimal
      setFormData(prev => ({ ...prev, [field]: numericValue / 100 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    }
  };

  const toggleConfigStatus = async (configId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('instance_tariff_configs')
        .update({ is_active: isActive })
        .eq('id', configId);

      if (error) throw error;

      await loadConfigs();
      toast({
        title: 'Éxito',
        description: `Configuración ${isActive ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating config status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la configuración',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open) {
      loadConfigs();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Configuración de Tarifas - {instance.legal_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Configuraciones Existentes</TabsTrigger>
            <TabsTrigger value="new">Nueva Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Cargando configuraciones...</div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay configuraciones de tarifas definidas
              </div>
            ) : (
              <div className="space-y-4">
                {configs.map((config) => (
                  <Card key={config.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {config.transaction_type === 'pay_out' ? 'Payout' : 'Pay-in'} - {config.rail}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={config.is_active ? 'default' : 'secondary'}>
                            {config.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                          <Switch
                            checked={config.is_active || false}
                            onCheckedChange={(checked) => toggleConfigStatus(config.id, checked)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">Comisión %</p>
                            <p className="font-medium">{(Number(config.commission_percentage) * 100).toFixed(2)}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-500">Comisión Fija</p>
                            <p className="font-medium">${Number(config.commission_fixed).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="text-sm text-gray-500">Impuesto %</p>
                            <p className="font-medium">{(Number(config.tax_percentage) * 100).toFixed(2)}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="text-sm text-gray-500">Fee Procesamiento</p>
                            <p className="font-medium">${Number(config.processing_fee).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nueva Configuración de Tarifas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction_type">Tipo de Transacción</Label>
                    <Select
                      value={formData.transaction_type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, transaction_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pay_out">Payout</SelectItem>
                        <SelectItem value="pay_in">Pay-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rail">Rail</Label>
                    <Select
                      value={formData.rail}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, rail: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa_direct">Visa Direct</SelectItem>
                        <SelectItem value="mastercard_send">Mastercard Send</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_percentage">Comisión (%) *</Label>
                    <Input
                      id="commission_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formDisplayValues.commission_percentage}
                      onChange={(e) => handleNumericChange('commission_percentage', e.target.value)}
                      placeholder="Ej: 2.5 para 2.5%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commission_fixed">Comisión Fija ({instance.settlement_currency})</Label>
                    <Input
                      id="commission_fixed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formDisplayValues.commission_fixed}
                      onChange={(e) => handleNumericChange('commission_fixed', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_percentage">Impuesto (%)</Label>
                    <Input
                      id="tax_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formDisplayValues.tax_percentage}
                      onChange={(e) => handleNumericChange('tax_percentage', e.target.value)}
                      placeholder="Ej: 16 para 16%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processing_fee">Fee de Procesamiento ({instance.settlement_currency})</Label>
                    <Input
                      id="processing_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formDisplayValues.processing_fee}
                      onChange={(e) => handleNumericChange('processing_fee', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Configuración activa</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Limpiar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
