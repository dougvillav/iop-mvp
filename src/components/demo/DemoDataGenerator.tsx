
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDemoData } from '@/utils/demoData';

export const DemoDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateData = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDemoData();
      toast({
        title: 'Datos de demo generados',
        description: `Se crearon ${result.cardholders} cardholders, ${result.transactions} transacciones y ${result.instance} instancia`,
      });
    } catch (error) {
      toast({
        title: 'Error al generar datos',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Datos de Demo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Genera datos de prueba para cardholders, transacciones e instancias.
        </p>
        <Button
          onClick={handleGenerateData}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            'Generar Datos Demo'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
