import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Filter, Calendar, Building2, DollarSign, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import type { ReconciliationData, ReconciliationFilters, Instance } from '@/lib/types';
import { DateRange } from 'react-day-picker';

const Reconciliation = () => {
  const [data, setData] = useState<ReconciliationData[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState<ReconciliationFilters>({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .order('legal_name');

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('Error loading instances:', error);
    }
  };

  const loadReconciliationData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reconciliation_data')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (filters.instance_id) {
        query = query.eq('instance_id', filters.instance_id);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.rail) {
        query = query.eq('rail', filters.rail);
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      setData(data || []);
    } catch (error) {
      console.error('Error loading reconciliation data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de conciliación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Check if data exceeds 100 lines
      if (data.length > 100) {
        toast({
          title: 'Límite de Exportación',
          description: `Solo se exportarán las primeras 100 líneas de ${data.length} registros encontrados.`,
          variant: 'default',
        });
      }

      // Prepare CSV data (first 100 records)
      const exportData = data.slice(0, 100);
      
      const csvHeaders = [
        'Fecha',
        'Instancia',
        'Tipo de Transacción',
        'Rail',
        'Transacciones Completadas',
        'Total Procesado',
        'Comisiones',
        'Impuestos',
        'Ingresos Netos'
      ];

      const csvRows = exportData.map(item => [
        item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('es-MX') : '-',
        item.instance_name || '-',
        item.transaction_type === 'pay_out' ? 'Payout' : 'Pay-in',
        item.rail || '-',
        Number(item.completed_transactions || 0).toLocaleString(),
        `${Number(item.total_processed || 0).toFixed(2)} ${item.settlement_currency}`,
        `${Number(item.total_commission || 0).toFixed(2)} ${item.settlement_currency}`,
        `${Number(item.total_tax || 0).toFixed(2)} ${item.settlement_currency}`,
        `${Number(item.total_net || 0).toFixed(2)} ${item.settlement_currency}`
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_conciliacion_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Éxito',
        description: `Reporte exportado correctamente (${exportData.length} registros)`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el reporte',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setFilters(prev => ({
        ...prev,
        date_from: range.from!.toISOString().split('T')[0],
        date_to: range.to!.toISOString().split('T')[0],
      }));
    }
  };

  const calculateKPIs = () => {
    const totalProcessed = data.reduce((sum, item) => sum + (Number(item.total_processed) || 0), 0);
    const totalCommissions = data.reduce((sum, item) => sum + (Number(item.total_commission) || 0), 0);
    const totalTax = data.reduce((sum, item) => sum + (Number(item.total_tax) || 0), 0);
    const totalTransactions = data.reduce((sum, item) => sum + (Number(item.completed_transactions) || 0), 0);

    return {
      totalProcessed,
      totalCommissions,
      totalTax,
      totalTransactions,
    };
  };

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    loadReconciliationData();
  }, [filters]);

  const kpis = calculateKPIs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conciliación</h1>
          <p className="text-gray-600">Monitoreo de ingresos y comisiones por transacciones procesadas</p>
        </div>
        <div className="flex items-center gap-2">
          {data.length > 100 && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Exportación limitada a 100 líneas</span>
            </div>
          )}
          <Button onClick={handleExport} disabled={exporting} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procesado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalProcessed, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.totalTransactions} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Cobradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalCommissions, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.totalProcessed > 0 ? ((kpis.totalCommissions / kpis.totalProcessed) * 100).toFixed(2) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impuestos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalTax, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              Impuestos recolectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalCommissions + kpis.totalTax, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              Comisiones + Impuestos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Rango de Fechas</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={handleDateRangeChange}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Instancia</Label>
              <Select
                value={filters.instance_id || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  instance_id: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las instancias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las instancias</SelectItem>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Transacción</Label>
              <Select
                value={filters.transaction_type || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  transaction_type: value === 'all' ? undefined : (value as any)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="pay_out">Payout</SelectItem>
                  <SelectItem value="pay_in">Pay-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rail</Label>
              <Select
                value={filters.rail || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  rail: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los rails" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los rails</SelectItem>
                  <SelectItem value="visa_direct">Visa Direct</SelectItem>
                  <SelectItem value="mastercard_send">Mastercard Send</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={loadReconciliationData}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Cargando...' : 'Aplicar Filtros'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Datos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datos de Conciliación</CardTitle>
            {data.length > 0 && (
              <div className="text-sm text-gray-500">
                {data.length} registros encontrados
                {data.length > 100 && (
                  <span className="text-amber-600 ml-2">
                    (CSV limitado a 100)
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando datos de conciliación...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron datos para los filtros seleccionados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Instancia</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Rail</th>
                    <th className="text-right p-2">Transacciones</th>
                    <th className="text-right p-2">Total Procesado</th>
                    <th className="text-right p-2">Comisiones</th>
                    <th className="text-right p-2">Impuestos</th>
                    <th className="text-right p-2">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('es-MX') : '-'}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {item.instance_name}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={item.transaction_type === 'pay_out' ? 'default' : 'secondary'}>
                          {item.transaction_type === 'pay_out' ? 'Payout' : 'Pay-in'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {item.rail || '-'}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        {Number(item.completed_transactions || 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(Number(item.total_processed || 0), item.settlement_currency)}
                      </td>
                      <td className="p-2 text-right text-green-600 font-medium">
                        {formatCurrency(Number(item.total_commission || 0), item.settlement_currency)}
                      </td>
                      <td className="p-2 text-right text-orange-600 font-medium">
                        {formatCurrency(Number(item.total_tax || 0), item.settlement_currency)}
                      </td>
                      <td className="p-2 text-right text-blue-600 font-medium">
                        {formatCurrency(Number(item.total_net || 0), item.settlement_currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reconciliation;
