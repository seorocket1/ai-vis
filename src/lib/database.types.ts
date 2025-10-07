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
          platform: string
          status: string
          ai_response: string | null
          executed_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          prompt_id: string
          user_id: string
          model: string
          platform: string
          status?: string
          ai_response?: string | null
          executed_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          prompt_id?: string
          user_id?: string
          model?: string
          platform?: string
          status?: string
          ai_response?: string | null
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
      aggregated_metrics: {
        Row: {
          id: string
          user_id: string
          time_period: string
          avg_sentiment_score: number
          avg_brand_visibility: number
          share_of_voice: number
          competitive_rank: number
          response_quality: number
          platform_coverage: number
          total_executions: number
          total_brand_mentions: number
          total_competitor_mentions: number
          top_competitor: string | null
          avg_positive_sentiment: number
          avg_neutral_sentiment: number
          avg_negative_sentiment: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          time_period?: string
          avg_sentiment_score?: number
          avg_brand_visibility?: number
          share_of_voice?: number
          competitive_rank?: number
          response_quality?: number
          platform_coverage?: number
          total_executions?: number
          total_brand_mentions?: number
          total_competitor_mentions?: number
          top_competitor?: string | null
          avg_positive_sentiment?: number
          avg_neutral_sentiment?: number
          avg_negative_sentiment?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          time_period?: string
          avg_sentiment_score?: number
          avg_brand_visibility?: number
          share_of_voice?: number
          competitive_rank?: number
          response_quality?: number
          platform_coverage?: number
          total_executions?: number
          total_brand_mentions?: number
          total_competitor_mentions?: number
          top_competitor?: string | null
          avg_positive_sentiment?: number
          avg_neutral_sentiment?: number
          avg_negative_sentiment?: number
          updated_at?: string
          created_at?: string
        }
      }
    }
  }
}
