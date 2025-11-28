export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          website_url: string | null
          brand_name: string | null
          subscription_tier: string
          subscription_status: string
          subscription_end_date: string | null
          onboarding_completed: boolean
          is_admin: boolean
          subscription_plan: 'free' | 'pro'
          plan_started_at: string
          monthly_query_limit: number
          queries_used_this_month: number
          last_query_reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          website_url?: string | null
          brand_name?: string | null
          subscription_tier?: string
          subscription_status?: string
          subscription_end_date?: string | null
          onboarding_completed?: boolean
          is_admin?: boolean
          subscription_plan?: 'free' | 'pro'
          plan_started_at?: string
          monthly_query_limit?: number
          queries_used_this_month?: number
          last_query_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          website_url?: string | null
          brand_name?: string | null
          subscription_tier?: string
          subscription_status?: string
          subscription_end_date?: string | null
          onboarding_completed?: boolean
          is_admin?: boolean
          subscription_plan?: 'free' | 'pro'
          plan_started_at?: string
          monthly_query_limit?: number
          queries_used_this_month?: number
          last_query_reset_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      competitors: {
        Row: {
          id: string
          user_id: string
          name: string
          website_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          website_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          website_url?: string | null
          created_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          text: string
          is_active: boolean
          frequency: string
          platform: string | null
          location: string | null
          last_triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          is_active?: boolean
          frequency?: string
          platform?: string | null
          location?: string | null
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          is_active?: boolean
          frequency?: string
          platform?: string | null
          location?: string | null
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompt_executions: {
        Row: {
          id: string
          prompt_id: string
          user_id: string
          model: string
          status: string
          platform: string
          ai_response: string | null
          sources: Json | null
          error_message: string | null
          executed_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          prompt_id: string
          user_id: string
          model: string
          status?: string
          platform?: string
          ai_response?: string | null
          sources?: Json | null
          error_message?: string | null
          executed_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          prompt_id?: string
          user_id?: string
          model?: string
          status?: string
          platform?: string
          ai_response?: string | null
          sources?: Json | null
          error_message?: string | null
          executed_at?: string
          completed_at?: string | null
        }
      }
      brand_mentions: {
        Row: {
          id: string
          execution_id: string
          brand_name: string
          mention_count: number
          is_user_brand: boolean
          created_at: string
        }
        Insert: {
          id?: string
          execution_id: string
          brand_name: string
          mention_count?: number
          is_user_brand?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string
          brand_name?: string
          mention_count?: number
          is_user_brand?: boolean
          created_at?: string
        }
      }
      sentiment_analysis: {
        Row: {
          id: string
          execution_id: string
          positive_percentage: number
          neutral_percentage: number
          negative_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          execution_id: string
          positive_percentage?: number
          neutral_percentage?: number
          negative_percentage?: number
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string
          positive_percentage?: number
          neutral_percentage?: number
          negative_percentage?: number
          created_at?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          execution_id: string
          recommendation_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          execution_id: string
          recommendation_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string
          recommendation_id?: string
          text?: string
          created_at?: string
        }
      }
    }
  }
}
