
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, X } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransactionFiltersProps {
  onFiltersChange: (filters: {
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  }) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const TransactionFilters = ({ 
  onFiltersChange, 
  searchTerm, 
  onSearchChange 
}: TransactionFiltersProps) => {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('');

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    
    const filters: any = { searchTerm };
    if (from) filters.dateFrom = startOfDay(new Date(from));
    if (to) filters.dateTo = endOfDay(new Date(to));
    
    onFiltersChange(filters);
  };

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (preset) {
      case 'today':
        from = today;
        break;
      case 'week':
        from = subWeeks(today, 1);
        break;
      case 'month':
        from = subMonths(today, 1);
        break;
      default:
        return;
    }

    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');
    
    setDateFrom(fromStr);
    setDateTo(toStr);
    handleDateChange(fromStr, toStr);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setActivePreset('');
    onFiltersChange({ searchTerm });
  };

  const hasFilters = dateFrom || dateTo;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activePreset === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('today')}
            >
              Hoy
            </Button>
            <Button
              variant={activePreset === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('week')}
            >
              Última semana
            </Button>
            <Button
              variant={activePreset === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('month')}
            >
              Último mes
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Custom date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">Fecha desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateChange(e.target.value, dateTo)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Fecha hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => handleDateChange(dateFrom, e.target.value)}
              />
            </div>
          </div>

          {/* Active filters display */}
          {hasFilters && (
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtros activos:</span>
              {dateFrom && (
                <Badge variant="secondary">
                  Desde: {format(new Date(dateFrom), 'dd/MM/yyyy', { locale: es })}
                </Badge>
              )}
              {dateTo && (
                <Badge variant="secondary">
                  Hasta: {format(new Date(dateTo), 'dd/MM/yyyy', { locale: es })}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
