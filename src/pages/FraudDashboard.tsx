
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, TrendingUp, Plus } from 'lucide-react';
import { FraudRuleCard } from '@/components/fraud/FraudRuleCard';
import { FraudAlertCard } from '@/components/fraud/FraudAlertCard';
import { useToast } from '@/hooks/use-toast';
import type { FraudRule, FraudAlert, TransactionWithDetails } from '@/lib/fraud-types';

const FraudDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Datos simulados para demo (en producción vendrían de Supabase)
  const mockRules: FraudRule[] = [
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

  const mockAlerts: FraudAlert[] = [
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

  // Query para transacciones bajo revisión
  const { data: reviewTransactions, isLoading: loadingReview } = useQuery({
    queryKey: ['fraud-review-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          cardholder:cardholders(*),
          instance:instances(*)
        `)
        .eq('status', 'under_review')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TransactionWithDetails[];
    }
  });

  const handleRuleToggle = async (ruleId: string, isActive: boolean) => {
    try {
      // En producción, actualizar en Supabase
      console.log(`Regla ${ruleId} ${isActive ? 'activada' : 'desactivada'}`);
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
    }
  };

  const handleAlertAction = async (alertId: string, action: 'resolve' | 'dismiss' | 'investigate') => {
    try {
      console.log(`Alerta ${alertId} - Acción: ${action}`);
      toast({
        title: 'Alerta actualizada',
        description: `La alerta ha sido ${action === 'resolve' ? 'resuelta' : action === 'dismiss' ? 'descartada' : 'marcada para investigar'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la alerta',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    totalRules: mockRules.length,
    activeRules: mockRules.filter(r => r.is_active).length,
    openAlerts: mockAlerts.filter(a => a.status === 'open').length,
    reviewTransactions: reviewTransactions?.length || 0,
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema Anti-Fraude</h1>
          <p className="text-gray-600 mt-2">
            Gestión de reglas, alertas y transacciones sospechosas
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Reglas Activas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.activeRules}/{stats.totalRules}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Abiertas</p>
                <p className="text-2xl font-bold text-red-600">{stats.openAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">En Revisión</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.reviewTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Efectividad</p>
                <p className="text-2xl font-bold text-green-600">92%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="review">Cola de Revisión</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600">
                        {alert.transaction_id} - {alert.severity}
                      </p>
                    </div>
                    <Badge variant={alert.status === 'open' ? 'destructive' : 'secondary'}>
                      {alert.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reglas Más Activas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-gray-600">
                        Prioridad {rule.priority} - {rule.action}
                      </p>
                    </div>
                    <Badge variant={rule.is_active ? 'secondary' : 'outline'}>
                      {rule.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockRules.map((rule) => (
              <FraudRuleCard
                key={rule.id}
                rule={rule}
                onEdit={(rule) => console.log('Editar regla:', rule)}
                onDelete={(id) => console.log('Eliminar regla:', id)}
                onToggle={handleRuleToggle}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {mockAlerts.map((alert) => (
              <FraudAlertCard
                key={alert.id}
                alert={alert}
                onResolve={(id) => handleAlertAction(id, 'resolve')}
                onDismiss={(id) => handleAlertAction(id, 'dismiss')}
                onInvestigate={(id) => handleAlertAction(id, 'investigate')}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transacciones en Revisión Manual</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReview ? (
                <div className="text-center py-8">Cargando transacciones...</div>
              ) : !reviewTransactions?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay transacciones pendientes de revisión</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewTransactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">
                            ${transaction.amount_brutto.toLocaleString()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {transaction.cardholder?.full_name} - {transaction.external_reference}
                          </p>
                        </div>
                        <Badge variant="secondary">En Revisión</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600">
                          Aprobar
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          Rechazar
                        </Button>
                        <Button size="sm" variant="outline">
                          Más Info
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FraudDashboard;
