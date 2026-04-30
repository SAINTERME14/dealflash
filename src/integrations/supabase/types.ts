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
            foreignKeyName: "appointments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
        ]
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
        ]
      }
      listings: {
        Row: {
          address: string | null
          allows_appointment: boolean
          allows_booking: boolean
          attributes: Json
          category_id: string
          city: string | null
          created_at: string
          currency: string
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
          category_id: string
          city?: string | null
          created_at?: string
          currency?: string
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
          category_id?: string
          city?: string | null
          created_at?: string
          currency?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
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
            foreignKeyName: "reviews_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
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
        Relationships: [
          {
            foreignKeyName: "seller_application_audit_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "seller_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_applications: {
        Row: {
          admin_response: string | null
          admin_response_at: string | null
          advertiser_profile:
            | Database["public"]["Enums"]["advertiser_profile"]
            | null
          ai_attempts: number
          ai_last_run_at: string | null
          ai_review: Json | null
          business_name: string | null
          city: string | null
          created_at: string
          documents: string[]
          email: string
          id: string
          license_number: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          main_category: string | null
          message: string | null
          name: string
          neq_number: string | null
          notes: string | null
          phone: string | null
          photos: string[]
          profession: string | null
          status: Database["public"]["Enums"]["seller_application_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          admin_response_at?: string | null
          advertiser_profile?:
            | Database["public"]["Enums"]["advertiser_profile"]
            | null
          ai_attempts?: number
          ai_last_run_at?: string | null
          ai_review?: Json | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          documents?: string[]
          email: string
          id?: string
          license_number?: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          main_category?: string | null
          message?: string | null
          name: string
          neq_number?: string | null
          notes?: string | null
          phone?: string | null
          photos?: string[]
          profession?: string | null
          status?: Database["public"]["Enums"]["seller_application_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          admin_response_at?: string | null
          advertiser_profile?:
            | Database["public"]["Enums"]["advertiser_profile"]
            | null
          ai_attempts?: number
          ai_last_run_at?: string | null
          ai_review?: Json | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          documents?: string[]
          email?: string
          id?: string
          license_number?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          main_category?: string | null
          message?: string | null
          name?: string
          neq_number?: string | null
          notes?: string | null
          phone?: string | null
          photos?: string[]
          profession?: string | null
          status?: Database["public"]["Enums"]["seller_application_status"]
          updated_at?: string
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
    }
    Functions: {
      can_manage_seller_notes: { Args: { _user_id: string }; Returns: boolean }
      can_publish_listings: { Args: { _user_id: string }; Returns: boolean }
      expire_featured_listings: { Args: never; Returns: number }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      set_vault_service_role_key: { Args: { _key: string }; Returns: undefined }
    }
    Enums: {
      admin_task_priority: "low" | "normal" | "high" | "urgent"
      admin_task_status: "todo" | "in_progress" | "done" | "archived"
      advertiser_profile:
        | "particulier"
        | "pro_occasionnel"
        | "commerce"
        | "pro_reglemente"
      app_role:
        | "admin"
        | "vendeur_b2c"
        | "vendeur_c2c"
        | "acheteur"
        | "moderateur"
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
      dealflash_product_status: "draft" | "listed" | "paused" | "archived"
      dropship_order_status:
        | "pending"
        | "ordered"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
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
      listing_status: "draft" | "active" | "paused" | "sold" | "archived"
      listing_type: "product" | "vehicle" | "rental" | "hotel" | "service"
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
      admin_task_priority: ["low", "normal", "high", "urgent"],
      admin_task_status: ["todo", "in_progress", "done", "archived"],
      advertiser_profile: [
        "particulier",
        "pro_occasionnel",
        "commerce",
        "pro_reglemente",
      ],
      app_role: [
        "admin",
        "vendeur_b2c",
        "vendeur_c2c",
        "acheteur",
        "moderateur",
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
      dealflash_product_status: ["draft", "listed", "paused", "archived"],
      dropship_order_status: [
        "pending",
        "ordered",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
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
      listing_status: ["draft", "active", "paused", "sold", "archived"],
      listing_type: ["product", "vehicle", "rental", "hotel", "service"],
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
    },
  },
} as const
