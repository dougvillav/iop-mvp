
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

  return (
    <Card className={`transition-all ${rule.is_active ? 'border-green-200' : 'border-gray-200 opacity-75'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{rule.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(rule.priority)}>
              Prioridad {rule.priority}
            </Badge>
            <Switch
              checked={rule.is_active}
              onCheckedChange={(checked) => onToggle(rule.id, checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{rule.description}</p>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tipo:</span>
            <Badge variant="outline">
              {rule.condition_type.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Acción:</span>
            <Badge variant={getActionColor(rule.action)} className="flex items-center gap-1">
              {getActionIcon(rule.action)}
              {rule.action}
            </Badge>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm font-medium">Condiciones:</span>
          <pre className="text-xs mt-1 whitespace-pre-wrap">
            {JSON.stringify(rule.condition_value, null, 2)}
          </pre>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(rule)}
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
