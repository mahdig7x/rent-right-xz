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
      admin_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          created_at: string
          id: string
          note: string | null
          target_id: string
          target_label: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          created_at?: string
          id?: string
          note?: string | null
          target_id: string
          target_label: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["admin_action_type"]
          admin_id?: string
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string
          target_label?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          end_date: string
          id: string
          insurance_amount: number | null
          item_id: string
          lessor_id: string
          lessor_returned_at: string | null
          renter_id: string
          renter_returned_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          insurance_amount?: number | null
          item_id: string
          lessor_id: string
          lessor_returned_at?: string | null
          renter_id: string
          renter_returned_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          insurance_amount?: number | null
          item_id?: string
          lessor_id?: string
          lessor_returned_at?: string | null
          renter_id?: string
          renter_returned_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string
          description: string
          id: string
          images: string[] | null
          latitude: number | null
          location: string
          longitude: number | null
          moderation_note: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          owner_id: string
          price_per_day: number
          status: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          moderation_note?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          owner_id: string
          price_per_day: number
          status?: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          moderation_note?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          owner_id?: string
          price_per_day?: number
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          location: string | null
          name: string
          phone: string | null
          profile_image: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          profile_image?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          profile_image?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_note: string | null
          booking_id: string | null
          created_at: string
          description: string
          evidence: string[] | null
          id: string
          item_id: string | null
          resolution: Database["public"]["Enums"]["report_resolution"] | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          booking_id?: string | null
          created_at?: string
          description: string
          evidence?: string[] | null
          id?: string
          item_id?: string | null
          resolution?: Database["public"]["Enums"]["report_resolution"] | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          booking_id?: string | null
          created_at?: string
          description?: string
          evidence?: string[] | null
          id?: string
          item_id?: string | null
          resolution?: Database["public"]["Enums"]["report_resolution"] | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          hidden: boolean
          id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          created_at: string | null
          id: string | null
          location: string | null
          name: string | null
          profile_image: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          profile_image?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          profile_image?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_action_type:
        | "listing_approved"
        | "listing_flagged"
        | "listing_suspended"
        | "report_resolved"
        | "report_rejected"
        | "report_escalated"
        | "user_suspended"
        | "user_activated"
        | "insurance_transferred"
      app_role: "admin" | "moderator" | "user"
      booking_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "cancelled"
        | "completed"
        | "failed"
      item_condition: "new" | "like_new" | "good" | "fair"
      item_status: "available" | "booked" | "unavailable"
      moderation_status: "approved" | "pending_review" | "flagged" | "suspended"
      payment_status: "pending" | "successful" | "failed" | "refunded"
      payment_type: "rental" | "insurance" | "refund" | "compensation"
      report_resolution:
        | "warning_issued"
        | "listing_suspended"
        | "user_suspended"
        | "insurance_transferred"
        | "no_action"
        | "escalated"
      report_status:
        | "submitted"
        | "under_review"
        | "resolved"
        | "rejected"
        | "escalated"
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
      admin_action_type: [
        "listing_approved",
        "listing_flagged",
        "listing_suspended",
        "report_resolved",
        "report_rejected",
        "report_escalated",
        "user_suspended",
        "user_activated",
        "insurance_transferred",
      ],
      app_role: ["admin", "moderator", "user"],
      booking_status: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
        "failed",
      ],
      item_condition: ["new", "like_new", "good", "fair"],
      item_status: ["available", "booked", "unavailable"],
      moderation_status: ["approved", "pending_review", "flagged", "suspended"],
      payment_status: ["pending", "successful", "failed", "refunded"],
      payment_type: ["rental", "insurance", "refund", "compensation"],
      report_resolution: [
        "warning_issued",
        "listing_suspended",
        "user_suspended",
        "insurance_transferred",
        "no_action",
        "escalated",
      ],
      report_status: [
        "submitted",
        "under_review",
        "resolved",
        "rejected",
        "escalated",
      ],
    },
  },
} as const
