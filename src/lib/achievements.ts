import { supabase } from './supabase'

export type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  points_required?: number
  tutorials_required?: number
  badge_color: string
  is_secret: boolean
}

export async function checkAchievements(userId: string, context?: {
  tutorialCompleted?: boolean
  pointsEarned?: number
  tutorialType?: string
}) {
  try {
    // Get user data
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', userId)
      .single()

    if (!player) return []

    // Get completed tutorials count
    const { data: progress, count: completedTutorials } = await supabase
      .from('player_progress')
      .select('*', { count: 'exact' })
      .eq('player_id', userId)
      .eq('status', 'completed')

    // Get all achievements
    const { data: allAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')

    if (achievementsError) {
      console.error('Error loading achievements:', achievementsError)
      return null
    }

    if (!allAchievements || allAchievements.length === 0) {
      console.warn('No achievements found in database')
      return null
    }

    // Get already earned achievements
    const { data: earnedAchievements } = await supabase
      .from('player_achievements')
      .select('achievement_id')
      .eq('player_id', userId)

    const earnedIds = new Set(earnedAchievements?.map(ea => ea.achievement_id) || [])
    const newAchievements: Achievement[] = []

    // Get tutorial progress by category for category-specific achievements
    const { data: progressByCategory } = await supabase
      .from('player_progress')
      .select(`
        *,
        tutorials!inner (tutorial_type)
      `)
      .eq('player_id', userId)
      .eq('status', 'completed')

    const categoryCompletions = {
      maths: progressByCategory?.filter(p => p.tutorials?.tutorial_type === 'maths').length || 0,
      thinking: progressByCategory?.filter(p => p.tutorials?.tutorial_type === 'thinking').length || 0,
      reading: progressByCategory?.filter(p => p.tutorials?.tutorial_type === 'reading').length || 0,
      writing: progressByCategory?.filter(p => p.tutorials?.tutorial_type === 'writing').length || 0,
      science: progressByCategory?.filter(p => p.tutorials?.tutorial_type === 'science').length || 0,
    }

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue

      let shouldEarn = false

      // Check points requirement
      if (achievement.points_required && player.total_points >= achievement.points_required) {
        shouldEarn = true
      }

      // Check tutorials requirement (general)
      if (achievement.tutorials_required && (completedTutorials || 0) >= achievement.tutorials_required) {
        shouldEarn = true
      }

      // Category-specific achievement checks
      const categoryChecks = {
        'Number Wizard': () => categoryCompletions.maths >= 5,
        'Critical Thinker': () => categoryCompletions.thinking >= 5,
        'Book Worm': () => categoryCompletions.reading >= 5,
        'Story Teller': () => categoryCompletions.writing >= 5,
        'Science Explorer': () => categoryCompletions.science >= 5,
        'Math Champion': () => categoryCompletions.maths >= 10,
        'Logic Master': () => categoryCompletions.thinking >= 10,
        'Reading Pro': () => categoryCompletions.reading >= 10,
        'Writing Genius': () => categoryCompletions.writing >= 10,
        'Science Genius': () => categoryCompletions.science >= 10,
        'Mathematics Sage': () => categoryCompletions.maths >= 20,
        'Philosophy Master': () => categoryCompletions.thinking >= 20,
        'Literature Expert': () => categoryCompletions.reading >= 20,
        'Author Extraordinaire': () => categoryCompletions.writing >= 20,
        'Scientific Genius': () => categoryCompletions.science >= 20,
        'Renaissance Scholar': () => Object.values(categoryCompletions).every(count => count >= 5),
      }

      if (achievement.title in categoryChecks) {
        shouldEarn = categoryChecks[achievement.title as keyof typeof categoryChecks]()
      }

      // Time-based achievement checks
      if (achievement.title === 'Quick Learner') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { count: todayCount } = await supabase
          .from('player_progress')
          .select('*', { count: 'exact' })
          .eq('player_id', userId)
          .eq('status', 'completed')
          .gte('completed_at', today.toISOString())

        if ((todayCount || 0) >= 3) {
          shouldEarn = true
        }
      }

      // Perfect score achievement (example - requires additional tracking)
      if (achievement.title === 'Perfect Score') {
        const { count: perfectScores } = await supabase
          .from('player_progress')
          .select('*', { count: 'exact' })
          .eq('player_id', userId)
          .eq('status', 'completed')
          .gte('points_earned', 100) // Assuming 100 is max points per tutorial

        if ((perfectScores || 0) >= 5) {
          shouldEarn = true
        }
      }

      if (shouldEarn) {
        // Award the achievement
        await supabase
          .from('player_achievements')
          .insert({
            player_id: userId,
            achievement_id: achievement.id,
            earned_at: new Date().toISOString()
          })

        newAchievements.push(achievement)
      }
    }

    return newAchievements.length > 0 ? newAchievements[0] : null
  } catch (error) {
    console.error('Error checking achievements:', error)
    return null
  }
}

export async function getUserAchievements(userId: string) {
  try {
    const { data } = await supabase
      .from('player_achievements')
      .select(`
        *,
        achievements (*)
      `)
      .eq('player_id', userId)
      .order('earned_at', { ascending: false })

    return data?.map(pa => ({
      ...pa.achievements,
      earned_at: pa.earned_at
    })) || []
  } catch (error) {
    console.error('Error getting user achievements:', error)
    return []
  }
}