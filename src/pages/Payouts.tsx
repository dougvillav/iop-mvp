
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PayoutWizard } from '@/components/payouts/PayoutWizard';
import { RecentPayouts } from '@/components/payouts/RecentPayouts';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Payouts = () => {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procesamiento de Payouts</h1>
          <p className="text-gray-600 mt-1">Gestiona y procesa pagos a cardholders</p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Payout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Últimos payouts procesados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentPayouts />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rails Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Visa Direct</p>
                  <p className="text-xs text-blue-600">Rápido y confiable</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">MasterCard Send</p>
                  <p className="text-xs text-red-600">Global coverage</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Límites Diarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Visa Direct</span>
                <span className="font-medium">$100,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>MasterCard Send</span>
                <span className="font-medium">$75,000</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PayoutWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => setWizardOpen(false)}
      />
    </div>
  );
};

export default Payouts;
