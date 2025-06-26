
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, TrendingUp, Plus } from 'lucide-react';
import { FraudRuleCard } from '@/components/fraud/FraudRuleCard';
import { FraudAlertCard } from '@/components/fraud/FraudAlertCard';
import { FraudRuleModal } from '@/components/fraud/FraudRuleModal';
import { DeleteConfirmModal } from '@/components/fraud/DeleteConfirmModal';
import { useFraudRules } from '@/hooks/useFraudRules';
import type { FraudRule, TransactionWithDetails } from '@/lib/fraud-types';

const FraudDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FraudRule | undefined>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const {
    rules,
    alerts,
    loading,
    toggleRule,
    createRule,
    updateRule,
    deleteRule,
    updateAlert,
  } = useFraudRules();

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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TransactionWithDetails[];
    }
  });

  const handleCreateRule = () => {
    setEditingRule(undefined);
    setRuleModalOpen(true);
  };

  const handleEditRule = (rule: FraudRule) => {
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (ruleData: Omit<FraudRule, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingRule) {
      await updateRule(editingRule.id, ruleData);
    } else {
      await createRule(ruleData);
    }
  };

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ruleToDelete) {
      await deleteRule(ruleToDelete);
      setRuleToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: 'resolve' | 'dismiss' | 'investigate') => {
    const statusMap = {
      resolve: 'resolved' as const,
      dismiss: 'false_positive' as const,
      investigate: 'investigating' as const,
    };
    await updateAlert(alertId, statusMap[action]);
  };

  const handleTransactionAction = async (transactionId: string, action: 'approve' | 'reject') => {
    // En producción, esto actualizaría el estado de la transacción en Supabase
    console.log(`Transacción ${transactionId} ${action === 'approve' ? 'aprobada' : 'rechazada'}`);
  };

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.is_active).length,
    openAlerts: alerts.filter(a => a.status === 'open').length,
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
        <Button onClick={handleCreateRule} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      {/* KPI Cards mejorados */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reglas Activas</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-blue-600">{stats.activeRules}</p>
                  <p className="text-sm text-gray-500">de {stats.totalRules}</p>
                </div>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Abiertas</p>
                <p className="text-2xl font-bold text-red-600">{stats.openAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Revisión</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.reviewTransactions}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efectividad</p>
                <p className="text-2xl font-bold text-green-600">92%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="rules">Reglas ({rules.length})</TabsTrigger>
          <TabsTrigger value="alerts">Alertas ({alerts.length})</TabsTrigger>
          <TabsTrigger value="review">Cola de Revisión ({stats.reviewTransactions})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-600">
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
                {rules.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-gray-600">
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
            {rules.map((rule) => (
              <FraudRuleCard
                key={rule.id}
                rule={rule}
                onEdit={handleEditRule}
                onDelete={handleDeleteClick}
                onToggle={toggleRule}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
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
                          <h3 className="font-medium text-lg">
                            ${transaction.amount_brutto.toLocaleString()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {transaction.cardholder?.full_name} - {transaction.external_reference}
                          </p>
                        </div>
                        <Badge variant="secondary">En Revisión</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleTransactionAction(transaction.id, 'approve')}
                        >
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleTransactionAction(transaction.id, 'reject')}
                        >
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

      <FraudRuleModal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        onSave={handleSaveRule}
        rule={editingRule}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Regla"
        description="¿Estás seguro de que quieres eliminar esta regla? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default FraudDashboard;
