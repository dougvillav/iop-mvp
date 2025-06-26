
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, CheckCircle } from 'lucide-react';

interface RiskScoreBadgeProps {
  riskScore: number;
  showIcon?: boolean;
  showScore?: boolean;
}

export const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({
  riskScore,
  showIcon = true,
  showScore = true,
}) => {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'critical', color: 'destructive', icon: AlertTriangle };
    if (score >= 60) return { level: 'high', color: 'destructive', icon: Eye };
    if (score >= 40) return { level: 'medium', color: 'default', icon: Shield };
    return { level: 'low', color: 'secondary', icon: CheckCircle };
  };

  const risk = getRiskLevel(riskScore);
  const IconComponent = risk.icon;

  return (
    <Badge variant={risk.color as any} className="flex items-center gap-1">
      {showIcon && <IconComponent className="h-3 w-3" />}
      <span className="capitalize">{risk.level}</span>
      {showScore && <span>({riskScore})</span>}
    </Badge>
  );
};
