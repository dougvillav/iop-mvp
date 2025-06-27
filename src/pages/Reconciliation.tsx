
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Filter, Calendar, Building2, DollarSign, TrendingUp, CreditCard, AlertTriangle, User, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import type { ReconciliationTransaction, ReconciliationFilters, Instance } from '@/lib/types';
import { DateRange } from 'react-day-picker';

const Reconciliation = () => {
  const [data, setData] = useState<ReconciliationTransaction[]>([]);
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
        .from('transactions')
        .select(`
          *,
          instances!inner(id, legal_name, settlement_currency, fx_rate),
          cardholders!inner(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.instance_id) {
        query = query.eq('instance_id', filters.instance_id);
      }
      if (filters.transaction_type) {
        query = query.eq('type', filters.transaction_type);
      }
      if (filters.rail) {
        query = query.eq('rail', filters.rail);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('created_at', `${filters.date_from}T00:00:00.000Z`);
      }
      if (filters.date_to) {
        query = query.lte('created_at', `${filters.date_to}T23:59:59.999Z`);
      }

      const { data: rawData, error } = await query;

      if (error) throw error;

      // Transform data to match ReconciliationTransaction interface
      const transformedData: ReconciliationTransaction[] = (rawData || []).map(transaction => ({
        id: transaction.id,
        created_at: transaction.created_at || '',
        amount_brutto: Number(transaction.amount_brutto) || 0,
        amount_net: Number(transaction.amount_net) || 0,
        commission: Number(transaction.commission) || 0,
        tax: Number(transaction.tax) || 0,
        status: transaction.status || 'pending',
        rail: transaction.rail || '',
        type: transaction.type,
        fx_rate: Number(transaction.fx_rate) || 1,
        instance_id: transaction.instance_id || '',
        instance_name: (transaction.instances as any)?.legal_name || 'N/A',
        settlement_currency: (transaction.instances as any)?.settlement_currency || 'USD',
        cardholder_id: transaction.cardholder_id || '',
        cardholder_name: (transaction.cardholders as any)?.full_name || 'N/A',
        external_reference: transaction.external_reference || undefined,
      }));

      setData(transformedData);
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
        'ID Transacción',
        'Fecha',
        'Instancia',
        'Tarjetahabiente',
        'Tipo de Transacción',
        'Rail',
        'Estado',
        'Monto Bruto',
        'Comisión',
        'Impuesto',
        'Monto Neto',
        'Tipo de Cambio',
        'Referencia Externa'
      ];

      const csvRows = exportData.map(item => [
        item.id,
        item.created_at ? new Date(item.created_at).toLocaleDateString('es-MX') : '-',
        item.instance_name,
        item.cardholder_name,
        item.type === 'pay_out' ? 'Payout' : 'Pay-in',
        item.rail || '-',
        item.status === 'completed' ? 'Completada' : 
        item.status === 'pending' ? 'Pendiente' : 
        item.status === 'failed' ? 'Fallida' : 'Disputada',
        `${item.amount_brutto.toFixed(2)} ${item.settlement_currency}`,
        `${item.commission.toFixed(2)} ${item.settlement_currency}`,
        `${item.tax.toFixed(2)} ${item.settlement_currency}`,
        `${item.amount_net.toFixed(2)} ${item.settlement_currency}`,
        item.fx_rate.toFixed(4),
        item.external_reference || '-'
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
      link.setAttribute('download', `transacciones_conciliacion_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Éxito',
        description: `Reporte exportado correctamente (${exportData.length} transacciones)`,
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
    const totalProcessed = data.reduce((sum, item) => sum + item.amount_brutto, 0);
    const totalCommissions = data.reduce((sum, item) => sum + item.commission, 0);
    const totalTax = data.reduce((sum, item) => sum + item.tax, 0);
    const totalTransactions = data.length;
    const completedTransactions = data.filter(item => item.status === 'completed').length;

    return {
      totalProcessed,
      totalCommissions,
      totalTax,
      totalTransactions,
      completedTransactions,
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
          <p className="text-gray-600">Monitoreo de transacciones individuales y comisiones</p>
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
              {kpis.completedTransactions} de {kpis.totalTransactions} completadas
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
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.totalTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.completedTransactions} completadas
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value === 'all' ? undefined : (value as any)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="failed">Fallida</SelectItem>
                  <SelectItem value="disputed">Disputada</SelectItem>
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

      {/* Tabla de Transacciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transacciones de Conciliación</CardTitle>
            {data.length > 0 && (
              <div className="text-sm text-gray-500">
                {data.length} transacciones encontradas
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
            <div className="text-center py-8">Cargando transacciones...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron transacciones para los filtros seleccionados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Instancia</th>
                    <th className="text-left p-2">Tarjetahabiente</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Rail</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-right p-2">Monto Bruto</th>
                    <th className="text-right p-2">Comisión</th>
                    <th className="text-right p-2">Imp.</th>
                    <th className="text-right p-2">Neto</th>
                    <th className="text-right p-2">FX</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3 w-3 text-gray-400" />
                          <span className="text-xs font-mono">
                            {item.id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('es-MX') : '-'}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{item.instance_name}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{item.cardholder_name}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={item.type === 'pay_out' ? 'default' : 'secondary'}>
                          {item.type === 'pay_out' ? 'Payout' : 'Pay-in'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {item.rail || '-'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge 
                          variant={
                            item.status === 'completed' ? 'default' : 
                            item.status === 'pending' ? 'secondary' : 
                            item.status === 'failed' ? 'destructive' : 'outline'
                          }
                        >
                          {item.status === 'completed' ? 'Completada' : 
                           item.status === 'pending' ? 'Pendiente' : 
                           item.status === 'failed' ? 'Fallida' : 'Disputada'}
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(item.amount_brutto, item.settlement_currency)}
                      </td>
                      <td className="p-2 text-right text-green-600 font-medium">
                        {formatCurrency(item.commission, item.settlement_currency)}
                      </td>
                      <td className="p-2 text-right text-orange-600 font-medium">
                        {formatCurrency(item.tax, item.settlement_currency)}
                      </td>
                      <td className="p-2 text-right text-blue-600 font-medium">
                        {formatCurrency(item.amount_net, item.settlement_currency)}
                      </td>
                      <td className="p-2 text-right text-gray-600">
                        {item.fx_rate.toFixed(4)}
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
