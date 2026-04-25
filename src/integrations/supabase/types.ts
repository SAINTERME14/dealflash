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
          created_at: string
          email: string
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["seller_application_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["seller_application_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["seller_application_status"]
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      can_manage_seller_notes: { Args: { _user_id: string }; Returns: boolean }
      expire_featured_listings: { Args: never; Returns: number }
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendeur_b2c" | "vendeur_c2c" | "acheteur"
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
      listing_status: "draft" | "active" | "paused" | "sold" | "archived"
      listing_type: "product" | "vehicle" | "rental" | "hotel" | "service"
      seller_application_status: "new" | "contacted" | "approved" | "rejected"
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
      app_role: ["admin", "vendeur_b2c", "vendeur_c2c", "acheteur"],
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
      listing_status: ["draft", "active", "paused", "sold", "archived"],
      listing_type: ["product", "vehicle", "rental", "hotel", "service"],
      seller_application_status: ["new", "contacted", "approved", "rejected"],
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
