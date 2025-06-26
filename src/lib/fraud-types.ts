
import { Database } from '@/integrations/supabase/types';
import type { Transaction, Cardholder, Instance, InstanceWallet } from '@/lib/types';

// Extender TransactionWithDetails desde los tipos existentes
export interface TransactionWithDetails extends Transaction {
  cardholder: Cardholder;
  instance: Instance;
  instance_wallet: InstanceWallet;
}

// Tipos para el sistema anti-fraude
export type FraudRule = {
  id: string;
  name: string;
  description: string;
  condition_type: 'amount_threshold' | 'velocity' | 'blacklist' | 'geographic' | 'ml_score';
  condition_value: Record<string, any>;
  action: 'block' | 'review' | 'flag';
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FraudEvaluation = {
  id: string;
  transaction_id: string;
  rule_id: string;
  risk_score: number;
  evaluation_result: 'pass' | 'fail' | 'review';
  evaluation_data: Record<string, any>;
  created_at: string;
};

export type FraudAlert = {
  id: string;
  transaction_id: string;
  alert_type: 'high_risk' | 'suspicious_pattern' | 'rule_violation' | 'ml_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
};

export type FraudDashboardMetrics = {
  total_transactions: number;
  flagged_transactions: number;
  blocked_transactions: number;
  false_positive_rate: number;
  avg_risk_score: number;
  daily_fraud_volume: Array<{
    date: string;
    flagged: number;
    blocked: number;
    total: number;
  }>;
  rule_performance: Array<{
    rule_name: string;
    triggers: number;
    false_positives: number;
    accuracy: number;
  }>;
};

export interface MLAnalysisResult {
  risk_score: number;
  confidence: number;
  risk_factors: string[];
  anomaly_detected: boolean;
}
