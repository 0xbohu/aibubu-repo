'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  Trophy, 
  Star, 
  Play, 
  Lock,
  ChevronRight,
  Medal,
  Target,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import UserDropdown from '@/components/UserDropdown'

type Tutorial = {
  id: string
  title: string
  description: string
  difficulty_level: number
  category: string
  points_reward: number
  order_index: number
}

type PlayerData = {
  id: string
  username: string
  total_points: number
  current_level: number
  player_preferences: Record<string, any>
  player_levels: Record<string, any>
}

type Progress = {
  tutorial_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  points_earned: number
}

export default function ContinueListClassicPage() {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Get player data including preferences and levels
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (playerData) {
        setPlayer(playerData)
      }
      
      // Get tutorials (only speaking and maths)
      const { data: tutorialsData } = await supabase
        .from('tutorials')
        .select('*')
        .eq('is_published', true)
        .in('tutorial_type', ['speaking', 'maths'])
        .order('order_index')
      
      if (tutorialsData) {
        setTutorials(tutorialsData)
      }
      
      // Get user progress
      const { data: progressData } = await supabase
        .from('player_progress')
        .select('*')
        .eq('player_id', user.id)
      
      if (progressData) {
        const progressMap: Record<string, Progress> = {}
        progressData.forEach(p => {
          progressMap[p.tutorial_id] = {
            tutorial_id: p.tutorial_id,
            status: p.status as 'not_started' | 'in_progress' | 'completed',
            points_earned: p.points_earned
          }
        })
        setProgress(progressMap)
      }
      
      setLoading(false)
    }

    getUser()
  }, [router])

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-800 border-green-200'
    if (level <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getDifficultyText = (level: number) => {
    if (level <= 3) return 'Beginner'
    if (level <= 6) return 'Intermediate'
    return 'Advanced'
  }

  const getProgressIcon = (tutorialId: string) => {
    const prog = progress[tutorialId]
    if (!prog || prog.status === 'not_started') return <Play className="w-5 h-5 text-blue-500" />
    if (prog.status === 'in_progress') return <Target className="w-5 h-5 text-orange-500" />
    return <Star className="w-5 h-5 text-yellow-500 fill-current" />
  }

  const isLocked = (tutorial: Tutorial) => {
    const prevTutorial = tutorials.find(t => t.order_index === tutorial.order_index - 1)
    if (!prevTutorial) return false
    
    const prevProgress = progress[prevTutorial.id]
    return !prevProgress || prevProgress.status !== 'completed'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutorials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Continue Learning</h1>
                <p className="text-gray-600">Pick up where you left off</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-2 rounded-full">
                <Zap className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-800">{player?.total_points || 0} XP</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 rounded-full">
                <Medal className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-purple-800">Level {player?.current_level || 1}</span>
              </div>
              
              <UserDropdown
                user={user}
                player={player}
                showVoiceSettings={false}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Progress Overview */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Progress Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">
                  {Object.values(progress).filter(p => p.status === 'completed').length}
                </div>
                <div className="text-green-600 text-sm">Completed</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">
                  {Object.values(progress).filter(p => p.status === 'in_progress').length}
                </div>
                <div className="text-blue-600 text-sm">In Progress</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <Lightbulb className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-800">{tutorials.length}</div>
                <div className="text-purple-600 text-sm">Total Lessons</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tutorials List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">All Tutorials</h2>
            <div className="text-sm text-gray-500">
              {tutorials.length} tutorial{tutorials.length !== 1 ? 's' : ''} available
            </div>
          </div>
          
          {tutorials.map((tutorial) => {
            const locked = isLocked(tutorial)
            const tutorialProgress = progress[tutorial.id]
            const isCompleted = tutorialProgress?.status === 'completed'
            
            return (
              <div
                key={tutorial.id}
                className={`bg-white rounded-2xl shadow-lg border transition-all duration-200 ${
                  locked 
                    ? 'border-gray-200 opacity-60' 
                    : 'border-gray-100 hover:shadow-xl hover:border-blue-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          locked 
                            ? 'bg-gray-100' 
                            : isCompleted 
                              ? 'bg-green-100' 
                              : 'bg-blue-100'
                        }`}>
                          {locked ? (
                            <Lock className="w-6 h-6 text-gray-400" />
                          ) : (
                            getProgressIcon(tutorial.id)
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{tutorial.title}</h3>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(tutorial.difficulty_level)}`}>
                              {getDifficultyText(tutorial.difficulty_level)}
                            </span>
                            <span className="text-sm text-gray-600 capitalize">
                              {tutorial.category}
                            </span>
                            <div className="flex items-center text-sm text-orange-600">
                              <Zap className="w-4 h-4 mr-1" />
                              {tutorial.points_reward} XP
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{tutorial.description}</p>
                      
                      {isCompleted && (
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <Star className="w-4 h-4 mr-2 fill-current" />
                          Completed! Earned {tutorialProgress.points_earned} XP
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      {locked ? (
                        <div className="text-center text-gray-400">
                          <Lock className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">Complete previous lesson</p>
                        </div>
                      ) : (
                        <Link 
                          href={`/tutorial/${tutorial.id}`}
                          className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          {isCompleted ? 'Review' : tutorialProgress?.status === 'in_progress' ? 'Continue' : 'Start'}
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {tutorials.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No tutorials available</h3>
            <p className="text-gray-600">Check back later for new learning content!</p>
          </div>
        )}
      </main>
    </div>
  )
}