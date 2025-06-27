
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InstanceSelection } from './steps/InstanceSelection';
import { CardholderSelection } from './steps/CardholderSelection';
import { PayoutConfiguration } from './steps/PayoutConfiguration';
import { PayoutConfirmation } from './steps/PayoutConfirmation';
import { useToast } from '@/hooks/use-toast';
import type { Instance, Cardholder } from '@/lib/types';

interface PayoutWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PayoutData {
  instance?: Instance;
  cardholder?: Cardholder;
  amount_brutto?: number; // Monto que recibirá el cardholder
  rail?: 'visa_direct' | 'mastercard_send';
  commission?: number;
  tax?: number;
  processing_fee?: number;
  fx_rate?: number;
  total_debit?: number; // Total a debitar de la wallet
}

export const PayoutWizard = ({ isOpen, onClose, onSuccess }: PayoutWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [payoutData, setPayoutData] = useState<PayoutData>({});
  const { toast } = useToast();

  const steps = [
    { number: 1, title: 'Instancia', description: 'Selecciona la instancia' },
    { number: 2, title: 'Cardholder', description: 'Selecciona el destinatario' },
    { number: 3, title: 'Configuración', description: 'Configura el payout' },
    { number: 4, title: 'Confirmación', description: 'Revisa y confirma' }
  ];

  const createPayoutMutation = useMutation({
    mutationFn: async () => {
      if (!payoutData.instance || !payoutData.cardholder || !payoutData.amount_brutto || !payoutData.rail) {
        throw new Error('Datos incompletos para crear el payout');
      }

      const { data, error } = await supabase.rpc('create_payout', {
        p_instance_id: payoutData.instance.id,
        p_cardholder_id: payoutData.cardholder.id,
        p_amount_brutto: payoutData.amount_brutto,
        p_rail: payoutData.rail,
        p_commission: payoutData.commission || 0,
        p_tax: payoutData.tax || 0
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Payout creado exitosamente',
        description: 'El payout se ha procesado y está pendiente de confirmación',
      });
      handleClose();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error al crear payout',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleClose = () => {
    setCurrentStep(1);
    setPayoutData({});
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = () => {
    createPayoutMutation.mutate();
  };

  const updatePayoutData = (data: Partial<PayoutData>) => {
    setPayoutData(prev => ({ ...prev, ...data }));
  };

  const progress = (currentStep / 4) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Payout</DialogTitle>
          <DialogDescription>
            Sigue los pasos para procesar un payout a un cardholder
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`text-center ${
                  step.number <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-medium ${
                  step.number <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.number}
                </div>
                <p className="text-xs font-medium">{step.title}</p>
              </div>
            ))}
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <InstanceSelection
              selectedInstance={payoutData.instance}
              onSelect={(instance) => updatePayoutData({ instance })}
            />
          )}

          {currentStep === 2 && (
            <CardholderSelection
              selectedCardholder={payoutData.cardholder}
              onSelect={(cardholder) => updatePayoutData({ cardholder })}
            />
          )}

          {currentStep === 3 && payoutData.instance && (
            <PayoutConfiguration
              instance={payoutData.instance}
              data={payoutData}
              onChange={updatePayoutData}
            />
          )}

          {currentStep === 4 && (
            <PayoutConfirmation
              data={payoutData}
              isLoading={createPayoutMutation.isPending}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
            disabled={createPayoutMutation.isPending}
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          <Button
            onClick={currentStep === 4 ? handleConfirm : handleNext}
            disabled={
              createPayoutMutation.isPending ||
              (currentStep === 1 && !payoutData.instance) ||
              (currentStep === 2 && !payoutData.cardholder) ||
              (currentStep === 3 && (!payoutData.amount_brutto || !payoutData.rail))
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createPayoutMutation.isPending 
              ? 'Procesando...' 
              : currentStep === 4 
              ? 'Confirmar Payout' 
              : 'Siguiente'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
