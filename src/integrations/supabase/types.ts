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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          authentication: Json | null
          created_at: string
          customer_id: string
          end_date: string | null
          id: string
          installation_address: Json | null
          organization_id: string
          plan_id: string
          signed_at: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          authentication?: Json | null
          created_at?: string
          customer_id: string
          end_date?: string | null
          id?: string
          installation_address?: Json | null
          organization_id: string
          plan_id: string
          signed_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          authentication?: Json | null
          created_at?: string
          customer_id?: string
          end_date?: string | null
          id?: string
          installation_address?: Json | null
          organization_id?: string
          plan_id?: string
          signed_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json | null
          birth_date: string | null
          coordinates: unknown
          cpf_cnpj: string
          created_at: string
          email: string | null
          financial_score: number | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          rg: string | null
          status: Database["public"]["Enums"]["customer_status"]
          tags: string[] | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          coordinates?: unknown
          cpf_cnpj: string
          created_at?: string
          email?: string | null
          financial_score?: number | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          rg?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tags?: string[] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          coordinates?: unknown
          cpf_cnpj?: string
          created_at?: string
          email?: string | null
          financial_score?: number | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          rg?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tags?: string[] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          barcode: string | null
          contract_id: string | null
          created_at: string
          customer_id: string
          due_date: string
          gateway_id: string | null
          id: string
          organization_id: string
          paid_date: string | null
          payment_method: string | null
          pix_qrcode: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          barcode?: string | null
          contract_id?: string | null
          created_at?: string
          customer_id: string
          due_date: string
          gateway_id?: string | null
          id?: string
          organization_id: string
          paid_date?: string | null
          payment_method?: string | null
          pix_qrcode?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          barcode?: string | null
          contract_id?: string | null
          created_at?: string
          customer_id?: string
          due_date?: string
          gateway_id?: string | null
          id?: string
          organization_id?: string
          paid_date?: string | null
          payment_method?: string | null
          pix_qrcode?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          position: number
          source: Database["public"]["Enums"]["lead_source"] | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          value: number | null
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          position?: number
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          value?: number | null
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position?: number
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          value?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          cnpj: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: Json | null
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: Json | null
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          download_speed: number
          id: string
          loyalty_months: number | null
          name: string
          organization_id: string
          price: number
          technology: Database["public"]["Enums"]["plan_technology"]
          updated_at: string
          upload_speed: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          download_speed: number
          id?: string
          loyalty_months?: number | null
          name: string
          organization_id: string
          price: number
          technology?: Database["public"]["Enums"]["plan_technology"]
          updated_at?: string
          upload_speed: number
        }
        Update: {
          active?: boolean
          created_at?: string
          download_speed?: number
          id?: string
          loyalty_months?: number | null
          name?: string
          organization_id?: string
          price?: number
          technology?: Database["public"]["Enums"]["plan_technology"]
          updated_at?: string
          upload_speed?: number
        }
        Relationships: [
          {
            foreignKeyName: "plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          address: Json | null
          completed_date: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["service_order_status"]
          technician_id: string | null
          type: Database["public"]["Enums"]["service_order_type"]
          updated_at: string
        }
        Insert: {
          address?: Json | null
          completed_date?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          technician_id?: string | null
          type?: Database["public"]["Enums"]["service_order_type"]
          updated_at?: string
        }
        Update: {
          address?: Json | null
          completed_date?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          technician_id?: string | null
          type?: Database["public"]["Enums"]["service_order_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          specialty: Database["public"]["Enums"]["technician_specialty"]
          status: Database["public"]["Enums"]["technician_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          specialty?: Database["public"]["Enums"]["technician_specialty"]
          status?: Database["public"]["Enums"]["technician_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          specialty?: Database["public"]["Enums"]["technician_specialty"]
          status?: Database["public"]["Enums"]["technician_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technicians_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
    }
    Enums: {
      contract_status:
        | "active"
        | "suspended"
        | "cancelled"
        | "awaiting_installation"
        | "awaiting_signature"
      customer_status: "active" | "suspended" | "defaulting" | "cancelled"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      lead_source:
        | "referral"
        | "website"
        | "social_media"
        | "cold_call"
        | "event"
        | "other"
      lead_stage:
        | "new"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      plan_technology: "fiber" | "radio" | "cable" | "other"
      service_order_status: "open" | "in_progress" | "completed" | "cancelled"
      service_order_type:
        | "installation"
        | "maintenance"
        | "technical_visit"
        | "repair"
      technician_specialty:
        | "installation"
        | "maintenance"
        | "support"
        | "general"
      technician_status: "active" | "inactive" | "vacation"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contract_status: [
        "active",
        "suspended",
        "cancelled",
        "awaiting_installation",
        "awaiting_signature",
      ],
      customer_status: ["active", "suspended", "defaulting", "cancelled"],
      invoice_status: ["pending", "paid", "overdue", "cancelled"],
      lead_source: [
        "referral",
        "website",
        "social_media",
        "cold_call",
        "event",
        "other",
      ],
      lead_stage: [
        "new",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      plan_technology: ["fiber", "radio", "cable", "other"],
      service_order_status: ["open", "in_progress", "completed", "cancelled"],
      service_order_type: [
        "installation",
        "maintenance",
        "technical_visit",
        "repair",
      ],
      technician_specialty: [
        "installation",
        "maintenance",
        "support",
        "general",
      ],
      technician_status: ["active", "inactive", "vacation"],
    },
  },
} as const
