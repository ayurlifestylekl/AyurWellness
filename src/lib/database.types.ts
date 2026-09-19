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
      users: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone_number: string | null
          gender: 'male' | 'female' | null
          role: 'admin' | 'customer' | 'sales_agent'
          created_at: string
          date_of_birth: string | null
          language: 'en' | 'ms'
          height_cm: number | null
          weight_kg: number | null
          allergies: string | null
          current_medications: string | null
          medical_conditions: string | null
          marketing_opt_in: boolean
          whatsapp_reminders_opt_in: boolean
          email_reminders_opt_in: boolean
          treatment_followups_opt_in: boolean
          avatar_url: string | null
          deleted_at: string | null
          deletion_requested_at: string | null
          mfa_enrolled: boolean
          tags: string[] | null
          internal_notes: string | null
          blocked_at: string | null
          blocked_reason: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          phone_number?: string | null
          gender?: 'male' | 'female' | null
          role?: 'admin' | 'customer' | 'sales_agent'
          created_at?: string
          date_of_birth?: string | null
          language?: 'en' | 'ms'
          height_cm?: number | null
          weight_kg?: number | null
          allergies?: string | null
          current_medications?: string | null
          medical_conditions?: string | null
          marketing_opt_in?: boolean
          whatsapp_reminders_opt_in?: boolean
          email_reminders_opt_in?: boolean
          treatment_followups_opt_in?: boolean
          avatar_url?: string | null
          deleted_at?: string | null
          deletion_requested_at?: string | null
          mfa_enrolled?: boolean
          tags?: string[] | null
          internal_notes?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          phone_number?: string | null
          gender?: 'male' | 'female' | null
          role?: 'admin' | 'customer' | 'sales_agent'
          created_at?: string
          date_of_birth?: string | null
          language?: 'en' | 'ms'
          height_cm?: number | null
          weight_kg?: number | null
          allergies?: string | null
          current_medications?: string | null
          medical_conditions?: string | null
          marketing_opt_in?: boolean
          whatsapp_reminders_opt_in?: boolean
          email_reminders_opt_in?: boolean
          treatment_followups_opt_in?: boolean
          avatar_url?: string | null
          deleted_at?: string | null
          deletion_requested_at?: string | null
          mfa_enrolled?: boolean
          tags?: string[] | null
          internal_notes?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          kind: 'welcome' | 'order_placed' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'ticket_reply' | 'promo_granted' | 'account_deletion_scheduled' | 'address_saved'
          title: string
          body: string
          href: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: 'welcome' | 'order_placed' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'ticket_reply' | 'promo_granted' | 'account_deletion_scheduled' | 'address_saved'
          title: string
          body: string
          href?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: 'welcome' | 'order_placed' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'ticket_reply' | 'promo_granted' | 'account_deletion_scheduled' | 'address_saved'
          title?: string
          body?: string
          href?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          customer_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          product_id?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price_rm: number
          sku: string
          stock_qty: number
          category: string | null
          is_bundle: boolean
          image_url: string | null
          created_at: string
          slug: string | null
          short_description: string | null
          ingredients: string | null
          dosage_instructions: string | null
          contraindications: string | null
          certifications: string | null
          dosha_indication: 'vata' | 'pitta' | 'kapha' | 'tridosha' | 'none'
          sale_price_rm: number | null
          sale_starts_at: string | null
          sale_ends_at: string | null
          member_price_rm: number | null
          low_stock_threshold: number | null
          allow_backorder: boolean
          expiry_date: string | null
          tags: string[] | null
          status: 'active' | 'draft' | 'archived'
          meta_title: string | null
          meta_description: string | null
          og_image_url: string | null
          weight_grams: number | null
          image_urls: string[] | null
          featured: boolean
          created_by_admin_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_rm: number
          sku: string
          stock_qty?: number
          category?: string | null
          is_bundle?: boolean
          image_url?: string | null
          created_at?: string
          slug?: string | null
          short_description?: string | null
          ingredients?: string | null
          dosage_instructions?: string | null
          contraindications?: string | null
          certifications?: string | null
          dosha_indication?: 'vata' | 'pitta' | 'kapha' | 'tridosha' | 'none'
          sale_price_rm?: number | null
          sale_starts_at?: string | null
          sale_ends_at?: string | null
          member_price_rm?: number | null
          low_stock_threshold?: number | null
          allow_backorder?: boolean
          expiry_date?: string | null
          tags?: string[] | null
          status?: 'active' | 'draft' | 'archived'
          meta_title?: string | null
          meta_description?: string | null
          og_image_url?: string | null
          weight_grams?: number | null
          image_urls?: string[] | null
          featured?: boolean
          created_by_admin_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_rm?: number
          sku?: string
          stock_qty?: number
          category?: string | null
          is_bundle?: boolean
          image_url?: string | null
          created_at?: string
          slug?: string | null
          short_description?: string | null
          ingredients?: string | null
          dosage_instructions?: string | null
          contraindications?: string | null
          certifications?: string | null
          dosha_indication?: 'vata' | 'pitta' | 'kapha' | 'tridosha' | 'none'
          sale_price_rm?: number | null
          sale_starts_at?: string | null
          sale_ends_at?: string | null
          member_price_rm?: number | null
          low_stock_threshold?: number | null
          allow_backorder?: boolean
          expiry_date?: string | null
          tags?: string[] | null
          status?: 'active' | 'draft' | 'archived'
          meta_title?: string | null
          meta_description?: string | null
          og_image_url?: string | null
          weight_grams?: number | null
          image_urls?: string[] | null
          featured?: boolean
          created_by_admin_id?: string | null
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          movement_type: 'received' | 'sold' | 'returned' | 'write_off' | 'recount_adjust' | 'reserved' | 'unreserved'
          quantity_delta: number
          reason: string | null
          reference_order_id: string | null
          actor_id: string | null
          cost_price_rm: number | null
          expiry_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          movement_type: 'received' | 'sold' | 'returned' | 'write_off' | 'recount_adjust' | 'reserved' | 'unreserved'
          quantity_delta: number
          reason?: string | null
          reference_order_id?: string | null
          actor_id?: string | null
          cost_price_rm?: number | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          movement_type?: 'received' | 'sold' | 'returned' | 'write_off' | 'recount_adjust' | 'reserved' | 'unreserved'
          quantity_delta?: number
          reason?: string | null
          reference_order_id?: string | null
          actor_id?: string | null
          cost_price_rm?: number | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      bundle_items: {
        Row: {
          id: string
          bundle_product_id: string
          child_product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          bundle_product_id: string
          child_product_id: string
          quantity?: number
        }
        Update: {
          id?: string
          bundle_product_id?: string
          child_product_id?: string
          quantity?: number
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          total_amount_rm: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          fulfillment_status: 'pending' | 'processing' | 'packing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
          courier_service: 'Pos Laju' | 'J&T Express' | 'DHL' | 'GDex' | 'Ninja Van' | 'Self-Pickup' | null
          tracking_number: string | null
          referral_agent_id: string | null
          created_at: string
          cancelled_at: string | null
          cancel_reason: string | null
          practitioner_note: string | null
          channel: 'web' | 'manual' | 'walk_in' | 'phone' | 'shopee' | 'tiktok_shop' | 'lazada' | 'instagram' | 'whatsapp'
          payment_method: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card' | null
          subtotal_rm: number | null
          tax_amount_rm: number | null
          shipping_amount_rm: number | null
          discount_amount_rm: number | null
          discount_code: string | null
          billing_address_id: string | null
          shipping_address_id: string | null
          invoice_number: string | null
          paid_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          completed_at: string | null
          internal_notes: string | null
          created_by_admin_id: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          total_amount_rm: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          fulfillment_status?: 'pending' | 'processing' | 'packing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
          courier_service?: 'Pos Laju' | 'J&T Express' | 'DHL' | 'GDex' | 'Ninja Van' | 'Self-Pickup' | null
          tracking_number?: string | null
          referral_agent_id?: string | null
          created_at?: string
          cancelled_at?: string | null
          cancel_reason?: string | null
          practitioner_note?: string | null
          channel?: 'web' | 'manual' | 'walk_in' | 'phone' | 'shopee' | 'tiktok_shop' | 'lazada' | 'instagram' | 'whatsapp'
          payment_method?: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card' | null
          subtotal_rm?: number | null
          tax_amount_rm?: number | null
          shipping_amount_rm?: number | null
          discount_amount_rm?: number | null
          discount_code?: string | null
          billing_address_id?: string | null
          shipping_address_id?: string | null
          invoice_number?: string | null
          paid_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          completed_at?: string | null
          internal_notes?: string | null
          created_by_admin_id?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          total_amount_rm?: number
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          fulfillment_status?: 'pending' | 'processing' | 'packing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
          courier_service?: 'Pos Laju' | 'J&T Express' | 'DHL' | 'GDex' | 'Ninja Van' | 'Self-Pickup' | null
          tracking_number?: string | null
          referral_agent_id?: string | null
          created_at?: string
          cancelled_at?: string | null
          cancel_reason?: string | null
          practitioner_note?: string | null
          channel?: 'web' | 'manual' | 'walk_in' | 'phone' | 'shopee' | 'tiktok_shop' | 'lazada' | 'instagram' | 'whatsapp'
          payment_method?: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card' | null
          subtotal_rm?: number | null
          tax_amount_rm?: number | null
          shipping_amount_rm?: number | null
          discount_amount_rm?: number | null
          discount_code?: string | null
          billing_address_id?: string | null
          shipping_address_id?: string | null
          invoice_number?: string | null
          paid_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          completed_at?: string | null
          internal_notes?: string | null
          created_by_admin_id?: string | null
        }
      }
      order_events: {
        Row: {
          id: string
          order_id: string
          actor_id: string | null
          event_type: string
          from_status: string | null
          to_status: string | null
          payload: Json
          is_customer_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          actor_id?: string | null
          event_type: string
          from_status?: string | null
          to_status?: string | null
          payload?: Json
          is_customer_visible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          actor_id?: string | null
          event_type?: string
          from_status?: string | null
          to_status?: string | null
          payload?: Json
          is_customer_visible?: boolean
          created_at?: string
        }
      }
      refunds: {
        Row: {
          id: string
          order_id: string
          amount_rm: number
          reason: string
          refund_method: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card'
          gateway_reference: string | null
          notes: string | null
          created_by_admin_id: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          amount_rm: number
          reason: string
          refund_method: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card'
          gateway_reference?: string | null
          notes?: string | null
          created_by_admin_id: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          amount_rm?: number
          reason?: string
          refund_method?: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card'
          gateway_reference?: string | null
          notes?: string | null
          created_by_admin_id?: string
          created_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          customer_id: string
          label: string
          recipient: string
          phone: string
          line1: string
          line2: string | null
          city: string
          state: string
          postcode: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          label: string
          recipient: string
          phone: string
          line1: string
          line2?: string | null
          city: string
          state: string
          postcode: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          label?: string
          recipient?: string
          phone?: string
          line1?: string
          line2?: string | null
          city?: string
          state?: string
          postcode?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          price_at_purchase_rm: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          quantity: number
          price_at_purchase_rm: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          price_at_purchase_rm?: number
        }
      }
      appointments: {
        Row: {
          id: string
          customer_id: string | null
          treatment_name: string
          doctor_name: string
          appointment_date_time: string
          duration_mins: number
          status: 'pending' | 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          advance_payment_rm: number | null
          calcom_booking_uid: string | null
          mode: 'in-person' | 'virtual'
          meeting_link: string | null
          notes: string | null
          rescheduled_from_id: string | null
          checked_in_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          internal_notes: string | null
          clinical_notes: string | null
          room: string | null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pre_visit_form: any | null
          advance_payment_status: string | null
          created_by_admin_id: string | null
          updated_at: string
          gender_requirement: 'any' | 'men_only' | 'ladies_only'
          group_management_active: boolean
          group_detached_at: string | null
          management_reminder_sent_at: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          treatment_name: string
          doctor_name?: string
          appointment_date_time: string
          duration_mins?: number
          status?: 'pending' | 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          advance_payment_rm?: number | null
          calcom_booking_uid?: string | null
          mode?: 'in-person' | 'virtual'
          meeting_link?: string | null
          notes?: string | null
          rescheduled_from_id?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          internal_notes?: string | null
          clinical_notes?: string | null
          room?: string | null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pre_visit_form?: any | null
          advance_payment_status?: string | null
          created_by_admin_id?: string | null
          updated_at?: string
          gender_requirement?: 'any' | 'men_only' | 'ladies_only'
          group_management_active?: boolean
          group_detached_at?: string | null
          management_reminder_sent_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          treatment_name?: string
          doctor_name?: string
          appointment_date_time?: string
          duration_mins?: number
          status?: 'pending' | 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          advance_payment_rm?: number | null
          calcom_booking_uid?: string | null
          mode?: 'in-person' | 'virtual'
          meeting_link?: string | null
          notes?: string | null
          rescheduled_from_id?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          internal_notes?: string | null
          clinical_notes?: string | null
          room?: string | null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pre_visit_form?: any | null
          advance_payment_status?: string | null
          created_by_admin_id?: string | null
          updated_at?: string
          gender_requirement?: 'any' | 'men_only' | 'ladies_only'
          group_management_active?: boolean
          group_detached_at?: string | null
          management_reminder_sent_at?: string | null
        }
      }
      booking_management_otps: {
        Row: {
          id: string
          email_hash: string
          code_hash: string
          expires_at: string
          attempts: number
          send_count: number
          request_ip_hash: string | null
          consumed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email_hash: string
          code_hash: string
          expires_at: string
          attempts?: number
          send_count?: number
          request_ip_hash?: string | null
          consumed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email_hash?: string
          code_hash?: string
          expires_at?: string
          attempts?: number
          send_count?: number
          request_ip_hash?: string | null
          consumed_at?: string | null
          created_at?: string
        }
      }
      booking_management_grants: {
        Row: {
          id: string
          token_hash: string
          email_hash: string
          appointment_ids: string[]
          expires_at: string
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token_hash: string
          email_hash: string
          appointment_ids: string[]
          expires_at: string
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          token_hash?: string
          email_hash?: string
          appointment_ids?: string[]
          expires_at?: string
          revoked_at?: string | null
          created_at?: string
        }
      }
      booking_events: {
        Row: {
          id: string
          appointment_id: string
          event_type: 'rescheduled' | 'cancelled' | 'group_detached' | 'refund_requested' | 'refund_confirmed' | 'refund_failed' | 'management_link_recovered'
          actor_type: 'customer' | 'guest' | 'staff' | 'system' | 'provider'
          old_data: Json
          new_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          event_type: 'rescheduled' | 'cancelled' | 'group_detached' | 'refund_requested' | 'refund_confirmed' | 'refund_failed' | 'management_link_recovered'
          actor_type: 'customer' | 'guest' | 'staff' | 'system' | 'provider'
          old_data?: Json
          new_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          event_type?: 'rescheduled' | 'cancelled' | 'group_detached' | 'refund_requested' | 'refund_confirmed' | 'refund_failed' | 'management_link_recovered'
          actor_type?: 'customer' | 'guest' | 'staff' | 'system' | 'provider'
          old_data?: Json
          new_data?: Json
          created_at?: string
        }
      }
      booking_refunds: {
        Row: {
          id: string
          appointment_id: string
          provider: 'stripe' | 'billplz' | 'stub'
          provider_refund_id: string | null
          amount_rm: number
          status: 'claimed' | 'pending' | 'confirmed' | 'failed' | 'exception'
          eligibility_reason: 'mistake_window' | 'advance_window'
          idempotency_key: string
          bank_code: string | null
          bank_account_last4: string | null
          failure_reason: string | null
          requested_at: string | null
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          provider: 'stripe' | 'billplz' | 'stub'
          provider_refund_id?: string | null
          amount_rm: number
          status: 'claimed' | 'pending' | 'confirmed' | 'failed' | 'exception'
          eligibility_reason: 'mistake_window' | 'advance_window'
          idempotency_key: string
          bank_code?: string | null
          bank_account_last4?: string | null
          failure_reason?: string | null
          requested_at?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          provider?: 'stripe' | 'billplz' | 'stub'
          provider_refund_id?: string | null
          amount_rm?: number
          status?: 'claimed' | 'pending' | 'confirmed' | 'failed' | 'exception'
          eligibility_reason?: 'mistake_window' | 'advance_window'
          idempotency_key?: string
          bank_code?: string | null
          bank_account_last4?: string | null
          failure_reason?: string | null
          requested_at?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
      }
      booking_resource_members: {
        Row: {
          resource_type: 'gender' | 'consultation'
          resource_key: string
          member_key: string
          active: boolean
        }
        Insert: {
          resource_type: 'gender' | 'consultation'
          resource_key: string
          member_key: string
          active?: boolean
        }
        Update: {
          resource_type?: 'gender' | 'consultation'
          resource_key?: string
          member_key?: string
          active?: boolean
        }
      }
      sales_agents: {
        Row: {
          id: string
          user_id: string
          referral_code: string
          commission_rate: number
          commission_type: 'affiliate' | 'reseller'
          total_sales_generated_rm: number
          total_commission_earned_rm: number
          created_at: string
          status: 'active' | 'suspended'
          suspended_at: string | null
          suspended_reason: string | null
          internal_notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_code: string
          commission_rate?: number
          commission_type?: 'affiliate' | 'reseller'
          total_sales_generated_rm?: number
          total_commission_earned_rm?: number
          created_at?: string
          status?: 'active' | 'suspended'
          suspended_at?: string | null
          suspended_reason?: string | null
          internal_notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referral_code?: string
          commission_rate?: number
          commission_type?: 'affiliate' | 'reseller'
          total_sales_generated_rm?: number
          total_commission_earned_rm?: number
          created_at?: string
          status?: 'active' | 'suspended'
          suspended_at?: string | null
          suspended_reason?: string | null
          internal_notes?: string | null
          updated_at?: string
        }
      }
      agent_commissions: {
        Row: {
          id: string
          agent_id: string
          order_id: string
          base_amount_rm: number
          rate_percent: number
          commission_rm: number
          status: 'pending' | 'paid' | 'reversed'
          payout_id: string | null
          reversal_reason: string | null
          notes: string | null
          created_at: string
          paid_at: string | null
          reversed_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          order_id: string
          base_amount_rm: number
          rate_percent: number
          commission_rm: number
          status?: 'pending' | 'paid' | 'reversed'
          payout_id?: string | null
          reversal_reason?: string | null
          notes?: string | null
          created_at?: string
          paid_at?: string | null
          reversed_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          order_id?: string
          base_amount_rm?: number
          rate_percent?: number
          commission_rm?: number
          status?: 'pending' | 'paid' | 'reversed'
          payout_id?: string | null
          reversal_reason?: string | null
          notes?: string | null
          created_at?: string
          paid_at?: string | null
          reversed_at?: string | null
        }
      }
      agent_payouts: {
        Row: {
          id: string
          agent_id: string
          amount_rm: number
          commission_count: number
          period_start: string | null
          period_end: string | null
          payment_method: string
          bank_reference: string | null
          notes: string | null
          created_by_admin_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          amount_rm: number
          commission_count?: number
          period_start?: string | null
          period_end?: string | null
          payment_method: string
          bank_reference?: string | null
          notes?: string | null
          created_by_admin_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          amount_rm?: number
          commission_count?: number
          period_start?: string | null
          period_end?: string | null
          payment_method?: string
          bank_reference?: string | null
          notes?: string | null
          created_by_admin_id?: string | null
          created_at?: string
        }
      }
      external_sales: {
        Row: {
          id: string
          agent_id: string
          channel: 'tiktok_shop' | 'shopee' | 'lazada' | 'instagram' | 'whatsapp' | 'other'
          gross_amount_rm: number
          rate_percent: number
          commission_rm: number
          customer_name: string | null
          customer_contact: string | null
          marketplace_order_ref: string | null
          proof_url: string | null
          notes: string | null
          logged_by_admin_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          channel: 'tiktok_shop' | 'shopee' | 'lazada' | 'instagram' | 'whatsapp' | 'other'
          gross_amount_rm: number
          rate_percent: number
          commission_rm: number
          customer_name?: string | null
          customer_contact?: string | null
          marketplace_order_ref?: string | null
          proof_url?: string | null
          notes?: string | null
          logged_by_admin_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          channel?: 'tiktok_shop' | 'shopee' | 'lazada' | 'instagram' | 'whatsapp' | 'other'
          gross_amount_rm?: number
          rate_percent?: number
          commission_rm?: number
          customer_name?: string | null
          customer_contact?: string | null
          marketplace_order_ref?: string | null
          proof_url?: string | null
          notes?: string | null
          logged_by_admin_id?: string | null
          created_at?: string
        }
      }
      marketplace_orders: {
        Row: {
          id: string
          channel: 'tiktok_shop' | 'shopee' | 'lazada' | 'instagram' | 'whatsapp' | 'other'
          marketplace_order_ref: string | null
          customer_name: string
          customer_phone: string | null
          customer_email: string | null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: any
          subtotal_rm: number
          shipping_rm: number
          total_amount_rm: number
          referral_agent_id: string | null
          status: 'pending' | 'approved' | 'rejected'
          notes: string | null
          rejection_reason: string | null
          entered_by_admin_id: string | null
          entered_by_user_id: string | null
          approved_by_admin_id: string | null
          created_order_id: string | null
          approved_at: string | null
          rejected_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          channel: 'tiktok_shop' | 'shopee' | 'lazada' | 'instagram' | 'whatsapp' | 'other'
          marketplace_order_ref?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_email?: string | null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items?: any
          subtotal_rm?: number
          shipping_rm?: number
          total_amount_rm: number
          referral_agent_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          notes?: string | null
          rejection_reason?: string | null
          entered_by_admin_id?: string | null
          entered_by_user_id?: string | null
          approved_by_admin_id?: string | null
          created_order_id?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          channel?: 'tiktok_shop' | 'shopee' | 'lazada' | 'instagram' | 'whatsapp' | 'other'
          marketplace_order_ref?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_email?: string | null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items?: any
          subtotal_rm?: number
          shipping_rm?: number
          total_amount_rm?: number
          referral_agent_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          notes?: string | null
          rejection_reason?: string | null
          entered_by_admin_id?: string | null
          entered_by_user_id?: string | null
          approved_by_admin_id?: string | null
          created_order_id?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          created_at?: string
        }
      }
      agent_invites: {
        Row: {
          id: string
          token: string
          email: string
          full_name: string
          referral_code: string
          commission_rate: number
          commission_type: 'affiliate' | 'reseller'
          expires_at: string
          used_at: string | null
          used_by_user_id: string | null
          created_by_admin_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          email: string
          full_name: string
          referral_code: string
          commission_rate: number
          commission_type?: 'affiliate' | 'reseller'
          expires_at?: string
          used_at?: string | null
          used_by_user_id?: string | null
          created_by_admin_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          email?: string
          full_name?: string
          referral_code?: string
          commission_rate?: number
          commission_type?: 'affiliate' | 'reseller'
          expires_at?: string
          used_at?: string | null
          used_by_user_id?: string | null
          created_by_admin_id?: string | null
          created_at?: string
        }
      }
      quiz_results: {
        Row: {
          id: string
          user_id: string
          quiz_slug: 'prakriti' | 'vikriti' | 'agni' | 'skin' | 'hair' | 'sleep' | 'manas'
          result_data: Json
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_slug: 'prakriti' | 'vikriti' | 'agni' | 'skin' | 'hair' | 'sleep' | 'manas'
          result_data: Json
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_slug?: 'prakriti' | 'vikriti' | 'agni' | 'skin' | 'hair' | 'sleep' | 'manas'
          result_data?: Json
          completed_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          customer_id: string
          topic: 'treatment' | 'prescription' | 'appointment' | 'order' | 'billing' | 'welcome' | 'other'
          subject: string
          status: 'open' | 'awaiting-customer' | 'resolved' | 'closed'
          last_message_at: string
          unread_by_customer: boolean
          unread_by_clinic: boolean
          created_at: string
          internal_notes: string | null
          assigned_to_admin_id: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          topic: 'treatment' | 'prescription' | 'appointment' | 'order' | 'billing' | 'welcome' | 'other'
          subject: string
          status?: 'open' | 'awaiting-customer' | 'resolved' | 'closed'
          last_message_at?: string
          unread_by_customer?: boolean
          unread_by_clinic?: boolean
          created_at?: string
          internal_notes?: string | null
          assigned_to_admin_id?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          topic?: 'treatment' | 'prescription' | 'appointment' | 'order' | 'billing' | 'welcome' | 'other'
          subject?: string
          status?: 'open' | 'awaiting-customer' | 'resolved' | 'closed'
          last_message_at?: string
          unread_by_customer?: boolean
          unread_by_clinic?: boolean
          created_at?: string
          internal_notes?: string | null
          assigned_to_admin_id?: string | null
        }
      }
      support_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_kind: 'customer' | 'clinic' | 'system'
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_kind: 'customer' | 'clinic' | 'system'
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_kind?: 'customer' | 'clinic' | 'system'
          body?: string
          created_at?: string
        }
      }
      promos: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          kind: 'percentage' | 'fixed' | 'free-shipping'
          value_amount: number | null
          min_spend_rm: number
          applies_to: 'all' | 'products' | 'treatments' | 'consultation'
          starts_at: string
          expires_at: string | null
          is_public: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          description?: string | null
          kind: 'percentage' | 'fixed' | 'free-shipping'
          value_amount?: number | null
          min_spend_rm?: number
          applies_to?: 'all' | 'products' | 'treatments' | 'consultation'
          starts_at?: string
          expires_at?: string | null
          is_public?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string | null
          kind?: 'percentage' | 'fixed' | 'free-shipping'
          value_amount?: number | null
          min_spend_rm?: number
          applies_to?: 'all' | 'products' | 'treatments' | 'consultation'
          starts_at?: string
          expires_at?: string | null
          is_public?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      customer_promos: {
        Row: {
          id: string
          customer_id: string
          promo_id: string
          status: 'active' | 'used' | 'expired' | 'revoked'
          source: 'signup' | 'manual-claim' | 'admin-grant' | 'referral' | 'birthday' | 'loyalty'
          granted_at: string
          used_at: string | null
          used_on_order_id: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          promo_id: string
          status?: 'active' | 'used' | 'expired' | 'revoked'
          source: 'signup' | 'manual-claim' | 'admin-grant' | 'referral' | 'birthday' | 'loyalty'
          granted_at?: string
          used_at?: string | null
          used_on_order_id?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          promo_id?: string
          status?: 'active' | 'used' | 'expired' | 'revoked'
          source?: 'signup' | 'manual-claim' | 'admin-grant' | 'referral' | 'birthday' | 'loyalty'
          granted_at?: string
          used_at?: string | null
          used_on_order_id?: string | null
        }
      }
      contact_messages: {
        Row: {
          id: string
          intent: 'treatment' | 'product' | 'corporate' | 'other'
          name: string
          phone: string
          email: string
          message: string
          status: 'new' | 'contacted' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          intent: 'treatment' | 'product' | 'corporate' | 'other'
          name: string
          phone: string
          email: string
          message: string
          status?: 'new' | 'contacted' | 'closed'
          created_at?: string
        }
        Update: {
          id?: string
          intent?: 'treatment' | 'product' | 'corporate' | 'other'
          name?: string
          phone?: string
          email?: string
          message?: string
          status?: 'new' | 'contacted' | 'closed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_agent_invite: {
        Args: {
          p_token: string
          p_user_id: string
        }
        Returns: {
          agent_id: string
          referral_code: string
          commission_type: 'affiliate' | 'reseller'
        }
      }
      reserve_booking_management_otp: {
        Args: {
          p_email_hash: string
          p_code_hash: string
          p_request_ip_hash: string
        }
        Returns: string | null
      }
      reschedule_bookings: {
        Args: {
          p_changes: Json
          p_actor_type: string
          p_now: string
        }
        Returns: Json
      }
      claim_booking_cancellation: {
        Args: {
          p_appointment_ids: string[]
          p_now: string
          p_actor_type: string
        }
        Returns: Json
      }
      verify_booking_management_otp: {
        Args: {
          p_email_hash: string
          p_code_hash: string
          p_normalized_email: string
          p_token_hash: string
        }
        Returns: 'granted' | 'unauthorized'
      }
    }
    Enums: {
      commission_type_enum: 'affiliate' | 'reseller'
    }
  }
}
