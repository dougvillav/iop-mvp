
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wallet, Plus, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { OrgWallet } from '@/lib/types';

interface WalletCardProps {
  wallet: OrgWallet;
  type: 'org' | 'instance';
  onDeposit?: () => void;
  onAllocate?: () => void;
}

export const WalletCard = ({ wallet, type, onDeposit, onAllocate }: WalletCardProps) => {
  const balance = Number(wallet.balance_available);
  const threshold = Number(wallet.threshold_min);
  
  const getStatusColor = () => {
    if (balance > threshold) return 'bg-green-100 text-green-800';
    if (balance > threshold * 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (balance > threshold) return 'Saludable';
    if (balance > threshold * 0.5) return 'Atención';
    return 'Crítico';
  };

  const formatBalance = (value: number): string => {
    return formatCurrency(value, wallet.currency);
  };

  const formatThreshold = (value: number): string => {
    return formatCurrency(value, wallet.currency);
  };

  return (
    <TooltipProvider>
      <Card className="hover:shadow-md transition-shadow min-h-[240px] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between min-w-0">
            <CardTitle className="text-lg flex items-center min-w-0 flex-1">
              <Wallet className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
              <span className="truncate">{wallet.currency}</span>
            </CardTitle>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xl font-bold text-gray-900 break-words cursor-help">
                  {formatBalance(balance)}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>Balance exacto: {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: wallet.currency
                }).format(balance)}</p>
              </TooltipContent>
            </Tooltip>
            <p className="text-sm text-gray-500">Balance disponible</p>
          </div>
          
          <div className="text-sm text-gray-600 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="break-words cursor-help">
                  Umbral mínimo: {formatThreshold(threshold)}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>Umbral exacto: {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: wallet.currency
                }).format(threshold)}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                balance > threshold 
                  ? 'bg-green-500' 
                  : balance > threshold * 0.5 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.min(100, Math.max(2, (balance / (threshold * 2)) * 100))}%` 
              }}
            />
          </div>

          {type === 'org' && (
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={onDeposit}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 min-w-0"
              >
                <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Depósito</span>
              </Button>
              <Button
                onClick={onAllocate}
                size="sm"
                variant="outline"
                className="flex-1 min-w-0"
              >
                <ArrowUpDown className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Asignar</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
