
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, AlertTriangle, Shield, Eye } from 'lucide-react';
import type { FraudRule } from '@/lib/fraud-types';

interface FraudRuleCardProps {
  rule: FraudRule;
  onEdit: (rule: FraudRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, isActive: boolean) => void;
}

export const FraudRuleCard: React.FC<FraudRuleCardProps> = ({
  rule,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'block':
        return <Shield className="h-4 w-4" />;
      case 'review':
        return <Eye className="h-4 w-4" />;
      case 'flag':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block':
        return 'destructive';
      case 'review':
        return 'default';
      case 'flag':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'destructive';
    if (priority >= 5) return 'default';
    return 'secondary';
  };

  const formatConditions = (conditionType: string, conditionValue: any) => {
    switch (conditionType) {
      case 'amount_threshold':
        return `Monto > $${conditionValue.threshold?.toLocaleString() || 0} ${conditionValue.currency || 'USD'}`;
      case 'velocity':
        return `> ${conditionValue.max_transactions || 0} transacciones en ${conditionValue.time_window_hours || 1}h`;
      case 'blacklist':
        return 'Lista negra activada';
      case 'geographic':
        return `Países: ${conditionValue.countries?.join(', ') || 'No especificado'}`;
      case 'ml_score':
        return `Score ML > ${conditionValue.threshold || 0}`;
      default:
        return 'Condición personalizada';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${rule.is_active ? 'border-green-200 bg-green-50/30' : 'border-gray-200 opacity-75'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{rule.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{rule.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge variant={getPriorityColor(rule.priority) as any}>
              P{rule.priority}
            </Badge>
            <Switch
              checked={rule.is_active}
              onCheckedChange={(checked) => onToggle(rule.id, checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Tipo:</span>
            <Badge variant="outline" className="text-xs">
              {rule.condition_type.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Acción:</span>
            <Badge variant={getActionColor(rule.action) as any} className="flex items-center gap-1">
              {getActionIcon(rule.action)}
              <span className="capitalize">{rule.action}</span>
            </Badge>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Condición:</span>
          </div>
          <p className="text-sm text-gray-900 mt-1 font-mono">
            {formatConditions(rule.condition_type, rule.condition_value)}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(rule)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(rule.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
