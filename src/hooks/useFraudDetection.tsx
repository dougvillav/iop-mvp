
import { useState, useCallback } from 'react';
import { analyzeFraudML, analyzeUserBehavior } from '@/utils/fraud-ml';
import { supabase } from '@/integrations/supabase/client';
import type { MLAnalysisResult } from '@/lib/fraud-types';

export const useFraudDetection = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeTransaction = useCallback(async (transactionData: {
    id: string;
    amount: number;
    currency: string;
    cardholder_id?: string;
    external_reference?: string;
    rail?: string;
    country?: string;
  }): Promise<MLAnalysisResult> => {
    setIsAnalyzing(true);
    
    try {
      const now = new Date();
      const transactionAnalysis = {
        ...transactionData,
        time_of_day: now.getHours(),
        day_of_week: now.getDay(),
      };

      // Análisis ML básico
      const mlResult = await analyzeFraudML(transactionAnalysis);

      // Si hay cardholder, analizar comportamiento histórico
      if (transactionData.cardholder_id) {
        const { data: userTransactions } = await supabase
          .from('transactions')
          .select('amount_brutto, created_at, status')
          .eq('cardholder_id', transactionData.cardholder_id)
          .limit(50)
          .order('created_at', { ascending: false });

        if (userTransactions && userTransactions.length > 0) {
          const behaviorAnalysis = await analyzeUserBehavior(
            userTransactions.map(t => ({
              amount: t.amount_brutto,
              created_at: t.created_at || '',
              status: t.status || 'pending'
            }))
          );

          // Combinar scores
          mlResult.risk_score = Math.max(
            mlResult.risk_score,
            behaviorAnalysis.anomaly_score
          );

          if (behaviorAnalysis.velocity_risk > 50) {
            mlResult.risk_factors.push('Alta velocidad de transacciones');
          }
          if (behaviorAnalysis.pattern_risk > 50) {
            mlResult.risk_factors.push('Patrón de montos anómalo');
          }
        }
      }

      // Log del análisis para debug
      console.log('Análisis de fraude completado:', {
        transaction_id: transactionData.id,
        risk_score: mlResult.risk_score,
        risk_factors: mlResult.risk_factors,
        anomaly_detected: mlResult.anomaly_detected
      });

      return mlResult;
    } catch (error) {
      console.error('Error en análisis de fraude:', error);
      return {
        risk_score: 0,
        confidence: 0,
        risk_factors: ['Error en análisis'],
        anomaly_detected: false
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const shouldBlockTransaction = (riskScore: number): boolean => {
    return riskScore >= 80;
  };

  const shouldReviewTransaction = (riskScore: number): boolean => {
    return riskScore >= 60 && riskScore < 80;
  };

  const shouldFlagTransaction = (riskScore: number): boolean => {
    return riskScore >= 40 && riskScore < 60;
  };

  return {
    analyzeTransaction,
    shouldBlockTransaction,
    shouldReviewTransaction,
    shouldFlagTransaction,
    isAnalyzing
  };
};
