
import { pipeline } from '@huggingface/transformers';

// Cache para los modelos ML
let textClassifier: any = null;
let embeddingModel: any = null;

// Inicializar modelos ML
export const initializeFraudModels = async () => {
  try {
    console.log('Inicializando modelos ML para detección de fraude...');
    
    // Modelo para clasificación de texto (analizar descripciones sospechosas)
    if (!textClassifier) {
      textClassifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
    }

    // Modelo para embeddings (análisis de patrones)
    if (!embeddingModel) {
      embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }

    console.log('Modelos ML inicializados correctamente');
    return { textClassifier, embeddingModel };
  } catch (error) {
    console.error('Error inicializando modelos ML:', error);
    return { textClassifier: null, embeddingModel: null };
  }
};

// Análisis ML de transacciones
export const analyzeFraudML = async (transactionData: {
  amount: number;
  currency: string;
  cardholder_name?: string;
  external_reference?: string;
  rail?: string;
  country?: string;
  time_of_day?: number;
  day_of_week?: number;
}) => {
  try {
    await initializeFraudModels();
    
    let riskScore = 0;
    let confidenceScore = 0;
    const riskFactors: string[] = [];

    // 1. Análisis de monto (reglas heurísticas)
    if (transactionData.amount > 10000) {
      riskScore += 30;
      riskFactors.push('Monto alto');
    } else if (transactionData.amount > 5000) {
      riskScore += 15;
      riskFactors.push('Monto medio-alto');
    }

    // 2. Análisis de hora (transacciones nocturnas son más riesgosas)
    if (transactionData.time_of_day && (transactionData.time_of_day < 6 || transactionData.time_of_day > 23)) {
      riskScore += 20;
      riskFactors.push('Transacción fuera de horario normal');
    }

    // 3. Análisis de día de semana
    if (transactionData.day_of_week && (transactionData.day_of_week === 0 || transactionData.day_of_week === 6)) {
      riskScore += 10;
      riskFactors.push('Transacción en fin de semana');
    }

    // 4. Análisis de texto si hay referencia externa
    if (textClassifier && transactionData.external_reference) {
      try {
        const textAnalysis = await textClassifier(transactionData.external_reference);
        if (textAnalysis && textAnalysis[0]?.label === 'NEGATIVE' && textAnalysis[0]?.score > 0.8) {
          riskScore += 25;
          riskFactors.push('Referencia sospechosa detectada por ML');
        }
      } catch (error) {
        console.log('Error en análisis de texto:', error);
      }
    }

    // 5. Análisis de país de riesgo
    const highRiskCountries = ['XX', 'YY']; // Países de alto riesgo (ejemplo)
    if (transactionData.country && highRiskCountries.includes(transactionData.country)) {
      riskScore += 35;
      riskFactors.push('País de alto riesgo');
    }

    // Normalizar score a 0-100
    riskScore = Math.min(riskScore, 100);
    confidenceScore = riskFactors.length > 0 ? Math.min(riskFactors.length * 20, 100) : 50;

    const anomalyDetected = riskScore > 60;

    return {
      risk_score: riskScore,
      confidence: confidenceScore,
      risk_factors: riskFactors,
      anomaly_detected: anomalyDetected
    };
  } catch (error) {
    console.error('Error en análisis ML:', error);
    return {
      risk_score: 0,
      confidence: 0,
      risk_factors: ['Error en análisis ML'],
      anomaly_detected: false
    };
  }
};

// Análisis de patrones de comportamiento
export const analyzeUserBehavior = async (userTransactions: Array<{
  amount: number;
  created_at: string;
  status: string;
}>) => {
  try {
    if (userTransactions.length < 2) {
      return { pattern_risk: 0, velocity_risk: 0, anomaly_score: 0 };
    }

    // Análisis de velocidad de transacciones
    const recentTransactions = userTransactions
      .filter(t => {
        const transactionDate = new Date(t.created_at);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return transactionDate > oneDayAgo;
      });

    const velocityRisk = recentTransactions.length > 5 ? 80 : recentTransactions.length * 15;

    // Análisis de patrones de monto
    const amounts = userTransactions.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    
    const patternRisk = maxAmount > avgAmount * 3 ? 60 : 0;

    // Score de anomalía general
    const anomalyScore = Math.min((velocityRisk + patternRisk) / 2, 100);

    return {
      pattern_risk: patternRisk,
      velocity_risk: velocityRisk,
      anomaly_score: anomalyScore
    };
  } catch (error) {
    console.error('Error en análisis de comportamiento:', error);
    return { pattern_risk: 0, velocity_risk: 0, anomaly_score: 0 };
  }
};
