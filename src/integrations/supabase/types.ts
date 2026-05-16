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
      ad_slots: {
        Row: {
          code: string
          created_at: string
          height: number | null
          id: string
          is_active: boolean
          location: string | null
          market_id: string | null
          name: string
          updated_at: string
          width: number | null
        }
        Insert: {
          code: string
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          market_id?: string | null
          name: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          height?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          market_id?: string | null
          name?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_slots_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_recovery_codes: {
        Row: {
          admin_id: string
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
        }
        Insert: {
          admin_id: string
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
        }
        Update: {
          admin_id?: string
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_recovery_codes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          revoked_at: string | null
          two_fa_verified: boolean
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          two_fa_verified?: boolean
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          two_fa_verified?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["admin_task_priority"]
          status: Database["public"]["Enums"]["admin_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["admin_task_priority"]
          status?: Database["public"]["Enums"]["admin_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["admin_task_priority"]
          status?: Database["public"]["Enums"]["admin_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_login_ip: unknown
          notes: string | null
          role: Database["public"]["Enums"]["admin_role"]
          two_fa_enabled: boolean
          two_fa_secret: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: unknown
          notes?: string | null
          role: Database["public"]["Enums"]["admin_role"]
          two_fa_enabled?: boolean
          two_fa_secret?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: unknown
          notes?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          two_fa_enabled?: boolean
          two_fa_secret?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string | null
          country_code: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          link_id: string
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          approved_at: string | null
          commission_amount: number
          commission_rate: number
          conversion_id: string | null
          created_at: string | null
          id: string
          status: string | null
        }
        Insert: {
          affiliate_id: string
          approved_at?: string | null
          commission_amount: number
          commission_rate: number
          conversion_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          approved_at?: string | null
          commission_amount?: number
          commission_rate?: number
          conversion_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "affiliate_conversions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          amount: number
          click_id: string | null
          converted_at: string | null
          currency: string | null
          id: string
          link_id: string
          order_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          click_id?: string | null
          converted_at?: string | null
          currency?: string | null
          id?: string
          link_id: string
          order_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          click_id?: string | null
          converted_at?: string | null
          currency?: string | null
          id?: string
          link_id?: string
          order_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          clicks_count: number | null
          conversions_count: number | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          link_code: string
          revenue_generated: number | null
          status: string | null
          tracking_url: string
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          link_code: string
          revenue_generated?: number | null
          status?: string | null
          tracking_url: string
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          link_code?: string
          revenue_generated?: number | null
          status?: string | null
          tracking_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payout_history: {
        Row: {
          action: string | null
          affiliate_id: string
          created_at: string | null
          id: string
          notes: string | null
          payout_id: string | null
        }
        Insert: {
          action?: string | null
          affiliate_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payout_id?: string | null
        }
        Update: {
          action?: string | null
          affiliate_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payout_history_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payout_history_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "affiliate_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          approved_at: string | null
          completed_at: string | null
          currency: string | null
          id: string
          payment_email: string | null
          payment_method: string | null
          reference_id: string | null
          requested_at: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          approved_at?: string | null
          completed_at?: string | null
          currency?: string | null
          id?: string
          payment_email?: string | null
          payment_method?: string | null
          reference_id?: string | null
          requested_at?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          approved_at?: string | null
          completed_at?: string | null
          currency?: string | null
          id?: string
          payment_email?: string | null
          payment_method?: string | null
          reference_id?: string | null
          requested_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["affiliate_kind"]
          kyc_documents: string[]
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          social_links: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["affiliate_kind"]
          kyc_documents?: string[]
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          social_links?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["affiliate_kind"]
          kyc_documents?: string[]
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          social_links?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_assistant_conversations: {
        Row: {
          created_at: string
          id: string
          shop_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shop_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shop_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistant_conversations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "dropship_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          buyer_email: string
          buyer_first_name: string
          buyer_id: string
          buyer_last_name: string
          buyer_phone: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          requested_date: string
          requested_end_time: string
          requested_start_time: string
          responded_at: string | null
          seller_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_email: string
          buyer_first_name: string
          buyer_id: string
          buyer_last_name: string
          buyer_phone: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          requested_date: string
          requested_end_time: string
          requested_start_time: string
          responded_at?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_email?: string
          buyer_first_name?: string
          buyer_id?: string
          buyer_last_name?: string
          buyer_phone?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          requested_date?: string
          requested_end_time?: string
          requested_start_time?: string
          responded_at?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          admin_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: number
          ip_address: unknown
          note: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: number
          ip_address?: unknown
          note?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: number
          ip_address?: unknown
          note?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          buyer_email: string
          buyer_first_name: string
          buyer_id: string
          buyer_last_name: string
          buyer_phone: string
          confirmation_code: string
          created_at: string
          end_time: string
          id: string
          listing_id: string
          message: string | null
          seller_id: string
          slot_date: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          buyer_email: string
          buyer_first_name: string
          buyer_id: string
          buyer_last_name: string
          buyer_phone: string
          confirmation_code?: string
          created_at?: string
          end_time: string
          id?: string
          listing_id: string
          message?: string | null
          seller_id: string
          slot_date: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          buyer_email?: string
          buyer_first_name?: string
          buyer_id?: string
          buyer_last_name?: string
          buyer_phone?: string
          confirmation_code?: string
          created_at?: string
          end_time?: string
          id?: string
          listing_id?: string
          message?: string | null
          seller_id?: string
          slot_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      boutiques: {
        Row: {
          active_count: number | null
          announcements_count: number | null
          badge_type: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          active_count?: number | null
          announcements_count?: number | null
          badge_type?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          active_count?: number | null
          announcements_count?: number | null
          badge_type?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cache_video_embeds: {
        Row: {
          author_name: string | null
          created_at: string
          embed_html: string | null
          last_resolved_at: string
          platform: string
          thumbnail_url: string | null
          title: string | null
          url: string
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          embed_html?: string | null
          last_resolved_at?: string
          platform: string
          thumbnail_url?: string | null
          title?: string | null
          url: string
        }
        Update: {
          author_name?: string | null
          created_at?: string
          embed_html?: string | null
          last_resolved_at?: string
          platform?: string
          thumbnail_url?: string | null
          title?: string | null
          url?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          booster_weight: number
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          listing_id: string | null
          market_id: string | null
          merchant_user_id: string
          plan: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          booster_weight?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string | null
          market_id?: string | null
          merchant_user_id: string
          plan?: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          booster_weight?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string | null
          market_id?: string | null
          merchant_user_id?: string
          plan?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          listing_type: Database["public"]["Enums"]["listing_type"]
          name: string
          parent_id: string | null
          slug: string
          ticket_fee_max: number | null
          ticket_fee_type: string
          ticket_fee_value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          name: string
          parent_id?: string | null
          slug: string
          ticket_fee_max?: number | null
          ticket_fee_type?: string
          ticket_fee_value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          name?: string
          parent_id?: string | null
          slug?: string
          ticket_fee_max?: number | null
          ticket_fee_type?: string
          ticket_fee_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_listings: {
        Row: {
          channel_id: string
          created_at: string
          dealflash_product_id: string
          external_id: string | null
          external_url: string | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          payload: Json
          status: Database["public"]["Enums"]["channel_listing_status"]
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          dealflash_product_id: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["channel_listing_status"]
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          dealflash_product_id?: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["channel_listing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_listings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_listings_dealflash_product_id_fkey"
            columns: ["dealflash_product_id"]
            isOneToOne: false
            referencedRelation: "dealflash_products"
            referencedColumns: ["id"]
          },
        ]
      }
      client_error_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string | null
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          affiliate_kind: Database["public"]["Enums"]["affiliate_kind"]
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          pct_affiliate: number
          pct_platform: number
          points_per_visit: number
          points_to_money_rate: number
          points_to_money_threshold: number
          updated_at: string
        }
        Insert: {
          affiliate_kind: Database["public"]["Enums"]["affiliate_kind"]
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          pct_affiliate?: number
          pct_platform?: number
          points_per_visit?: number
          points_to_money_rate?: number
          points_to_money_threshold?: number
          updated_at?: string
        }
        Update: {
          affiliate_kind?: Database["public"]["Enums"]["affiliate_kind"]
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          pct_affiliate?: number
          pct_platform?: number
          points_per_visit?: number
          points_to_money_rate?: number
          points_to_money_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      commission_tiers: {
        Row: {
          commission_rate: number
          created_at: string | null
          id: number
          max_earnings: number | null
          min_earnings: number | null
          tier_name: string
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          id?: number
          max_earnings?: number | null
          min_earnings?: number | null
          tier_name: string
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: number
          max_earnings?: number | null
          min_earnings?: number | null
          tier_name?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          beneficiary_user_id: string
          created_at: string
          currency: string
          id: string
          payout_id: string | null
          pct: number
          qr_conversion_id: string
          role: Database["public"]["Enums"]["user_type"]
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          beneficiary_user_id: string
          created_at?: string
          currency?: string
          id?: string
          payout_id?: string | null
          pct: number
          qr_conversion_id: string
          role: Database["public"]["Enums"]["user_type"]
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          beneficiary_user_id?: string
          created_at?: string
          currency?: string
          id?: string
          payout_id?: string | null
          pct?: number
          qr_conversion_id?: string
          role?: Database["public"]["Enums"]["user_type"]
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: []
      }
      dealflash_products: {
        Row: {
          cost_price: number
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[]
          internal_notes: string | null
          internal_sku: string
          listing_id: string | null
          margin_percent: number
          selling_price: number
          status: Database["public"]["Enums"]["dealflash_product_status"]
          stock_quantity: number | null
          supplier_product_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cost_price: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          internal_notes?: string | null
          internal_sku: string
          listing_id?: string | null
          margin_percent?: number
          selling_price: number
          status?: Database["public"]["Enums"]["dealflash_product_status"]
          stock_quantity?: number | null
          supplier_product_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          internal_notes?: string | null
          internal_sku?: string
          listing_id?: string | null
          margin_percent?: number
          selling_price?: number
          status?: Database["public"]["Enums"]["dealflash_product_status"]
          stock_quantity?: number | null
          supplier_product_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealflash_products_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealflash_products_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealflash_products_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dropship_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      dropship_orders: {
        Row: {
          channel_id: string | null
          cost_amount: number
          created_at: string
          currency: string
          dealflash_product_id: string
          delivered_at: string | null
          external_order_id: string | null
          id: string
          notes: string | null
          ordered_at: string | null
          quantity: number
          shipped_at: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["dropship_order_status"]
          supplier_id: string
          ticket_id: string | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          cost_amount: number
          created_at?: string
          currency?: string
          dealflash_product_id: string
          delivered_at?: string | null
          external_order_id?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          quantity?: number
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["dropship_order_status"]
          supplier_id: string
          ticket_id?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          cost_amount?: number
          created_at?: string
          currency?: string
          dealflash_product_id?: string
          delivered_at?: string | null
          external_order_id?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          quantity?: number
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["dropship_order_status"]
          supplier_id?: string
          ticket_id?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropship_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropship_orders_dealflash_product_id_fkey"
            columns: ["dealflash_product_id"]
            isOneToOne: false
            referencedRelation: "dealflash_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropship_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropship_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      dropship_shop_products: {
        Row: {
          ai_generated: boolean
          category: string | null
          cost_price: number
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[]
          metadata: Json
          sale_price: number
          shop_id: string
          status: string
          supplier_product_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          category?: string | null
          cost_price?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          metadata?: Json
          sale_price?: number
          shop_id: string
          status?: string
          supplier_product_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          category?: string | null
          cost_price?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[]
          metadata?: Json
          sale_price?: number
          shop_id?: string
          status?: string
          supplier_product_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropship_shop_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "dropship_shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropship_shop_products_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dropship_shops: {
        Row: {
          ai_autopilot_enabled: boolean
          cover_url: string | null
          created_at: string
          currency: string
          default_margin_pct: number
          description: string | null
          id: string
          logo_url: string | null
          managed_plan: string | null
          managed_started_at: string | null
          management_mode: string
          market_id: string | null
          metadata: Json
          name: string
          niche: string | null
          owner_user_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_autopilot_enabled?: boolean
          cover_url?: string | null
          created_at?: string
          currency?: string
          default_margin_pct?: number
          description?: string | null
          id?: string
          logo_url?: string | null
          managed_plan?: string | null
          managed_started_at?: string | null
          management_mode?: string
          market_id?: string | null
          metadata?: Json
          name: string
          niche?: string | null
          owner_user_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_autopilot_enabled?: boolean
          cover_url?: string | null
          created_at?: string
          currency?: string
          default_margin_pct?: number
          description?: string | null
          id?: string
          logo_url?: string | null
          managed_plan?: string | null
          managed_started_at?: string | null
          management_mode?: string
          market_id?: string | null
          metadata?: Json
          name?: string
          niche?: string | null
          owner_user_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      edge_function_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      employer_profiles: {
        Row: {
          city: string | null
          company_name: string
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          sector: string | null
          size: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          company_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          sector?: string | null
          size?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          sector?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      errors_video_resolution: {
        Row: {
          created_at: string
          error_code: string
          error_msg: string | null
          http_status: number | null
          id: string
          platform: string | null
          url: string
        }
        Insert: {
          created_at?: string
          error_code: string
          error_msg?: string | null
          http_status?: number | null
          id?: string
          platform?: string | null
          url: string
        }
        Update: {
          created_at?: string
          error_code?: string
          error_msg?: string | null
          http_status?: number | null
          id?: string
          platform?: string | null
          url?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      featured_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          is_featured: boolean | null
          listing_id: string
          new_priority: number | null
          new_until: string | null
          old_priority: number | null
          old_until: string | null
          was_featured: boolean | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          listing_id: string
          new_priority?: number | null
          new_until?: string | null
          old_priority?: number | null
          old_until?: string | null
          was_featured?: boolean | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          listing_id?: string
          new_priority?: number | null
          new_until?: string | null
          old_priority?: number | null
          old_until?: string | null
          was_featured?: boolean | null
        }
        Relationships: []
      }
      flash_sales: {
        Row: {
          created_at: string
          ends_at: string
          flash_price: number
          id: string
          is_active: boolean
          listing_id: string
          regular_price: number
          seller_id: string
          starts_at: string
          stock_limit: number | null
          stock_sold: number
          ticket_validity_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          flash_price: number
          id?: string
          is_active?: boolean
          listing_id: string
          regular_price: number
          seller_id: string
          starts_at?: string
          stock_limit?: number | null
          stock_sold?: number
          ticket_validity_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          flash_price?: number
          id?: string
          is_active?: boolean
          listing_id?: string
          regular_price?: number
          seller_id?: string
          starts_at?: string
          stock_limit?: number | null
          stock_sold?: number
          ticket_validity_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sales_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sales_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_ticket_messages: {
        Row: {
          content: string
          created_at: string
          filtered: boolean
          id: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          filtered?: boolean
          id?: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          filtered?: boolean
          id?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: []
      }
      job_tickets: {
        Row: {
          created_at: string
          employer_id: string
          id: string
          professional_id: string
          status: Database["public"]["Enums"]["job_ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employer_id: string
          id?: string
          professional_id: string
          status?: Database["public"]["Enums"]["job_ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employer_id?: string
          id?: string
          professional_id?: string
          status?: Database["public"]["Enums"]["job_ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_reports: {
        Row: {
          conversions_count: number
          currency: string
          generated_at: string
          id: string
          leads_count: number
          merchant_user_id: string
          payload: Json
          period: string
          period_end: string
          period_start: string
          sent_at: string | null
          total_revenue_cents: number
        }
        Insert: {
          conversions_count?: number
          currency?: string
          generated_at?: string
          id?: string
          leads_count?: number
          merchant_user_id: string
          payload?: Json
          period: string
          period_end: string
          period_start: string
          sent_at?: string | null
          total_revenue_cents?: number
        }
        Update: {
          conversions_count?: number
          currency?: string
          generated_at?: string
          id?: string
          leads_count?: number
          merchant_user_id?: string
          payload?: Json
          period?: string
          period_end?: string
          period_start?: string
          sent_at?: string | null
          total_revenue_cents?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          affiliate_user_id: string | null
          amount_cents: number | null
          channel: string | null
          converted_at: string | null
          created_at: string
          currency: string | null
          customer_user_id: string | null
          id: string
          listing_id: string | null
          merchant_user_id: string
          notes: string | null
          qr_id: string | null
          qr_visit_id: number | null
          scanned_at: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          affiliate_user_id?: string | null
          amount_cents?: number | null
          channel?: string | null
          converted_at?: string | null
          created_at?: string
          currency?: string | null
          customer_user_id?: string | null
          id?: string
          listing_id?: string | null
          merchant_user_id: string
          notes?: string | null
          qr_id?: string | null
          qr_visit_id?: number | null
          scanned_at?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          affiliate_user_id?: string | null
          amount_cents?: number | null
          channel?: string | null
          converted_at?: string | null
          created_at?: string
          currency?: string | null
          customer_user_id?: string | null
          id?: string
          listing_id?: string | null
          merchant_user_id?: string
          notes?: string | null
          qr_id?: string | null
          qr_visit_id?: number | null
          scanned_at?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_qr_id_fkey"
            columns: ["qr_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_qr_visit_id_fkey"
            columns: ["qr_visit_id"]
            isOneToOne: false
            referencedRelation: "qr_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_available: boolean
          listing_id: string
          slot_date: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_available?: boolean
          listing_id: string
          slot_date: string
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_available?: boolean
          listing_id?: string
          slot_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_availability_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_availability_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          allows_appointment: boolean
          allows_booking: boolean
          attributes: Json
          boost_weight: number
          category_id: string
          city: string | null
          created_at: string
          currency: string
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          description: string
          discount_percent: number | null
          featured_priority: number
          featured_until: string | null
          id: string
          images: string[]
          is_featured: boolean
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude: number | null
          original_price: number | null
          postal_code: string | null
          price: number
          region: string | null
          seller_id: string
          slug: string | null
          status: Database["public"]["Enums"]["listing_status"]
          subcategory_id: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          address?: string | null
          allows_appointment?: boolean
          allows_booking?: boolean
          attributes?: Json
          boost_weight?: number
          category_id: string
          city?: string | null
          created_at?: string
          currency?: string
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          description: string
          discount_percent?: number | null
          featured_priority?: number
          featured_until?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          original_price?: number | null
          postal_code?: string | null
          price: number
          region?: string | null
          seller_id: string
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory_id?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          address?: string | null
          allows_appointment?: boolean
          allows_booking?: boolean
          attributes?: Json
          boost_weight?: number
          category_id?: string
          city?: string | null
          created_at?: string
          currency?: string
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          description?: string
          discount_percent?: number | null
          featured_priority?: number
          featured_until?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          original_price?: number | null
          postal_code?: string | null
          price?: number
          region?: string | null
          seller_id?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          subcategory_id?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          country_code: string
          created_at: string
          currency: string
          id: string
          is_default: boolean
          languages: string[]
          name: string
          status: Database["public"]["Enums"]["market_status"]
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          currency?: string
          id?: string
          is_default?: boolean
          languages?: string[]
          name: string
          status?: Database["public"]["Enums"]["market_status"]
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency?: string
          id?: string
          is_default?: boolean
          languages?: string[]
          name?: string
          status?: Database["public"]["Enums"]["market_status"]
          updated_at?: string
        }
        Relationships: []
      }
      merchant_profiles: {
        Row: {
          business_name: string
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          logo_url: string | null
          neq_number: string | null
          region: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          business_name: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          neq_number?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          business_name?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          neq_number?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          listing_id: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_ref: string | null
          id: string
          method: Database["public"]["Enums"]["payout_method"]
          notes: string | null
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          external_ref?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payout_method"]
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_ref?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payout_method"]
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          created_at: string
          delta: number
          id: number
          note: string | null
          ref_id: string | null
          source: Database["public"]["Enums"]["points_source"]
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: number
          note?: string | null
          ref_id?: string | null
          source: Database["public"]["Enums"]["points_source"]
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: number
          note?: string | null
          ref_id?: string | null
          source?: Database["public"]["Enums"]["points_source"]
          user_id?: string
        }
        Relationships: []
      }
      professional_profiles: {
        Row: {
          available_from: string | null
          bio: string | null
          city: string | null
          created_at: string
          headline: string
          hourly_rate: number | null
          id: string
          is_public: boolean
          portfolio_links: Json
          sector: string | null
          skills: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          available_from?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          headline: string
          hourly_rate?: number | null
          id?: string
          is_public?: boolean
          portfolio_links?: Json
          sector?: string | null
          skills?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          available_from?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          headline?: string
          hourly_rate?: number | null
          id?: string
          is_public?: boolean
          portfolio_links?: Json
          sector?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          location: string | null
          name: string
          price: number
          professional_name: string
          rating: number | null
          review_count: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          name: string
          price: number
          professional_name: string
          rating?: number | null
          review_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          name?: string
          price?: number
          professional_name?: string
          rating?: number | null
          review_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked_at: string | null
          blocked_reason: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          is_blocked: boolean
          is_verified: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          affiliate_user_id: string
          channel: string
          content: string | null
          created_at: string
          external_ref: string | null
          external_url: string | null
          id: string
          listing_id: string | null
          media_url: string | null
          metrics: Json
          posted_at: string | null
          qr_code_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_user_id: string
          channel: string
          content?: string | null
          created_at?: string
          external_ref?: string | null
          external_url?: string | null
          id?: string
          listing_id?: string | null
          media_url?: string | null
          metrics?: Json
          posted_at?: string | null
          qr_code_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_user_id?: string
          channel?: string
          content?: string | null
          created_at?: string
          external_ref?: string | null
          external_url?: string | null
          id?: string
          listing_id?: string | null
          media_url?: string | null
          metrics?: Json
          posted_at?: string | null
          qr_code_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          code: string
          created_at: string
          discount_pct: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          owner_role: Database["public"]["Enums"]["user_type"]
          owner_user_id: string
          target_id: string | null
          target_type: Database["public"]["Enums"]["qr_target_type"]
          target_url: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          owner_role: Database["public"]["Enums"]["user_type"]
          owner_user_id: string
          target_id?: string | null
          target_type: Database["public"]["Enums"]["qr_target_type"]
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          owner_role?: Database["public"]["Enums"]["user_type"]
          owner_user_id?: string
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["qr_target_type"]
          target_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qr_conversions: {
        Row: {
          commission_total: number
          created_at: string
          currency: string
          gross_amount: number
          id: string
          order_ref: string | null
          qr_id: string
          ticket_id: string | null
        }
        Insert: {
          commission_total?: number
          created_at?: string
          currency?: string
          gross_amount: number
          id?: string
          order_ref?: string | null
          qr_id: string
          ticket_id?: string | null
        }
        Update: {
          commission_total?: number
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          order_ref?: string | null
          qr_id?: string
          ticket_id?: string | null
        }
        Relationships: []
      }
      qr_visits: {
        Row: {
          created_at: string
          id: number
          ip_country: string | null
          qr_id: string
          referrer: string | null
          user_agent: string | null
          visitor_fingerprint: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          ip_country?: string | null
          qr_id: string
          referrer?: string | null
          user_agent?: string | null
          visitor_fingerprint?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          ip_country?: string | null
          qr_id?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_fingerprint?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          hidden_reason: string | null
          id: string
          is_hidden: boolean
          listing_id: string
          rating: number
          seller_id: string
          seller_response: string | null
          seller_response_at: string | null
          ticket_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          listing_id: string
          rating: number
          seller_id: string
          seller_response?: string | null
          seller_response_at?: string | null
          ticket_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          listing_id?: string
          rating?: number
          seller_id?: string
          seller_response?: string | null
          seller_response_at?: string | null
          ticket_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          affiliate_user_id: string | null
          amount_cents: number
          commission_amount_cents: number
          confirmed_at: string | null
          created_at: string
          currency: string
          id: string
          lead_id: string | null
          listing_id: string | null
          merchant_user_id: string
          returned_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_user_id?: string | null
          amount_cents: number
          commission_amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          merchant_user_id: string
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_user_id?: string | null
          amount_cents?: number
          commission_amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          merchant_user_id?: string
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_channels: {
        Row: {
          api_endpoint: string | null
          api_key_secret_name: string | null
          config: Json
          created_at: string
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          type: Database["public"]["Enums"]["sales_channel_type"]
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_secret_name?: string | null
          config?: Json
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          type: Database["public"]["Enums"]["sales_channel_type"]
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_secret_name?: string | null
          config?: Json
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          type?: Database["public"]["Enums"]["sales_channel_type"]
          updated_at?: string
        }
        Relationships: []
      }
      seller_application_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          application_id: string
          created_at: string
          id: string
          new_status:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
          notes_changed: boolean
          old_status:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          application_id: string
          created_at?: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
          notes_changed?: boolean
          old_status?:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          application_id?: string
          created_at?: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
          notes_changed?: boolean
          old_status?:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
        }
        Relationships: []
      }
      seller_applications: {
        Row: {
          admin_response: string | null
          admin_response_at: string | null
          advertiser_profile:
            | Database["public"]["Enums"]["advertiser_profile"]
            | null
          ai_attempts: number | null
          ai_last_run_at: string | null
          ai_review: Json | null
          approved_at: string | null
          approved_by: string | null
          business_name: string | null
          categories: string | null
          city: string
          created_at: string | null
          description: string | null
          documents: string[] | null
          email: string
          full_name: string
          id: string
          license_number: string | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          main_category: string | null
          message: string | null
          name: string | null
          neq_number: string | null
          notes: string | null
          phone: string | null
          photos: string[] | null
          profession: string | null
          rejection_reason: string | null
          shop_name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          admin_response_at?: string | null
          advertiser_profile?:
            | Database["public"]["Enums"]["advertiser_profile"]
            | null
          ai_attempts?: number | null
          ai_last_run_at?: string | null
          ai_review?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string | null
          categories?: string | null
          city: string
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          email: string
          full_name: string
          id?: string
          license_number?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          main_category?: string | null
          message?: string | null
          name?: string | null
          neq_number?: string | null
          notes?: string | null
          phone?: string | null
          photos?: string[] | null
          profession?: string | null
          rejection_reason?: string | null
          shop_name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          admin_response_at?: string | null
          advertiser_profile?:
            | Database["public"]["Enums"]["advertiser_profile"]
            | null
          ai_attempts?: number | null
          ai_last_run_at?: string | null
          ai_review?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string | null
          categories?: string | null
          city?: string
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          email?: string
          full_name?: string
          id?: string
          license_number?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          main_category?: string | null
          message?: string | null
          name?: string | null
          neq_number?: string | null
          notes?: string | null
          phone?: string | null
          photos?: string[] | null
          profession?: string | null
          rejection_reason?: string | null
          shop_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_verification_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          id: string
          new_status:
            | Database["public"]["Enums"]["seller_verification_status"]
            | null
          notes: string | null
          old_status:
            | Database["public"]["Enums"]["seller_verification_status"]
            | null
          verification_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["seller_verification_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["seller_verification_status"]
            | null
          verification_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          new_status?:
            | Database["public"]["Enums"]["seller_verification_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["seller_verification_status"]
            | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_verification_audit_log_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "seller_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_verification_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["kyc_document_type"]
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_document_status"]
          storage_path: string
          updated_at: string
          user_id: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["kyc_document_type"]
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_document_status"]
          storage_path: string
          updated_at?: string
          user_id: string
          verification_id: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["kyc_document_type"]
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_document_status"]
          storage_path?: string
          updated_at?: string
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "seller_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_verifications: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_number: string | null
          city: string | null
          consent_data_processing: boolean
          consent_terms: boolean
          country: string
          created_at: string
          data_retention_until: string | null
          email: string
          gst_number: string | null
          id: string
          internal_notes: string | null
          legal_business_name: string | null
          legal_first_name: string | null
          legal_last_name: string | null
          neq_number: string | null
          phone: string | null
          postal_code: string | null
          profile_type: Database["public"]["Enums"]["seller_profile_type"]
          province: string | null
          qst_number: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["seller_verification_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_number?: string | null
          city?: string | null
          consent_data_processing?: boolean
          consent_terms?: boolean
          country?: string
          created_at?: string
          data_retention_until?: string | null
          email: string
          gst_number?: string | null
          id?: string
          internal_notes?: string | null
          legal_business_name?: string | null
          legal_first_name?: string | null
          legal_last_name?: string | null
          neq_number?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_type?: Database["public"]["Enums"]["seller_profile_type"]
          province?: string | null
          qst_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["seller_verification_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_number?: string | null
          city?: string | null
          consent_data_processing?: boolean
          consent_terms?: boolean
          country?: string
          created_at?: string
          data_retention_until?: string | null
          email?: string
          gst_number?: string | null
          id?: string
          internal_notes?: string | null
          legal_business_name?: string | null
          legal_first_name?: string | null
          legal_last_name?: string | null
          neq_number?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_type?: Database["public"]["Enums"]["seller_profile_type"]
          province?: string | null
          qst_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["seller_verification_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_affiliations: {
        Row: {
          affiliate_user_id: string
          created_at: string
          id: string
          merchant_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_user_id: string
          created_at?: string
          id?: string
          merchant_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_user_id?: string
          created_at?: string
          id?: string
          merchant_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          display_order: number
          features: Json
          id: string
          interval: string
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string | null
          target_role: Database["public"]["Enums"]["user_type"] | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name: string
          price_cents?: number
          stripe_price_id?: string | null
          target_role?: Database["public"]["Enums"]["user_type"] | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          target_role?: Database["public"]["Enums"]["user_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_products: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          external_sku: string
          id: string
          images: string[]
          last_synced_at: string | null
          raw_data: Json
          source_url: string | null
          stock_quantity: number | null
          supplier_id: string
          title: string
          updated_at: string
          wholesale_price: number
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          external_sku: string
          id?: string
          images?: string[]
          last_synced_at?: string | null
          raw_data?: Json
          source_url?: string | null
          stock_quantity?: number | null
          supplier_id: string
          title: string
          updated_at?: string
          wholesale_price: number
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          external_sku?: string
          id?: string
          images?: string[]
          last_synced_at?: string | null
          raw_data?: Json
          source_url?: string | null
          stock_quantity?: number | null
          supplier_id?: string
          title?: string
          updated_at?: string
          wholesale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          api_endpoint: string | null
          api_key_secret_name: string | null
          config: Json
          contact_email: string | null
          contact_url: string | null
          created_at: string
          default_lead_time_days: number | null
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_secret_name?: string | null
          config?: Json
          contact_email?: string | null
          contact_url?: string | null
          created_at?: string
          default_lead_time_days?: number | null
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          type?: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_secret_name?: string | null
          config?: Json
          contact_email?: string | null
          contact_url?: string | null
          created_at?: string
          default_lead_time_days?: number | null
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          type?: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_admin_reply: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          category: Database["public"]["Enums"]["support_ticket_category"]
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          related_listing_id: string | null
          related_ticket_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          related_listing_id?: string | null
          related_ticket_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          related_listing_id?: string | null
          related_ticket_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          appointment_id: string | null
          buyer_email: string
          buyer_first_name: string
          buyer_id: string
          buyer_last_name: string
          buyer_phone: string
          confirmation_code: string
          created_at: string
          currency: string
          expires_at: string
          flash_price: number
          flash_sale_id: string | null
          id: string
          listing_id: string
          platform_fee: number
          qr_code: string
          seller_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total_paid: number
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          buyer_email: string
          buyer_first_name: string
          buyer_id: string
          buyer_last_name: string
          buyer_phone: string
          confirmation_code?: string
          created_at?: string
          currency?: string
          expires_at: string
          flash_price: number
          flash_sale_id?: string | null
          id?: string
          listing_id: string
          platform_fee: number
          qr_code?: string
          seller_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_paid: number
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          buyer_email?: string
          buyer_first_name?: string
          buyer_id?: string
          buyer_last_name?: string
          buyer_phone?: string
          confirmation_code?: string
          created_at?: string
          currency?: string
          expires_at?: string
          flash_price?: number
          flash_sale_id?: string | null
          id?: string
          listing_id?: string
          platform_fee?: number
          qr_code?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_paid?: number
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ranked_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          id: string
          key: string
          locale: string
          namespace: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          locale: string
          namespace?: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          locale?: string
          namespace?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      trending_products: {
        Row: {
          category: string | null
          currency: string
          detected_at: string
          expires_at: string | null
          external_sku: string | null
          id: string
          metadata: Json
          reasons: Json
          recommended_price: number | null
          source: string
          supplier_product_id: string | null
          title: string
          trend_score: number
        }
        Insert: {
          category?: string | null
          currency?: string
          detected_at?: string
          expires_at?: string | null
          external_sku?: string | null
          id?: string
          metadata?: Json
          reasons?: Json
          recommended_price?: number | null
          source?: string
          supplier_product_id?: string | null
          title: string
          trend_score?: number
        }
        Update: {
          category?: string | null
          currency?: string
          detected_at?: string
          expires_at?: string | null
          external_sku?: string | null
          id?: string
          metadata?: Json
          reasons?: Json
          recommended_price?: number | null
          source?: string
          supplier_product_id?: string | null
          title?: string
          trend_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "trending_products_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan_code: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_code: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_code?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_verified: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ranked_listings: {
        Row: {
          address: string | null
          allows_appointment: boolean | null
          allows_booking: boolean | null
          attributes: Json | null
          boost_weight: number | null
          category_id: string | null
          city: string | null
          created_at: string | null
          currency: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          description: string | null
          discount_percent: number | null
          featured_priority: number | null
          featured_until: string | null
          has_active_flash: boolean | null
          id: string | null
          images: string[] | null
          is_featured: boolean | null
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          longitude: number | null
          original_price: number | null
          postal_code: string | null
          price: number | null
          rank_score: number | null
          region: string | null
          seller_id: string | null
          slug: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          subcategory_id: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          address?: string | null
          allows_appointment?: boolean | null
          allows_booking?: boolean | null
          attributes?: Json | null
          boost_weight?: number | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          description?: string | null
          discount_percent?: number | null
          featured_priority?: number | null
          featured_until?: string | null
          has_active_flash?: never
          id?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          longitude?: number | null
          original_price?: number | null
          postal_code?: string | null
          price?: number | null
          rank_score?: never
          region?: string | null
          seller_id?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          subcategory_id?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          address?: string | null
          allows_appointment?: boolean | null
          allows_booking?: boolean | null
          attributes?: Json | null
          boost_weight?: number | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          description?: string | null
          discount_percent?: number | null
          featured_priority?: number | null
          featured_until?: string | null
          has_active_flash?: never
          id?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          longitude?: number | null
          original_price?: number | null
          postal_code?: string | null
          price?: number | null
          rank_score?: never
          region?: string | null
          seller_id?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          subcategory_id?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_seller_notes: { Args: { _user_id: string }; Returns: boolean }
      can_publish_listings: { Args: { _user_id: string }; Returns: boolean }
      expire_featured_listings: { Args: never; Returns: number }
      get_admin_role: {
        Args: { check_user_id?: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_listing_rating_stats: {
        Args: { _listing_id: string }
        Returns: {
          avg_rating: number
          total_reviews: number
        }[]
      }
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_seller_rating_stats: {
        Args: { _seller_id: string }
        Returns: {
          avg_rating: number
          total_reviews: number
        }[]
      }
      has_approved_kyc: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin_v2: { Args: { check_user_id?: string }; Returns: boolean }
      is_user_blocked: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action_type: string
          _after_state?: Json
          _before_state?: Json
          _ip_address?: string
          _note?: string
          _target_id?: string
          _target_type?: string
          _user_agent?: string
        }
        Returns: number
      }
      revoke_all_admin_sessions: { Args: never; Returns: number }
      search_ranked_listings: {
        Args: {
          _category_id?: string
          _deal_type?: Database["public"]["Enums"]["deal_type"]
          _lat?: number
          _limit?: number
          _lng?: number
          _offset?: number
          _q?: string
          _radius_km?: number
        }
        Returns: {
          category_id: string
          city: string
          created_at: string
          currency: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          description: string
          discount_percent: number
          distance_km: number
          featured_priority: number
          has_active_flash: boolean
          id: string
          images: string[]
          is_featured: boolean
          latitude: number
          longitude: number
          original_price: number
          price: number
          rank_score: number
          region: string
          subcategory_id: string
          title: string
        }[]
      }
      set_vault_service_role_key: { Args: { _key: string }; Returns: undefined }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "admin"
        | "moderator"
        | "support"
        | "marketing"
        | "accountant"
        | "hr"
        | "analyst"
      admin_task_priority: "low" | "normal" | "high" | "urgent"
      admin_task_status: "todo" | "in_progress" | "done" | "archived"
      advertiser_profile:
        | "particulier"
        | "pro_occasionnel"
        | "commerce"
        | "pro_reglemente"
      affiliate_kind: "closer" | "influencer" | "promoter"
      app_role:
        | "admin"
        | "vendeur_b2c"
        | "vendeur_c2c"
        | "acheteur"
        | "moderateur"
        | "closer"
        | "influencer"
        | "promoter"
        | "professional"
        | "employer"
      appointment_status:
        | "requested"
        | "accepted"
        | "rejected"
        | "paid"
        | "completed"
        | "cancelled"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      channel_listing_status:
        | "draft"
        | "pending"
        | "published"
        | "error"
        | "removed"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      deal_type:
        | "damaged_packaging"
        | "overstock"
        | "end_of_season"
        | "clearance"
        | "promo_40plus"
        | "trending"
      dealflash_product_status: "draft" | "listed" | "paused" | "archived"
      dropship_order_status:
        | "pending"
        | "ordered"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      job_ticket_status: "open" | "in_progress" | "resolved" | "closed"
      kyc_document_status: "pending" | "accepted" | "rejected"
      kyc_document_type:
        | "gov_id_front"
        | "gov_id_back"
        | "selfie_with_id"
        | "proof_of_address"
        | "business_registration"
        | "tax_certificate_neq"
        | "tax_certificate_bn"
        | "tax_certificate_gst_qst"
        | "work_authorization"
        | "professional_license"
        | "other"
      kyc_status: "pending" | "approved" | "rejected"
      lead_status: "scanned" | "converted" | "cancelled"
      listing_status: "draft" | "active" | "paused" | "sold" | "archived"
      listing_type: "product" | "vehicle" | "rental" | "hotel" | "service"
      market_status: "active" | "inactive"
      notification_type:
        | "ticket_purchased"
        | "ticket_validated"
        | "ticket_expired"
        | "booking_requested"
        | "booking_confirmed"
        | "booking_cancelled"
        | "message_received"
        | "kyc_status_changed"
        | "listing_featured"
        | "support_reply"
        | "admin_announcement"
      payout_method: "bank_transfer" | "paypal" | "stripe_connect" | "manual"
      payout_status: "pending" | "processing" | "paid" | "failed"
      points_source:
        | "qr_visit"
        | "qr_conversion"
        | "bonus"
        | "adjustment"
        | "redemption"
      qr_target_type: "shop" | "product" | "service" | "campaign"
      sales_channel_type:
        | "amazon"
        | "temu"
        | "ebay"
        | "walmart"
        | "shopify"
        | "custom"
      seller_application_status:
        | "new"
        | "contacted"
        | "approved"
        | "rejected"
        | "suspended"
      seller_profile_type: "individual" | "self_employed" | "corporation"
      seller_verification_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "more_info_required"
        | "approved"
        | "rejected"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
      supplier_status: "active" | "paused" | "disabled"
      supplier_type:
        | "cj_dropshipping"
        | "aliexpress"
        | "alibaba"
        | "generic_api"
        | "csv_import"
        | "manual"
      support_ticket_category:
        | "payment"
        | "listing"
        | "account"
        | "kyc"
        | "technical"
        | "other"
      support_ticket_priority: "low" | "normal" | "high" | "urgent"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "waiting_user"
        | "resolved"
        | "closed"
      ticket_status:
        | "pending"
        | "paid"
        | "validated"
        | "expired"
        | "refunded"
        | "cancelled"
      user_type:
        | "buyer"
        | "merchant"
        | "closer"
        | "influencer"
        | "promoter"
        | "professional"
        | "employer"
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
      admin_role: [
        "super_admin",
        "admin",
        "moderator",
        "support",
        "marketing",
        "accountant",
        "hr",
        "analyst",
      ],
      admin_task_priority: ["low", "normal", "high", "urgent"],
      admin_task_status: ["todo", "in_progress", "done", "archived"],
      advertiser_profile: [
        "particulier",
        "pro_occasionnel",
        "commerce",
        "pro_reglemente",
      ],
      affiliate_kind: ["closer", "influencer", "promoter"],
      app_role: [
        "admin",
        "vendeur_b2c",
        "vendeur_c2c",
        "acheteur",
        "moderateur",
        "closer",
        "influencer",
        "promoter",
        "professional",
        "employer",
      ],
      appointment_status: [
        "requested",
        "accepted",
        "rejected",
        "paid",
        "completed",
        "cancelled",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      channel_listing_status: [
        "draft",
        "pending",
        "published",
        "error",
        "removed",
      ],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      deal_type: [
        "damaged_packaging",
        "overstock",
        "end_of_season",
        "clearance",
        "promo_40plus",
        "trending",
      ],
      dealflash_product_status: ["draft", "listed", "paused", "archived"],
      dropship_order_status: [
        "pending",
        "ordered",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      job_ticket_status: ["open", "in_progress", "resolved", "closed"],
      kyc_document_status: ["pending", "accepted", "rejected"],
      kyc_document_type: [
        "gov_id_front",
        "gov_id_back",
        "selfie_with_id",
        "proof_of_address",
        "business_registration",
        "tax_certificate_neq",
        "tax_certificate_bn",
        "tax_certificate_gst_qst",
        "work_authorization",
        "professional_license",
        "other",
      ],
      kyc_status: ["pending", "approved", "rejected"],
      lead_status: ["scanned", "converted", "cancelled"],
      listing_status: ["draft", "active", "paused", "sold", "archived"],
      listing_type: ["product", "vehicle", "rental", "hotel", "service"],
      market_status: ["active", "inactive"],
      notification_type: [
        "ticket_purchased",
        "ticket_validated",
        "ticket_expired",
        "booking_requested",
        "booking_confirmed",
        "booking_cancelled",
        "message_received",
        "kyc_status_changed",
        "listing_featured",
        "support_reply",
        "admin_announcement",
      ],
      payout_method: ["bank_transfer", "paypal", "stripe_connect", "manual"],
      payout_status: ["pending", "processing", "paid", "failed"],
      points_source: [
        "qr_visit",
        "qr_conversion",
        "bonus",
        "adjustment",
        "redemption",
      ],
      qr_target_type: ["shop", "product", "service", "campaign"],
      sales_channel_type: [
        "amazon",
        "temu",
        "ebay",
        "walmart",
        "shopify",
        "custom",
      ],
      seller_application_status: [
        "new",
        "contacted",
        "approved",
        "rejected",
        "suspended",
      ],
      seller_profile_type: ["individual", "self_employed", "corporation"],
      seller_verification_status: [
        "draft",
        "submitted",
        "under_review",
        "more_info_required",
        "approved",
        "rejected",
      ],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "unpaid",
      ],
      supplier_status: ["active", "paused", "disabled"],
      supplier_type: [
        "cj_dropshipping",
        "aliexpress",
        "alibaba",
        "generic_api",
        "csv_import",
        "manual",
      ],
      support_ticket_category: [
        "payment",
        "listing",
        "account",
        "kyc",
        "technical",
        "other",
      ],
      support_ticket_priority: ["low", "normal", "high", "urgent"],
      support_ticket_status: [
        "open",
        "in_progress",
        "waiting_user",
        "resolved",
        "closed",
      ],
      ticket_status: [
        "pending",
        "paid",
        "validated",
        "expired",
        "refunded",
        "cancelled",
      ],
      user_type: [
        "buyer",
        "merchant",
        "closer",
        "influencer",
        "promoter",
        "professional",
        "employer",
      ],
    },
  },
} as const
