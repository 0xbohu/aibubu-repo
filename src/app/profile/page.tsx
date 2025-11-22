'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, User as UserIcon, Mail, Calendar, Trophy, Zap, Edit } from 'lucide-react'
import Link from 'next/link'

type PlayerData = {
  id: string
  username: string
  email: string
  total_points: number
  current_level: number
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [stats, setStats] = useState({
    completedTutorials: 0,
    totalAchievements: 0,
    joinedDate: ''
  })
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
      
      // Get stats
      const { count: completedCount } = await supabase
        .from('player_progress')
        .select('*', { count: 'exact' })
        .eq('player_id', user.id)
        .eq('status', 'completed')
      
      const { count: achievementsCount } = await supabase
        .from('player_achievements')
        .select('*', { count: 'exact' })
        .eq('player_id', user.id)
      
      setStats({
        completedTutorials: completedCount || 0,
        totalAchievements: achievementsCount || 0,
        joinedDate: playerData?.created_at ? new Date(playerData.created_at).toLocaleDateString() : ''
      })
      
      setLoading(false)
    }

    initialize()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center space-x-2">
                <UserIcon className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-24"></div>
            <div className="px-6 pb-6">
              <div className="flex items-center -mt-12 mb-4">
                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white">
                  <UserIcon className="w-12 h-12 text-gray-400" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-800">{player?.username}</h2>
                <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
              
              <div className="flex items-center text-gray-600 mb-4">
                <Mail className="w-4 h-4 mr-2" />
                {player?.email}
              </div>
              
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Joined {stats.joinedDate}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">Level {player?.current_level || 1}</div>
              <div className="text-gray-600 text-sm">Current Level</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{player?.total_points || 0}</div>
              <div className="text-gray-600 text-sm">Total Points</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{stats.completedTutorials}</div>
              <div className="text-gray-600 text-sm">Tutorials Done</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{stats.totalAchievements}</div>
              <div className="text-gray-600 text-sm">Achievements</div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Level Progress</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Level {player?.current_level || 1}</span>
                <span>Level {(player?.current_level || 1) + 1}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((player?.total_points || 0) % 100)}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{(player?.total_points || 0) % 100} / 100 XP</span>
                <span>{100 - ((player?.total_points || 0) % 100)} XP to next level</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard"
                className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mr-4">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Continue Learning</h4>
                  <p className="text-gray-600 text-sm">Go back to tutorials</p>
                </div>
              </Link>

              <Link
                href="/achievements"
                className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl border border-yellow-200 transition-colors group"
              >
                <div className="w-12 h-12 bg-yellow-100 group-hover:bg-yellow-200 rounded-full flex items-center justify-center mr-4">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">View Achievements</h4>
                  <p className="text-gray-600 text-sm">See your badges</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}