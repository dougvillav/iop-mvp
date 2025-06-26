
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { FraudRule, FraudAlert } from '@/lib/fraud-types';

const initialRules: FraudRule[] = [
  {
    id: '1',
    name: 'Monto Alto',
    description: 'Transacciones superiores a $10,000 USD',
    condition_type: 'amount_threshold',
    condition_value: { threshold: 10000, currency: 'USD' },
    action: 'review',
    priority: 8,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Velocidad Sospechosa',
    description: 'Más de 5 transacciones en 1 hora',
    condition_type: 'velocity',
    condition_value: { max_transactions: 5, time_window_hours: 1 },
    action: 'flag',
    priority: 6,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const initialAlerts: FraudAlert[] = [
  {
    id: '1',
    transaction_id: 'txn_123',
    alert_type: 'high_risk',
    severity: 'high',
    message: 'Transacción de monto alto detectada - $15,000 USD',
    metadata: { amount: 15000, currency: 'USD', risk_score: 85 },
    status: 'open',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
  },
  {
    id: '2',
    transaction_id: 'txn_124',
    alert_type: 'suspicious_pattern',
    severity: 'medium',
    message: 'Patrón de velocidad sospechoso detectado',
    metadata: { transactions_count: 7, time_window: '1 hour' },
    status: 'investigating',
    assigned_to: 'admin@example.com',
    created_at: '2025-01-01T09:30:00Z',
    updated_at: '2025-01-01T09:45:00Z',
  },
];

export const useFraudRules = () => {
  const [rules, setRules] = useState<FraudRule[]>(initialRules);
  const [alerts, setAlerts] = useState<FraudAlert[]>(initialAlerts);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    setLoading(true);
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, is_active: isActive, updated_at: new Date().toISOString() }
          : rule
      ));
      
      toast({
        title: `Regla ${isActive ? 'activada' : 'desactivada'}`,
        description: 'El cambio se ha aplicado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la regla',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createRule = useCallback(async (ruleData: Omit<FraudRule, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const newRule: FraudRule = {
        ...ruleData,
        id: `rule_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setRules(prev => [...prev, newRule]);
      
      toast({
        title: 'Regla creada',
        description: 'La nueva regla se ha creado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la regla',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateRule = useCallback(async (ruleId: string, ruleData: Partial<FraudRule>) => {
    setLoading(true);
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, ...ruleData, updated_at: new Date().toISOString() }
          : rule
      ));
      
      toast({
        title: 'Regla actualizada',
        description: 'Los cambios se han guardado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la regla',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteRule = useCallback(async (ruleId: string) => {
    setLoading(true);
    try {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      
      toast({
        title: 'Regla eliminada',
        description: 'La regla se ha eliminado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la regla',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateAlert = useCallback(async (alertId: string, status: FraudAlert['status']) => {
    setLoading(true);
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status, updated_at: new Date().toISOString() }
          : alert
      ));
      
      const statusMessages = {
        resolved: 'resuelta',
        false_positive: 'descartada',
        investigating: 'marcada para investigar'
      };
      
      toast({
        title: 'Alerta actualizada',
        description: `La alerta ha sido ${statusMessages[status] || 'actualizada'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la alerta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    rules,
    alerts,
    loading,
    toggleRule,
    createRule,
    updateRule,
    deleteRule,
    updateAlert,
  };
};
