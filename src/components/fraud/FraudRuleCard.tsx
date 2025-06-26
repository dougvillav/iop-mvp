
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, AlertTriangle, Shield, Eye } from 'lucide-react';
import { truncateText } from '@/lib/formatters';
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
        return `> ${conditionValue.max_transactions || 0} tx en ${conditionValue.time_window_hours || 1}h`;
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

  const conditionText = formatConditions(rule.condition_type, rule.condition_value);
  const truncatedCondition = truncateText(conditionText, 50);
  const shouldTruncate = conditionText.length > 50;

  return (
    <TooltipProvider>
      <Card className={`transition-all hover:shadow-md min-h-[280px] overflow-hidden ${rule.is_active ? 'border-green-200 bg-green-50/30' : 'border-gray-200 opacity-75'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between min-w-0">
            <div className="flex-1 min-w-0 pr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-lg truncate cursor-help">{rule.name}</CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{rule.name}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 cursor-help">{rule.description}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{rule.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={getPriorityColor(rule.priority) as any} className="text-xs">
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-gray-700 flex-shrink-0">Tipo:</span>
              <Badge variant="outline" className="text-xs truncate">
                {rule.condition_type.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-gray-700 flex-shrink-0">Acción:</span>
              <Badge variant={getActionColor(rule.action) as any} className="flex items-center gap-1 text-xs">
                {getActionIcon(rule.action)}
                <span className="capitalize truncate">{rule.action}</span>
              </Badge>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Condición:</span>
            </div>
            {shouldTruncate ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-gray-900 font-mono cursor-help break-words">
                    {truncatedCondition}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs font-mono text-xs">{conditionText}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-sm text-gray-900 font-mono break-words">
                {conditionText}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(rule)}
              className="text-blue-600 hover:text-blue-700 flex-shrink-0"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(rule.id)}
              className="text-red-600 hover:text-red-700 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
