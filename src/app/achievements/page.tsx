'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserAchievements, type Achievement } from '@/lib/achievements'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, Trophy, Lock, Calendar } from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'

type AchievementWithEarned = Achievement & {
  earned_at?: string
}

export default function AchievementsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [achievements, setAchievements] = useState<AchievementWithEarned[]>([])
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)

      // Get player data
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', user.id)
        .single()

      if (playerData) {
        setPlayer(playerData)
      }

      // Get user achievements
      const userAchievements = await getUserAchievements(user.id)
      setAchievements(userAchievements)
      
      // Get all achievements to show locked ones
      const { data: allAchievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('points_required')
      
      if (allAchievementsData) {
        setAllAchievements(allAchievementsData)
      }
      
      setLoading(false)
    }

    initialize()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    )
  }

  const earnedIds = new Set(achievements.map(a => a.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* App Header */}
      {user && (
        <AppHeader
          user={user}
          player={player}
          title="🏆 Achievements"
          subtitle={`${achievements.length} / ${allAchievements.length} Unlocked`}
          showBackButton={true}
          showVoiceSettings={true}
          onVoiceSettingsClick={() => router.push('/voice-settings')}
          onMyLevelsClick={() => router.push('/my-levels')}
        />
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAchievements.map((achievement) => {
            const isEarned = earnedIds.has(achievement.id)
            const earnedAchievement = achievements.find(a => a.id === achievement.id)
            
            return (
              <div
                key={achievement.id}
                className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                  isEarned 
                    ? `border-${achievement.badge_color === 'gold' ? 'yellow' : achievement.badge_color}-300 shadow-xl` 
                    : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="p-6 text-center">
                  {/* Badge/Icon */}
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isEarned 
                      ? achievement.badge_color === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        achievement.badge_color === 'green' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                        achievement.badge_color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                        achievement.badge_color === 'purple' ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                        achievement.badge_color === 'orange' ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                        'bg-gradient-to-r from-gray-400 to-gray-500'
                      : 'bg-gray-200'
                  }`}>
                    {isEarned ? (
                      <span className="text-3xl">{achievement.icon}</span>
                    ) : (
                      <Lock className="w-8 h-8 text-gray-500" />
                    )}
                  </div>

                  {/* Badge Label */}
                  {isEarned && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                      achievement.badge_color === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      achievement.badge_color === 'green' ? 'bg-green-100 text-green-800' :
                      achievement.badge_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      achievement.badge_color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      achievement.badge_color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {achievement.badge_color.toUpperCase()} BADGE
                    </div>
                  )}

                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-2 ${
                    isEarned ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm mb-4 ${
                    isEarned ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>

                  {/* Requirements */}
                  <div className="space-y-2 text-xs">
                    {achievement.points_required && (
                      <div className={`flex items-center justify-center ${
                        isEarned ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <Trophy className="w-3 h-3 mr-1" />
                        {achievement.points_required} points required
                      </div>
                    )}
                    {achievement.tutorials_required && (
                      <div className={`flex items-center justify-center ${
                        isEarned ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <Trophy className="w-3 h-3 mr-1" />
                        {achievement.tutorials_required} tutorials required
                      </div>
                    )}
                  </div>

                  {/* Earned Date */}
                  {isEarned && earnedAchievement?.earned_at && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Earned {new Date(earnedAchievement.earned_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Motivational Message */}
        {achievements.length === 0 && (
          <div className="text-center mt-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Your Journey!</h2>
            <p className="text-gray-600 mb-6">Complete tutorials and earn points to unlock amazing achievements!</p>
            <Link
              href="/dashboard"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Learning! 🚀
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}