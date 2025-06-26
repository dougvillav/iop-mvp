
import { Database } from '@/integrations/supabase/types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

// Tipos principales
export type Organization = Tables<'organizations'>;
export type Instance = Tables<'instances'>;
export type OrgWallet = Tables<'org_wallets'>;
export type InstanceWallet = Tables<'instance_wallets'>;
export type Transaction = Tables<'transactions'>;
export type Cardholder = Tables<'cardholders'>;
export type Dispute = Tables<'disputes'>;
export type UserProfile = Tables<'user_profiles'>;
export type PayoutConfig = Tables<'payout_configs'>;
export type WalletLedger = Tables<'wallet_ledger'>;

// Enums
export type AppRole = Database['public']['Enums']['app_role'];
export type TransactionStatus = Database['public']['Enums']['transaction_status'];
export type TransactionType = Database['public']['Enums']['transaction_type'];
export type DisputeStatus = Database['public']['Enums']['dispute_status'];

// Tipos extendidos para joins
export interface TransactionWithDetails extends Transaction {
  cardholder: Cardholder;
  instance: Instance;
  instance_wallet: InstanceWallet;
}

export interface InstanceWithWallets extends Instance {
  instance_wallets: InstanceWallet[];
}

export interface WalletWithLedger extends OrgWallet {
  wallet_ledger: WalletLedger[];
}

// Tipos para forms
export interface CreatePayoutForm {
  instance_id: string;
  cardholder_id: string;
  amount: number;
  rail: 'visa_direct' | 'mastercard_send';
  commission?: number;
  tax?: number;
}

export interface CreateCardholderForm {
  full_name: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  card_number: string; // Se tokenizará
  expiry_month: string;
  expiry_year: string;
  cvv: string;
}

export interface CreateDepositForm {
  org_wallet_id: string;
  amount: number;
  reference: string;
}

// Tipos para dashboard
export interface DashboardKPIs {
  total_balance: number;
  daily_payouts: number;
  total_commissions: number;
  pending_transactions: number;
  visa_volume: number;
  mastercard_volume: number;
}
