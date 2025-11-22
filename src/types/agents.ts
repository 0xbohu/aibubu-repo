export type CustomizableFieldType = 'text' | 'select' | 'textarea' | 'number'

export interface CustomizableField {
  label: string
  type: CustomizableFieldType
  placeholder?: string
  options?: string[]
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
}

export interface AgentTemplate {
  id: string
  name: string
  description: string
  category: string
  base_prompt: string
  customizable_fields: Record<string, CustomizableField>
  example_values?: Record<string, string>
  icon: string
  difficulty_level: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface UserAgent {
  id: string
  creator_id: string
  template_id?: string
  name: string
  description?: string
  generated_prompt: string
  customizations: Record<string, string>
  avatar_emoji: string
  is_published: boolean
  is_featured: boolean
  play_count: number
  like_count: number
  created_at: string
  updated_at: string
  // Joined data
  creator?: {
    username: string
    avatar_url?: string
  }
  template?: {
    name: string
    category: string
  }
}

export interface AgentSession {
  id: string
  user_id: string
  agent_id: string
  session_data?: {
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
    state?: Record<string, any>
  }
  duration_minutes: number
  rating?: number
  feedback?: string
  created_at: string
  updated_at: string
}

export interface AgentLike {
  id: string
  user_id: string
  agent_id: string
  created_at: string
}

export interface AgentReview {
  id: string
  user_id: string
  agent_id: string
  rating: number
  comment?: string
  is_featured: boolean
  created_at: string
  // Joined data
  user?: {
    username: string
    avatar_url?: string
  }
}

// Helper types for UI components
export interface AgentTemplateWithStats extends AgentTemplate {
  usage_count?: number
  average_rating?: number
}

export interface UserAgentWithStats extends UserAgent {
  average_rating?: number
  review_count?: number
  is_liked_by_user?: boolean
}

// Agent creation flow types
export interface AgentCreationStep {
  id: string
  title: string
  description: string
  completed: boolean
}

export interface AgentBuilder {
  template: AgentTemplate
  customizations: Record<string, string>
  preview_prompt: string
  current_step: number
  steps: AgentCreationStep[]
}

// Agent testing types
export interface AgentTestSession {
  agent: UserAgent
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  isLoading: boolean
}

// Categories for filtering
export type AgentCategory = 
  | 'storytelling' 
  | 'science' 
  | 'games' 
  | 'entertainment' 
  | 'education' 
  | 'pets' 
  | 'adventure'
  | 'creative'

// Sort options for agent gallery
export type AgentSortOption = 
  | 'newest' 
  | 'oldest' 
  | 'most_popular' 
  | 'highest_rated' 
  | 'most_played'