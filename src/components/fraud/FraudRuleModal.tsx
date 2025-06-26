
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import type { FraudRule } from '@/lib/fraud-types';

interface FraudRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Omit<FraudRule, 'id' | 'created_at' | 'updated_at'>) => void;
  rule?: FraudRule;
}

export const FraudRuleModal: React.FC<FraudRuleModalProps> = ({
  open,
  onClose,
  onSave,
  rule
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    condition_type: 'amount_threshold' as const,
    condition_value: { threshold: 10000, currency: 'USD' },
    action: 'review' as const,
    priority: 5,
    is_active: true
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description,
        condition_type: rule.condition_type,
        condition_value: rule.condition_value,
        action: rule.action,
        priority: rule.priority,
        is_active: rule.is_active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        condition_type: 'amount_threshold',
        condition_value: { threshold: 10000, currency: 'USD' },
        action: 'review',
        priority: 5,
        is_active: true
      });
    }
  }, [rule, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const updateConditionValue = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      condition_value: { ...prev.condition_value, [field]: value }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Editar Regla' : 'Nueva Regla de Fraude'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Condición</Label>
              <Select 
                value={formData.condition_type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, condition_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount_threshold">Monto Límite</SelectItem>
                  <SelectItem value="velocity">Velocidad</SelectItem>
                  <SelectItem value="blacklist">Lista Negra</SelectItem>
                  <SelectItem value="geographic">Geográfico</SelectItem>
                  <SelectItem value="ml_score">Score ML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Acción</Label>
              <Select 
                value={formData.action} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Bloquear</SelectItem>
                  <SelectItem value="review">Revisar</SelectItem>
                  <SelectItem value="flag">Marcar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.condition_type === 'amount_threshold' && (
            <div>
              <Label>Monto Límite (USD)</Label>
              <Input
                type="number"
                value={formData.condition_value.threshold || 0}
                onChange={(e) => updateConditionValue('threshold', parseFloat(e.target.value))}
              />
            </div>
          )}

          {formData.condition_type === 'velocity' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Máx. Transacciones</Label>
                <Input
                  type="number"
                  value={formData.condition_value.max_transactions || 5}
                  onChange={(e) => updateConditionValue('max_transactions', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Ventana de Tiempo (horas)</Label>
                <Input
                  type="number"
                  value={formData.condition_value.time_window_hours || 1}
                  onChange={(e) => updateConditionValue('time_window_hours', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Prioridad: {formData.priority}</Label>
            <Slider
              value={[formData.priority]}
              onValueChange={([value]) => setFormData(prev => ({ ...prev, priority: value }))}
              max={10}
              min={1}
              step={1}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {rule ? 'Actualizar' : 'Crear'} Regla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
