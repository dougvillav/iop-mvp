
import { supabase } from '@/integrations/supabase/client';

export const simulateTransactionProcessing = async () => {
  try {
    // Llamar a la función de Supabase para simular estados
    const { error } = await supabase.rpc('simulate_transaction_status');
    
    if (error) {
      console.error('Error simulando estados de transacciones:', error);
    }
  } catch (error) {
    console.error('Error en simulación:', error);
  }
};

// Función para iniciar la simulación automática
export const startTransactionSimulation = () => {
  // Ejecutar inmediatamente
  simulateTransactionProcessing();
  
  // Luego cada 2 minutos
  const interval = setInterval(simulateTransactionProcessing, 120000);
  
  return () => clearInterval(interval);
};
