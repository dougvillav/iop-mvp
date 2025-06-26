export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      allocations: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          instance_wallet_id: string | null
          org_wallet_id: string | null
          type: Database["public"]["Enums"]["allocation_type"] | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          instance_wallet_id?: string | null
          org_wallet_id?: string | null
          type?: Database["public"]["Enums"]["allocation_type"] | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          instance_wallet_id?: string | null
          org_wallet_id?: string | null
          type?: Database["public"]["Enums"]["allocation_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "allocations_instance_wallet_id_fkey"
            columns: ["instance_wallet_id"]
            isOneToOne: false
            referencedRelation: "instance_wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_org_wallet_id_fkey"
            columns: ["org_wallet_id"]
            isOneToOne: false
            referencedRelation: "org_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      cardholders: {
        Row: {
          address: string | null
          card_brand: string | null
          card_token: string
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          pan_first6: string | null
          pan_last4: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          card_brand?: string | null
          card_token: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          pan_first6?: string | null
          pan_last4?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          card_brand?: string | null
          card_token?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          pan_first6?: string | null
          pan_last4?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          org_wallet_id: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          org_wallet_id?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          org_wallet_id?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_org_wallet_id_fkey"
            columns: ["org_wallet_id"]
            isOneToOne: false
            referencedRelation: "org_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string | null
          evidence_url: string | null
          id: string
          reason: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      instance_payout_configs: {
        Row: {
          created_at: string | null
          instance_id: string
          payout_config_id: string
        }
        Insert: {
          created_at?: string | null
          instance_id: string
          payout_config_id: string
        }
        Update: {
          created_at?: string | null
          instance_id?: string
          payout_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instance_payout_configs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instance_payout_configs_payout_config_id_fkey"
            columns: ["payout_config_id"]
            isOneToOne: false
            referencedRelation: "payout_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      instance_wallets: {
        Row: {
          balance_available: number | null
          currency: string
          id: string
          instance_id: string | null
          org_wallet_id: string | null
          threshold_min: number | null
          updated_at: string | null
        }
        Insert: {
          balance_available?: number | null
          currency: string
          id?: string
          instance_id?: string | null
          org_wallet_id?: string | null
          threshold_min?: number | null
          updated_at?: string | null
        }
        Update: {
          balance_available?: number | null
          currency?: string
          id?: string
          instance_id?: string | null
          org_wallet_id?: string | null
          threshold_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instance_wallets_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instance_wallets_org_wallet_id_fkey"
            columns: ["org_wallet_id"]
            isOneToOne: false
            referencedRelation: "org_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          country_iso: string
          created_at: string | null
          id: string
          legal_name: string
          organization_id: string | null
          registration_id: string | null
          settlement_currency: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          country_iso: string
          created_at?: string | null
          id?: string
          legal_name: string
          organization_id?: string | null
          registration_id?: string | null
          settlement_currency: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          country_iso?: string
          created_at?: string | null
          id?: string
          legal_name?: string
          organization_id?: string | null
          registration_id?: string | null
          settlement_currency?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_wallets: {
        Row: {
          balance_available: number | null
          currency: string
          id: string
          organization_id: string | null
          threshold_min: number | null
          updated_at: string | null
        }
        Insert: {
          balance_available?: number | null
          currency: string
          id?: string
          organization_id?: string | null
          threshold_min?: number | null
          updated_at?: string | null
        }
        Update: {
          balance_available?: number | null
          currency?: string
          id?: string
          organization_id?: string | null
          threshold_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_wallets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          commercial_name: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          commercial_name: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          commercial_name?: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payout_configs: {
        Row: {
          acquirer_bin: string
          created_at: string | null
          daily_limit: number | null
          id: string
          issuer_bin: string
          rail: string
          settlement_account: string
          status: string | null
        }
        Insert: {
          acquirer_bin: string
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          issuer_bin: string
          rail: string
          settlement_account: string
          status?: string | null
        }
        Update: {
          acquirer_bin?: string
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          issuer_bin?: string
          rail?: string
          settlement_account?: string
          status?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_brutto: number
          amount_net: number
          cardholder_id: string | null
          commission: number | null
          created_at: string | null
          external_reference: string | null
          fx_rate: number | null
          id: string
          instance_id: string | null
          instance_wallet_id: string | null
          rail: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          tax: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount_brutto: number
          amount_net: number
          cardholder_id?: string | null
          commission?: number | null
          created_at?: string | null
          external_reference?: string | null
          fx_rate?: number | null
          id?: string
          instance_id?: string | null
          instance_wallet_id?: string | null
          rail?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tax?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount_brutto?: number
          amount_net?: number
          cardholder_id?: string | null
          commission?: number | null
          created_at?: string | null
          external_reference?: string | null
          fx_rate?: number | null
          id?: string
          instance_id?: string | null
          instance_wallet_id?: string | null
          rail?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tax?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cardholder_id_fkey"
            columns: ["cardholder_id"]
            isOneToOne: false
            referencedRelation: "cardholders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_instance_wallet_id_fkey"
            columns: ["instance_wallet_id"]
            isOneToOne: false
            referencedRelation: "instance_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          created_by: string | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          id: string
          reference: string | null
          transaction_id: string | null
          wallet_id: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          created_by?: string | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          id?: string
          reference?: string | null
          transaction_id?: string | null
          wallet_id: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          created_by?: string | null
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          reference?: string | null
          transaction_id?: string | null
          wallet_id?: string
          wallet_type?: Database["public"]["Enums"]["wallet_type"]
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_deposit: {
        Args: { p_org_wallet_id: string; p_amount: number; p_reference: string }
        Returns: string
      }
      create_instance_wallets: {
        Args: { p_instance_id: string; p_settlement_currency: string }
        Returns: undefined
      }
      create_payout: {
        Args: {
          p_instance_id: string
          p_cardholder_id: string
          p_amount: number
          p_rail: string
          p_commission?: number
          p_tax?: number
        }
        Returns: string
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      allocation_type: "allocation" | "return"
      app_role: "admin" | "operator" | "readonly"
      dispute_status: "open" | "under_review" | "resolved" | "closed"
      entry_type:
        | "deposit"
        | "allocation_in"
        | "allocation_out"
        | "payout"
        | "refund"
      transaction_status: "pending" | "completed" | "failed" | "disputed"
      transaction_type: "pay_in" | "pay_out"
      wallet_type: "org" | "instance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      allocation_type: ["allocation", "return"],
      app_role: ["admin", "operator", "readonly"],
      dispute_status: ["open", "under_review", "resolved", "closed"],
      entry_type: [
        "deposit",
        "allocation_in",
        "allocation_out",
        "payout",
        "refund",
      ],
      transaction_status: ["pending", "completed", "failed", "disputed"],
      transaction_type: ["pay_in", "pay_out"],
      wallet_type: ["org", "instance"],
    },
  },
} as const
