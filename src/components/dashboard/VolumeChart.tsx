
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VolumeChartProps {
  data: Array<{
    date: string;
    visa_direct: number;
    mastercard_send: number;
  }>;
}

export const VolumeChart = ({ data }: VolumeChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volumen de Transacciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              formatter={(value: number) => [
                new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value),
                ''
              ]}
            />
            <Legend />
            <Bar 
              dataKey="visa_direct" 
              fill="#1d4ed8" 
              name="Visa Direct"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="mastercard_send" 
              fill="#dc2626" 
              name="MasterCard Send"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
