---
inclusion: always
---

# Database Schema Reference

## Core Tables

### players
User profiles with authentication-based access control
- `id` (UUID, PK): User ID (matches Supabase auth.uid())
- `email` (VARCHAR, UNIQUE): User email
- `username` (VARCHAR, UNIQUE): Display name
- `avatar_url` (TEXT): Profile picture URL
- `total_points` (INTEGER): Accumulated XP points
- `current_level` (INTEGER): Player level
- `player_preferences` (JSONB): User settings (voice, onboarding status, etc.)
- `player_levels` (JSONB): Language/subject proficiency levels
- `created_at`, `updated_at` (TIMESTAMP)

### tutorials
Learning content - public read access for published content
- `id` (UUID, PK)
- `title`, `description` (VARCHAR/TEXT)
- `difficulty_level` (INTEGER 1-10)
- `category` (VARCHAR)
- `tutorial_type` (VARCHAR): 'maths', 'thinking', 'reading', 'writing', 'science', 'agent', 'speaking'
- `age_min`, `age_max` (INTEGER): Target age range
- `learning_objectives` (TEXT[])
- `code_template`, `expected_output` (TEXT): For code tutorials
- `content_screens` (JSONB): Interactive content screens
- `questions` (JSONB): Assessment questions
- `points_reward` (INTEGER)
- `max_generated_points` (INTEGER): For AI-generated content
- `order_index` (INTEGER): Display order
- `is_published` (BOOLEAN)

### player_progress
Individual user progress - private to each user
- `id` (UUID, PK)
- `player_id` (UUID, FK → players)
- `tutorial_id` (UUID, FK → tutorials)
- `status` (VARCHAR): 'not_started', 'in_progress', 'completed'
- `code_solution` (TEXT)
- `points_earned` (INTEGER)
- `attempts` (INTEGER)
- `completed_at` (TIMESTAMP)

### achievements
Achievement definitions - public read access
- `id` (UUID, PK)
- `title`, `description` (VARCHAR/TEXT)
- `icon` (VARCHAR): Emoji or icon identifier
- `points_required`, `tutorials_required` (INTEGER)
- `badge_color` (VARCHAR)
- `is_secret` (BOOLEAN)

### player_achievements
User-earned achievements - viewable by others for social features
- `id` (UUID, PK)
- `player_id` (UUID, FK → players)
- `achievement_id` (UUID, FK → achievements)
- `earned_at` (TIMESTAMP)

### speaking_languages
Supported languages for speaking tutorials
- `id` (UUID, PK)
- `language_code` (VARCHAR, UNIQUE): ISO code (en, es, zh, etc.)
- `language_name`, `native_name` (VARCHAR)
- `flag_emoji` (VARCHAR)
- `cefr_supported` (BOOLEAN): Uses CEFR levels (A1-C2)
- `difficulty_levels` (TEXT[]): Available levels
- `is_active` (BOOLEAN)

### generated_tutorials
AI-generated personalized tutorials
- `id` (UUID, PK)
- `base_tutorial_id` (UUID, FK → tutorials)
- `player_id` (UUID, FK → players)
- `generated_content` (JSONB): Custom content screens
- `generated_questions` (JSONB): Custom questions
- `points_awarded` (INTEGER)
- `completed_at` (TIMESTAMP)

### tutorial_responses
Player answers and LLM validation
- `id` (UUID, PK)
- `player_id` (UUID, FK → players)
- `tutorial_id` (UUID, FK → tutorials)
- `generated_tutorial_id` (UUID, FK → generated_tutorials)
- `question_id` (VARCHAR)
- `player_answer` (TEXT)
- `llm_validation` (JSONB): AI assessment results
- `is_correct` (BOOLEAN)
- `points_earned` (INTEGER)

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:
- **players**: Users can view/update own profile; public can view basic info
- **tutorials**: Anyone can view published tutorials
- **player_progress**: Users can only access their own progress
- **achievements**: Public read access
- **player_achievements**: Users can view own; others can see for social features

## Indexes

Performance indexes on:
- `player_progress(player_id, tutorial_id)`
- `tutorials(difficulty_level, category, tutorial_type)`
- `player_achievements(player_id)`
- `speaking_languages(language_code)`
