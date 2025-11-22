export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url?: string
          total_points: number
          current_level: number
          player_preferences: Record<string, any>
          player_levels: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string
          total_points?: number
          current_level?: number
          player_preferences?: Record<string, any>
          player_levels?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string
          total_points?: number
          current_level?: number
          player_preferences?: Record<string, any>
          player_levels?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      tutorials: {
        Row: {
          id: string
          title: string
          description: string
          difficulty_level: number
          category: string
          tutorial_type: 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent' | 'speaking'
          age_min: number
          age_max: number
          learning_objectives: string[]
          code_template?: string
          expected_output?: string
          content_screens?: Record<string, any>
          questions?: Record<string, any>
          max_generated_points: number
          points_reward: number
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          difficulty_level: number
          category: string
          tutorial_type?: 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent' | 'speaking'
          age_min?: number
          age_max?: number
          learning_objectives: string[]
          code_template?: string
          expected_output?: string
          content_screens?: Record<string, any>
          questions?: Record<string, any>
          max_generated_points?: number
          points_reward: number
          order_index: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          difficulty_level?: number
          category?: string
          tutorial_type?: 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent'
          age_min?: number
          age_max?: number
          learning_objectives?: string[]
          code_template?: string
          expected_output?: string
          content_screens?: Record<string, any>
          questions?: Record<string, any>
          max_generated_points?: number
          points_reward?: number
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      player_progress: {
        Row: {
          id: string
          player_id: string
          tutorial_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          code_solution?: string
          points_earned: number
          attempts: number
          completed_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          tutorial_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          code_solution?: string
          points_earned?: number
          attempts?: number
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          tutorial_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          code_solution?: string
          points_earned?: number
          attempts?: number
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          icon: string
          points_required?: number
          tutorials_required?: number
          badge_color: string
          is_secret: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon: string
          points_required?: number
          tutorials_required?: number
          badge_color: string
          is_secret?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string
          points_required?: number
          tutorials_required?: number
          badge_color?: string
          is_secret?: boolean
          created_at?: string
        }
      }
      player_achievements: {
        Row: {
          id: string
          player_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          player_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      agent_templates: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          base_prompt: string
          customizable_fields: Record<string, any>
          example_values?: Record<string, any>
          icon: string
          difficulty_level: number
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          base_prompt: string
          customizable_fields: Record<string, any>
          example_values?: Record<string, any>
          icon?: string
          difficulty_level?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          base_prompt?: string
          customizable_fields?: Record<string, any>
          example_values?: Record<string, any>
          icon?: string
          difficulty_level?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_agents: {
        Row: {
          id: string
          creator_id: string
          template_id?: string
          name: string
          description?: string
          generated_prompt: string
          customizations: Record<string, any>
          avatar_emoji: string
          is_published: boolean
          is_featured: boolean
          play_count: number
          like_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          template_id?: string
          name: string
          description?: string
          generated_prompt: string
          customizations: Record<string, any>
          avatar_emoji?: string
          is_published?: boolean
          is_featured?: boolean
          play_count?: number
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          template_id?: string
          name?: string
          description?: string
          generated_prompt?: string
          customizations?: Record<string, any>
          avatar_emoji?: string
          is_published?: boolean
          is_featured?: boolean
          play_count?: number
          like_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      agent_sessions: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          session_data?: Record<string, any>
          duration_minutes: number
          rating?: number
          feedback?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          session_data?: Record<string, any>
          duration_minutes?: number
          rating?: number
          feedback?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          session_data?: Record<string, any>
          duration_minutes?: number
          rating?: number
          feedback?: string
          created_at?: string
          updated_at?: string
        }
      }
      agent_likes: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          created_at?: string
        }
      }
      agent_reviews: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          rating: number
          comment?: string
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          rating: number
          comment?: string
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          rating?: number
          comment?: string
          is_featured?: boolean
          created_at?: string
        }
      }
      generated_tutorials: {
        Row: {
          id: string
          base_tutorial_id: string
          player_id: string
          generated_content: Record<string, any>
          generated_questions: Record<string, any>
          points_awarded: number
          completed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          base_tutorial_id: string
          player_id: string
          generated_content: Record<string, any>
          generated_questions: Record<string, any>
          points_awarded?: number
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          base_tutorial_id?: string
          player_id?: string
          generated_content?: Record<string, any>
          generated_questions?: Record<string, any>
          points_awarded?: number
          completed_at?: string
          created_at?: string
        }
      }
      tutorial_responses: {
        Row: {
          id: string
          player_id: string
          tutorial_id?: string
          generated_tutorial_id?: string
          question_id: string
          player_answer: string
          llm_validation?: Record<string, any>
          is_correct?: boolean
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          tutorial_id?: string
          generated_tutorial_id?: string
          question_id: string
          player_answer: string
          llm_validation?: Record<string, any>
          is_correct?: boolean
          points_earned?: number
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          tutorial_id?: string
          generated_tutorial_id?: string
          question_id?: string
          player_answer?: string
          llm_validation?: Record<string, any>
          is_correct?: boolean
          points_earned?: number
          created_at?: string
        }
      }
      speaking_languages: {
        Row: {
          id: string
          language_code: string
          language_name: string
          native_name: string
          flag_emoji: string
          cefr_supported: boolean
          difficulty_levels: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          language_code: string
          language_name: string
          native_name: string
          flag_emoji: string
          cefr_supported?: boolean
          difficulty_levels?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          language_code?: string
          language_name?: string
          native_name?: string
          flag_emoji?: string
          cefr_supported?: boolean
          difficulty_levels?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_language_questions: {
        Row: {
          id: string
          language_code: string
          difficulty_level: string
          question_type: string
          question_text: string
          expected_answer?: string
          pronunciation_text?: string
          sample_audio_url?: string
          difficulty_score: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          language_code: string
          difficulty_level: string
          question_type: string
          question_text: string
          expected_answer?: string
          pronunciation_text?: string
          sample_audio_url?: string
          difficulty_score?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          language_code?: string
          difficulty_level?: string
          question_type?: string
          question_text?: string
          expected_answer?: string
          pronunciation_text?: string
          sample_audio_url?: string
          difficulty_score?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}