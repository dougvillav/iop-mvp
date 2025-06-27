
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  borderColor?: string;
}

export const KPICard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className,
  borderColor = "border-l-blue-500"
}: KPICardProps) => {
  return (
    <Card className={cn("border-l-4 transition-all hover:shadow-md", borderColor, className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center text-xs mt-2">
                <span className={cn(
                  "font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-gray-500 ml-1">vs mes anterior</span>
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
};
