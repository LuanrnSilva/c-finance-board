export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          category: string
          created_at: string
          household_id: string
          id: string
          monthly_limit: number
        }
        Insert: {
          category: string
          created_at?: string
          household_id: string
          id?: string
          monthly_limit: number
        }
        Update: {
          category?: string
          created_at?: string
          household_id?: string
          id?: string
          monthly_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          household_id: string
          icon: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          household_id: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          household_id: string
          id: string
          installment_value: number
          name: string
          paid_installments: number
          total_installments: number
          total_value: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          installment_value?: number
          name: string
          paid_installments?: number
          total_installments?: number
          total_value?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          installment_value?: number
          name?: string
          paid_installments?: number
          total_installments?: number
          total_value?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          brand: string
          created_at: string
          credit_limit: number
          household_id: string
          id: string
          last_digits: string
          name: string
          updated_at: string
          used_amount: number
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          credit_limit?: number
          household_id: string
          id?: string
          last_digits: string
          name: string
          updated_at?: string
          used_amount?: number
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          credit_limit?: number
          household_id?: string
          id?: string
          last_digits?: string
          name?: string
          updated_at?: string
          used_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_installments: {
        Row: {
          amortization: number
          balance_after: number
          due_date: string
          fee: number
          financing_id: string
          household_id: string
          id: string
          interest: number
          is_actual: boolean
          number: number
          paid_amount: number | null
          paid_at: string | null
          payment: number
          status: string
        }
        Insert: {
          amortization: number
          balance_after: number
          due_date: string
          fee?: number
          financing_id: string
          household_id: string
          id?: string
          interest: number
          is_actual?: boolean
          number: number
          paid_amount?: number | null
          paid_at?: string | null
          payment: number
          status?: string
        }
        Update: {
          amortization?: number
          balance_after?: number
          due_date?: string
          fee?: number
          financing_id?: string
          household_id?: string
          id?: string
          interest?: number
          is_actual?: boolean
          number?: number
          paid_amount?: number | null
          paid_at?: string | null
          payment?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_installments_financing_id_fkey"
            columns: ["financing_id"]
            isOneToOne: false
            referencedRelation: "financings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_installments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_prepayments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          date: string
          financing_id: string
          household_id: string
          id: string
          installments_removed: number
          interest_saved: number
          mode: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          date: string
          financing_id: string
          household_id: string
          id?: string
          installments_removed: number
          interest_saved: number
          mode: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          date?: string
          financing_id?: string
          household_id?: string
          id?: string
          installments_removed?: number
          interest_saved?: number
          mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_prepayments_financing_id_fkey"
            columns: ["financing_id"]
            isOneToOne: false
            referencedRelation: "financings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_prepayments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      financings: {
        Row: {
          bank: string
          created_at: string
          created_by: string
          first_due_date: string
          fixed_fee: number
          household_id: string
          id: string
          indexed: boolean
          monthly_rate: number
          n_installments: number
          name: string
          principal: number
          rate_confidence: number | null
          rate_source: string
          system: string
        }
        Insert: {
          bank: string
          created_at?: string
          created_by?: string
          first_due_date: string
          fixed_fee?: number
          household_id: string
          id?: string
          indexed?: boolean
          monthly_rate: number
          n_installments: number
          name: string
          principal: number
          rate_confidence?: number | null
          rate_source: string
          system: string
        }
        Update: {
          bank?: string
          created_at?: string
          created_by?: string
          first_due_date?: string
          fixed_fee?: number
          household_id?: string
          id?: string
          indexed?: boolean
          monthly_rate?: number
          n_installments?: number
          name?: string
          principal?: number
          rate_confidence?: number | null
          rate_source?: string
          system?: string
        }
        Relationships: [
          {
            foreignKeyName: "financings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          date: string
          goal_id: string
          household_id: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          date?: string
          goal_id: string
          household_id: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          date?: string
          goal_id?: string
          household_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string
          deadline: string | null
          household_id: string
          id: string
          name: string
          target_amount: number
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string
          deadline?: string | null
          household_id: string
          id?: string
          name: string
          target_amount: number
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string
          deadline?: string | null
          household_id?: string
          id?: string
          name?: string
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          household_id: string
          id: string
          invited_by: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          household_id: string
          id?: string
          invited_by: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_by?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          created_at: string
          household_id: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_overrides: {
        Row: {
          category: string
          created_at: string
          created_by: string
          household_id: string
          id: string
          normalized_description: string
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string
          household_id: string
          id?: string
          normalized_description: string
          status: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          normalized_description?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_overrides_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          card_brand: string | null
          category: string
          created_at: string
          credit_card_id: string | null
          date: string
          description: string
          dispute_note: string | null
          financing_installment_id: string | null
          household_id: string
          id: string
          installment_current: number | null
          installment_group_id: string | null
          installment_total: number | null
          person_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount: number
          card_brand?: string | null
          category: string
          created_at?: string
          credit_card_id?: string | null
          date?: string
          description: string
          dispute_note?: string | null
          financing_installment_id?: string | null
          household_id: string
          id?: string
          installment_current?: number | null
          installment_group_id?: string | null
          installment_total?: number | null
          person_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount?: number
          card_brand?: string | null
          category?: string
          created_at?: string
          credit_card_id?: string | null
          date?: string
          description?: string
          dispute_note?: string | null
          financing_installment_id?: string | null
          household_id?: string
          id?: string
          installment_current?: number | null
          installment_group_id?: string | null
          installment_total?: number | null
          person_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_financing_installment_id_fkey"
            columns: ["financing_installment_id"]
            isOneToOne: false
            referencedRelation: "financing_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_household_invite: {
        Args: { _migrate_data?: boolean; _token: string }
        Returns: string
      }
      apply_financing_prepayment: {
        Args: {
          _amount: number
          _date: string
          _expected: Json
          _id: string
          _interest_saved: number
          _mode: string
          _schedule: Json
        }
        Returns: undefined
      }
      create_financing: {
        Args: { _input: Json; _schedule: Json }
        Returns: string
      }
      current_household_id: { Args: never; Returns: string }
      ensure_household: { Args: never; Returns: string }
      household_member_count: {
        Args: { _household_id: string }
        Returns: number
      }
      is_household_member: { Args: { _household_id: string }; Returns: boolean }
      is_household_owner: { Args: { _household_id: string }; Returns: boolean }
      pay_financing_installment: {
        Args: {
          _amount: number
          _category?: string
          _date: string
          _id: string
          _prepaid?: boolean
        }
        Returns: undefined
      }
      shares_household: { Args: { _other: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
