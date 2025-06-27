
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
export type InstanceTariffConfig = Tables<'instance_tariff_configs'>;
export type OrgFxRate = Tables<'org_fx_rates'>;
export type Allocation = Tables<'allocations'>;

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
  amount_brutto: number;
  rail: 'visa_direct' | 'mastercard_send';
  commission?: number;
  tax?: number;
  processing_fee?: number;
  fx_rate?: number;
  total_debit?: number;
}

export interface CreateCardholderForm {
  full_name: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
}

export interface CreateDepositForm {
  org_wallet_id: string;
  amount: number;
  reference: string;
}

// Tipos para configuración de tarifas
export interface TariffConfigForm {
  transaction_type: TransactionType;
  rail: string;
  commission_percentage: number;
  commission_fixed: number;
  tax_percentage: number;
  processing_fee: number;
  currency: string;
  is_active: boolean;
}

// Tipos para configuración de FX rates
export interface FxRateForm {
  from_currency: string;
  to_currency: string;
  rate: number;
  is_active: boolean;
}

export interface CreateAllocationForm {
  org_wallet_id: string;
  instance_wallet_id: string;
  amount_origin: number;
  fx_rate: number;
  amount_destination: number;
}

// Tipos para conciliación
export interface ReconciliationTransaction {
  id: string;
  created_at: string;
  amount_brutto: number;
  amount_net: number;
  commission: number;
  tax: number;
  status: TransactionStatus;
  rail: string;
  type: TransactionType;
  fx_rate: number;
  instance_id: string;
  instance_name: string;
  settlement_currency: string;
  cardholder_id: string;
  cardholder_name: string;
  external_reference?: string;
}

export interface ReconciliationFilters {
  instance_id?: string;
  date_from?: string;
  date_to?: string;
  transaction_type?: TransactionType;
  rail?: string;
  status?: TransactionStatus;
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
