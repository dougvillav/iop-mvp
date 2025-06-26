
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Eye, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import type { FraudAlert } from '@/lib/fraud-types';

interface FraudAlertCardProps {
  alert: FraudAlert;
  onResolve: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onInvestigate: (alertId: string) => void;
}

export const FraudAlertCard: React.FC<FraudAlertCardProps> = ({
  alert,
  onResolve,
  onDismiss,
  onInvestigate,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'investigating':
        return 'default';
      case 'resolved':
        return 'secondary';
      case 'false_positive':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'high_risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suspicious_pattern':
        return <Eye className="h-4 w-4" />;
      case 'rule_violation':
        return <Shield className="h-4 w-4" />;
      case 'ml_anomaly':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(alert.alert_type)}
            <CardTitle className="text-lg">
              {alert.alert_type.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={getSeverityColor(alert.severity)}>
              {alert.severity.toUpperCase()}
            </Badge>
            <Badge variant={getStatusColor(alert.status)}>
              {alert.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">{alert.message}</p>
        
        <div className="text-xs text-gray-500">
          <div>Transacción ID: {alert.transaction_id}</div>
          <div>Creado: {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm')}</div>
          {alert.assigned_to && <div>Asignado a: {alert.assigned_to}</div>}
        </div>

        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm font-medium">Detalles:</span>
            <pre className="text-xs mt-1 whitespace-pre-wrap">
              {JSON.stringify(alert.metadata, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {alert.status === 'open' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInvestigate(alert.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Investigar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(alert.id)}
            className="text-green-600 hover:text-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Resolver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDismiss(alert.id)}
            className="text-gray-600 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
