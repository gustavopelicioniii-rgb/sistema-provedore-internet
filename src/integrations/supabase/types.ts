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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          organization_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          organization_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          organization_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          automation_id: string
          error_message: string | null
          executed_at: string
          id: string
          organization_id: string
          response_payload: Json | null
          status: Database["public"]["Enums"]["automation_log_status"]
          trigger_payload: Json | null
        }
        Insert: {
          automation_id: string
          error_message?: string | null
          executed_at?: string
          id?: string
          organization_id: string
          response_payload?: Json | null
          status?: Database["public"]["Enums"]["automation_log_status"]
          trigger_payload?: Json | null
        }
        Update: {
          automation_id?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          organization_id?: string
          response_payload?: Json | null
          status?: Database["public"]["Enums"]["automation_log_status"]
          trigger_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          action_config: Json
          action_type: Database["public"]["Enums"]["automation_action_type"]
          category: Database["public"]["Enums"]["automation_category"]
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          last_triggered_at: string | null
          name: string
          organization_id: string
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["automation_action_type"]
          category?: Database["public"]["Enums"]["automation_category"]
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          name: string
          organization_id: string
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["automation_action_type"]
          category?: Database["public"]["Enums"]["automation_category"]
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          name?: string
          organization_id?: string
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          created_at: string
          file_format: string
          file_name: string
          id: string
          imported_at: string
          matched_count: number
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["reconciliation_status"]
          total_amount: number | null
          unmatched_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_format?: string
          file_name: string
          id?: string
          imported_at?: string
          matched_count?: number
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
          total_amount?: number | null
          unmatched_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_format?: string
          file_name?: string
          id?: string
          imported_at?: string
          matched_count?: number
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
          total_amount?: number | null
          unmatched_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          fitid: string | null
          id: string
          matched_invoice_id: string | null
          memo: string | null
          organization_id: string
          reconciliation_id: string
          status: Database["public"]["Enums"]["bank_transaction_status"]
          transaction_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          fitid?: string | null
          id?: string
          matched_invoice_id?: string | null
          memo?: string | null
          organization_id: string
          reconciliation_id: string
          status?: Database["public"]["Enums"]["bank_transaction_status"]
          transaction_date: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          fitid?: string | null
          id?: string
          matched_invoice_id?: string | null
          memo?: string | null
          organization_id?: string
          reconciliation_id?: string
          status?: Database["public"]["Enums"]["bank_transaction_status"]
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_invoice_id_fkey"
            columns: ["matched_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rule_executions: {
        Row: {
          billing_rule_id: string
          customer_id: string
          error_message: string | null
          executed_at: string
          id: string
          invoice_id: string
          organization_id: string
          status: string
        }
        Insert: {
          billing_rule_id: string
          customer_id: string
          error_message?: string | null
          executed_at?: string
          id?: string
          invoice_id: string
          organization_id: string
          status?: string
        }
        Update: {
          billing_rule_id?: string
          customer_id?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_rule_executions_billing_rule_id_fkey"
            columns: ["billing_rule_id"]
            isOneToOne: false
            referencedRelation: "billing_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_rule_executions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_rule_executions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_rule_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rules: {
        Row: {
          action: string
          channel: string
          created_at: string
          days_offset: number
          enabled: boolean
          id: string
          organization_id: string
          priority: number
          rule_name: string
          template_message: string | null
          updated_at: string
        }
        Insert: {
          action?: string
          channel?: string
          created_at?: string
          days_offset?: number
          enabled?: boolean
          id?: string
          organization_id: string
          priority?: number
          rule_name: string
          template_message?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          channel?: string
          created_at?: string
          days_offset?: number
          enabled?: boolean
          id?: string
          organization_id?: string
          priority?: number
          rule_name?: string
          template_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          content: string
          created_at: string
          id: string
          organization_id: string
          shortcut: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          organization_id: string
          shortcut: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
          shortcut?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "canned_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_configs: {
        Row: {
          channel: Database["public"]["Enums"]["chat_channel"]
          config: Json | null
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["chat_channel"]
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["chat_channel"]
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          content_type: string
          conversation_id: string
          created_at: string
          delivery_status: string
          external_message_id: string | null
          id: string
          media_url: string | null
          metadata: Json | null
          organization_id: string
          read_at: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          conversation_id: string
          created_at?: string
          delivery_status?: string
          external_message_id?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          organization_id: string
          read_at?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string | null
          content_type?: string
          conversation_id?: string
          created_at?: string
          delivery_status?: string
          external_message_id?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          organization_id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          authentication: Json | null
          auto_debit: boolean | null
          billing_day: number
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
          auto_debit?: boolean | null
          billing_day?: number
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
          auto_debit?: boolean | null
          billing_day?: number
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
      conversations: {
        Row: {
          assigned_to: string | null
          channel: Database["public"]["Enums"]["chat_channel"]
          channel_contact_id: string | null
          channel_conversation_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json | null
          organization_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel: Database["public"]["Enums"]["chat_channel"]
          channel_contact_id?: string | null
          channel_conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          organization_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: Database["public"]["Enums"]["chat_channel"]
          channel_contact_id?: string | null
          channel_conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          organization_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_analyses: {
        Row: {
          analyzed_at: string
          cpf_cnpj: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          organization_id: string
          result: string
          score: number | null
          source: string
        }
        Insert: {
          analyzed_at?: string
          cpf_cnpj: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          organization_id: string
          result?: string
          score?: number | null
          source?: string
        }
        Update: {
          analyzed_at?: string
          cpf_cnpj?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          result?: string
          score?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_analyses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      fiscal_invoices: {
        Row: {
          access_key: string | null
          created_at: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          issue_date: string
          model: Database["public"]["Enums"]["fiscal_model"]
          notes: string | null
          number: string | null
          organization_id: string
          pdf_url: string | null
          sefaz_response: string | null
          series: string | null
          status: Database["public"]["Enums"]["fiscal_status"]
          updated_at: string
          value: number
          xml_content: string | null
        }
        Insert: {
          access_key?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          issue_date?: string
          model?: Database["public"]["Enums"]["fiscal_model"]
          notes?: string | null
          number?: string | null
          organization_id: string
          pdf_url?: string | null
          sefaz_response?: string | null
          series?: string | null
          status?: Database["public"]["Enums"]["fiscal_status"]
          updated_at?: string
          value: number
          xml_content?: string | null
        }
        Update: {
          access_key?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          issue_date?: string
          model?: Database["public"]["Enums"]["fiscal_model"]
          notes?: string | null
          number?: string | null
          organization_id?: string
          pdf_url?: string | null
          sefaz_response?: string | null
          series?: string | null
          status?: Database["public"]["Enums"]["fiscal_status"]
          updated_at?: string
          value?: number
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ftth_nodes: {
        Row: {
          address: string | null
          capacity: number
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          node_type: Database["public"]["Enums"]["ftth_node_type"]
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["ftth_node_status"]
          updated_at: string
          used: number
        }
        Insert: {
          address?: string | null
          capacity?: number
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          node_type?: Database["public"]["Enums"]["ftth_node_type"]
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["ftth_node_status"]
          updated_at?: string
          used?: number
        }
        Update: {
          address?: string | null
          capacity?: number
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          node_type?: Database["public"]["Enums"]["ftth_node_type"]
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["ftth_node_status"]
          updated_at?: string
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "ftth_nodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          cost: number
          created_at: string
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          km: number | null
          liters: number
          notes: string | null
          organization_id: string
          vehicle_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          date?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          km?: number | null
          liters: number
          notes?: string | null
          organization_id: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          km?: number | null
          liters?: number
          notes?: string | null
          organization_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          item_type: Database["public"]["Enums"]["inventory_item_type"]
          min_quantity: number
          name: string
          notes: string | null
          organization_id: string
          quantity: number
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["inventory_item_type"]
          min_quantity?: number
          name: string
          notes?: string | null
          organization_id: string
          quantity?: number
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["inventory_item_type"]
          min_quantity?: number
          name?: string
          notes?: string | null
          organization_id?: string
          quantity?: number
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          item_id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          organization_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          item_id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          organization_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          item_id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          organization_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_installments: {
        Row: {
          amount: number
          barcode: string | null
          created_at: string
          due_date: string
          gateway_id: string | null
          id: string
          installment_number: number
          invoice_id: string
          organization_id: string
          paid_date: string | null
          pix_qrcode: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          barcode?: string | null
          created_at?: string
          due_date: string
          gateway_id?: string | null
          id?: string
          installment_number?: number
          invoice_id: string
          organization_id: string
          paid_date?: string | null
          pix_qrcode?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          barcode?: string | null
          created_at?: string
          due_date?: string
          gateway_id?: string | null
          id?: string
          installment_number?: number
          invoice_id?: string
          organization_id?: string
          paid_date?: string | null
          pix_qrcode?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_installments_organization_id_fkey"
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
          discount_amount: number | null
          due_date: string
          gateway_id: string | null
          id: string
          installment_count: number | null
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
          discount_amount?: number | null
          due_date: string
          gateway_id?: string | null
          id?: string
          installment_count?: number | null
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
          discount_amount?: number | null
          due_date?: string
          gateway_id?: string | null
          id?: string
          installment_count?: number | null
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
      network_devices: {
        Row: {
          api_password: string | null
          api_port: number | null
          api_username: string | null
          connected_clients: number | null
          cpu_usage: number | null
          created_at: string
          device_type: Database["public"]["Enums"]["device_type"]
          firmware_version: string | null
          id: string
          ip_address: string | null
          last_seen_at: string | null
          location: string | null
          mac_address: string | null
          manufacturer: Database["public"]["Enums"]["device_manufacturer"]
          memory_usage: number | null
          model: string | null
          name: string
          notes: string | null
          organization_id: string
          serial_number: string | null
          snmp_community: string | null
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string
          uptime: string | null
        }
        Insert: {
          api_password?: string | null
          api_port?: number | null
          api_username?: string | null
          connected_clients?: number | null
          cpu_usage?: number | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          firmware_version?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?: Database["public"]["Enums"]["device_manufacturer"]
          memory_usage?: number | null
          model?: string | null
          name: string
          notes?: string | null
          organization_id: string
          serial_number?: string | null
          snmp_community?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
          uptime?: string | null
        }
        Update: {
          api_password?: string | null
          api_port?: number | null
          api_username?: string | null
          connected_clients?: number | null
          cpu_usage?: number | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          firmware_version?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?: Database["public"]["Enums"]["device_manufacturer"]
          memory_usage?: number | null
          model?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          serial_number?: string | null
          snmp_community?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
          uptime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_alerts: {
        Row: {
          channel: string
          created_at: string
          description: string | null
          id: string
          organization_id: string
          read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_alerts_organization_id_fkey"
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
          early_payment_discount: number | null
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
          early_payment_discount?: number | null
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
          early_payment_discount?: number | null
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
      sla_configs: {
        Row: {
          created_at: string
          id: string
          max_resolution_minutes: number
          max_response_minutes: number
          organization_id: string
          priority: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_resolution_minutes?: number
          max_response_minutes?: number
          organization_id: string
          priority?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_resolution_minutes?: number
          max_response_minutes?: number
          organization_id?: string
          priority?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_credentials: {
        Row: {
          cpf: string
          created_at: string
          customer_id: string
          id: string
          last_login_at: string | null
          organization_id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          customer_id: string
          id?: string
          last_login_at?: string | null
          organization_id: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          customer_id?: string
          id?: string
          last_login_at?: string | null
          organization_id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_credentials_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          organization_id: string
          start_time: string
          technician_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time?: string
          id?: string
          organization_id: string
          start_time?: string
          technician_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          organization_id?: string
          start_time?: string
          technician_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "technician_availability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_availability_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_schedules: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          organization_id: string
          service_order_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["schedule_status"]
          technician_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          organization_id: string
          service_order_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["schedule_status"]
          technician_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          organization_id?: string
          service_order_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          technician_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_schedules_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_schedules_technician_id_fkey"
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
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          first_response_at: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          sla_breached: boolean
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_breached?: boolean
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_breached?: boolean
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_usage: {
        Row: {
          contract_id: string | null
          created_at: string
          customer_id: string
          download_bytes: number
          id: string
          organization_id: string
          period_end: string
          period_start: string
          source: string
          upload_bytes: number
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          customer_id: string
          download_bytes?: number
          id?: string
          organization_id: string
          period_end: string
          period_start: string
          source?: string
          upload_bytes?: number
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          customer_id?: string
          download_bytes?: number
          id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          source?: string
          upload_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "traffic_usage_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_to: string | null
          created_at: string
          fuel_level: number | null
          id: string
          km: number | null
          model: string
          next_maintenance_date: string | null
          notes: string | null
          organization_id: string
          plate: string
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
          year: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          fuel_level?: number | null
          id?: string
          km?: number | null
          model: string
          next_maintenance_date?: string | null
          notes?: string | null
          organization_id: string
          plate: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          year?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          fuel_level?: number | null
          id?: string
          km?: number | null
          model?: string
          next_maintenance_date?: string | null
          notes?: string | null
          organization_id?: string
          plate?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      network_devices_safe: {
        Row: {
          api_password: string | null
          api_port: number | null
          api_username: string | null
          connected_clients: number | null
          cpu_usage: number | null
          created_at: string | null
          device_type: Database["public"]["Enums"]["device_type"] | null
          firmware_version: string | null
          id: string | null
          ip_address: string | null
          last_seen_at: string | null
          location: string | null
          mac_address: string | null
          manufacturer:
            | Database["public"]["Enums"]["device_manufacturer"]
            | null
          memory_usage: number | null
          model: string | null
          name: string | null
          notes: string | null
          organization_id: string | null
          serial_number: string | null
          snmp_community: string | null
          status: Database["public"]["Enums"]["device_status"] | null
          updated_at: string | null
          uptime: string | null
        }
        Insert: {
          api_password?: never
          api_port?: number | null
          api_username?: never
          connected_clients?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          firmware_version?: string | null
          id?: string | null
          ip_address?: string | null
          last_seen_at?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?:
            | Database["public"]["Enums"]["device_manufacturer"]
            | null
          memory_usage?: number | null
          model?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          serial_number?: string | null
          snmp_community?: never
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
          uptime?: string | null
        }
        Update: {
          api_password?: never
          api_port?: number | null
          api_username?: never
          connected_clients?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          firmware_version?: string | null
          id?: string | null
          ip_address?: string | null
          last_seen_at?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?:
            | Database["public"]["Enums"]["device_manufacturer"]
            | null
          memory_usage?: number | null
          model?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          serial_number?: string | null
          snmp_community?: never
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
          uptime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_public_lead: {
        Args: {
          p_email?: string
          p_name: string
          p_notes?: string
          p_org_id: string
          p_phone: string
        }
        Returns: string
      }
      dispatch_automation_event_inline: {
        Args: {
          p_event: string
          p_org_id: string
          p_record: Record<string, unknown>
        }
        Returns: Record<string, unknown>
      }
      get_coverage_nodes: {
        Args: { p_org_id: string }
        Returns: {
          capacity: number
          id: string
          lat: number
          lng: number
          name: string
          node_type: string
          status: string
          used: number
        }[]
      }
      get_org_id_by_slug: { Args: { p_slug: string }; Returns: string }
      get_org_public_info: {
        Args: { p_slug: string }
        Returns: {
          id: string
          logo_url: string
          name: string
        }[]
      }
      get_public_plans: {
        Args: { p_org_id: string }
        Returns: {
          download_speed: number
          id: string
          name: string
          price: number
          technology: string
          upload_speed: number
        }[]
      }
      get_user_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "technician" | "financial" | "support"
      automation_action_type: "webhook_call" | "whatsapp" | "email" | "internal"
      automation_category: "cobranca" | "atendimento" | "operacional"
      automation_log_status: "success" | "error" | "skipped"
      automation_trigger_type: "webhook" | "schedule" | "event"
      bank_transaction_status: "unmatched" | "matched" | "ignored"
      chat_channel:
        | "whatsapp"
        | "instagram"
        | "facebook"
        | "website"
        | "telegram"
        | "email"
      contract_status:
        | "active"
        | "suspended"
        | "cancelled"
        | "awaiting_installation"
        | "awaiting_signature"
      conversation_status: "open" | "waiting" | "resolved" | "closed"
      customer_status: "active" | "suspended" | "defaulting" | "cancelled"
      device_manufacturer:
        | "mikrotik"
        | "huawei"
        | "intelbras"
        | "fiberhome"
        | "zte"
        | "other"
      device_status: "online" | "offline" | "warning" | "maintenance"
      device_type:
        | "olt"
        | "onu"
        | "router"
        | "switch"
        | "server"
        | "access_point"
        | "other"
      fiscal_model: "nfe21" | "nfe22" | "nfcom62"
      fiscal_status:
        | "draft"
        | "pending"
        | "authorized"
        | "rejected"
        | "cancelled"
      ftth_node_status: "active" | "full" | "inactive"
      ftth_node_type: "cto" | "ceo" | "splitter" | "pop"
      fuel_type: "gasoline" | "ethanol" | "diesel" | "flex"
      inventory_item_type:
        | "onu"
        | "router"
        | "cable"
        | "splitter"
        | "connector"
        | "other"
      inventory_movement_type: "in" | "out" | "loan" | "return"
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
      reconciliation_status: "pending" | "processing" | "completed" | "error"
      schedule_status: "scheduled" | "in_progress" | "completed" | "cancelled"
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
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "waiting" | "resolved" | "closed"
      vehicle_status: "available" | "in_use" | "maintenance" | "decommissioned"
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
      app_role: ["admin", "manager", "technician", "financial", "support"],
      automation_action_type: ["webhook_call", "whatsapp", "email", "internal"],
      automation_category: ["cobranca", "atendimento", "operacional"],
      automation_log_status: ["success", "error", "skipped"],
      automation_trigger_type: ["webhook", "schedule", "event"],
      bank_transaction_status: ["unmatched", "matched", "ignored"],
      chat_channel: [
        "whatsapp",
        "instagram",
        "facebook",
        "website",
        "telegram",
        "email",
      ],
      contract_status: [
        "active",
        "suspended",
        "cancelled",
        "awaiting_installation",
        "awaiting_signature",
      ],
      conversation_status: ["open", "waiting", "resolved", "closed"],
      customer_status: ["active", "suspended", "defaulting", "cancelled"],
      device_manufacturer: [
        "mikrotik",
        "huawei",
        "intelbras",
        "fiberhome",
        "zte",
        "other",
      ],
      device_status: ["online", "offline", "warning", "maintenance"],
      device_type: [
        "olt",
        "onu",
        "router",
        "switch",
        "server",
        "access_point",
        "other",
      ],
      fiscal_model: ["nfe21", "nfe22", "nfcom62"],
      fiscal_status: [
        "draft",
        "pending",
        "authorized",
        "rejected",
        "cancelled",
      ],
      ftth_node_status: ["active", "full", "inactive"],
      ftth_node_type: ["cto", "ceo", "splitter", "pop"],
      fuel_type: ["gasoline", "ethanol", "diesel", "flex"],
      inventory_item_type: [
        "onu",
        "router",
        "cable",
        "splitter",
        "connector",
        "other",
      ],
      inventory_movement_type: ["in", "out", "loan", "return"],
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
      reconciliation_status: ["pending", "processing", "completed", "error"],
      schedule_status: ["scheduled", "in_progress", "completed", "cancelled"],
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
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "waiting", "resolved", "closed"],
      vehicle_status: ["available", "in_use", "maintenance", "decommissioned"],
    },
  },
} as const
