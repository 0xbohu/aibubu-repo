'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  Trophy, 
  Star,
  ChevronRight,
  Medal,
  Target,
  Zap,
  Play,
  Crown,
  Sparkles,
  Heart,
  Flame
} from 'lucide-react'
import Link from 'next/link'
import UserDropdown from '@/components/UserDropdown'
import AppHeader from '@/components/AppHeader'

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

type Language = {
  id: string
  language_code: string
  language_name: string
  native_name: string
  flag_emoji: string
  cefr_supported: boolean
  difficulty_levels: string[]
}

type Progress = {
  tutorial_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  points_earned: number
}

// AiBubu UI Components (from demo page)
const KidCard = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
}) => (
  <div
    className={`bg-white rounded-3xl shadow-lg border-4 border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:scale-105 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const KidButton = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  href,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  href?: string;
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white",
    secondary: "bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white",
    success: "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white",
    warning: "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white",
    danger: "bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const buttonClasses = `${variants[variant]} ${sizes[size]} font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-4 border-white/30 inline-flex items-center justify-center whitespace-nowrap ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClasses} onClick={onClick}>
      {children}
    </button>
  );
};

const KidBadge = ({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "yellow" | "purple" | "pink" | "gray" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
    pink: "bg-pink-100 text-pink-800 border-pink-300",
    gray: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 ${colors[color]}`}>
      {children}
    </span>
  );
};

const AiBubuProgressBar = ({ progress, sections = 5, className = "" }: { progress: number; sections?: number; className?: string }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center space-x-1">
        {Array.from({ length: sections }, (_, index) => {
          const sectionProgress = Math.min(
            100,
            Math.max(
              0,
              ((progress - index * (100 / sections)) / (100 / sections)) * 100
            )
          );
          const isCompleted = sectionProgress >= 100;
          const isActive = sectionProgress > 0 && sectionProgress < 100;

          return (
            <div key={index} className="flex-1 relative">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    isCompleted
                      ? "bg-gradient-to-r from-green-400 to-green-600"
                      : isActive
                      ? "bg-gradient-to-r from-blue-400 to-blue-600"
                      : "bg-gray-200"
                  }`}
                  style={{ width: `${sectionProgress}%` }}
                />
              </div>

              {isCompleted && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Crown className="w-6 h-6 text-yellow-500 drop-shadow-md animate-bounce" />
                </div>
              )}

              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                  <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-3">
        <span className="text-lg font-bold text-gray-700">
          {Math.round(progress)}% Complete
        </span>
        <div className="text-sm text-gray-500 mt-1">
          {Math.round((progress / 100) * sections)} of {sections} lessons finished
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [loading, setLoading] = useState(true)
  const [languages, setLanguages] = useState<Language[]>([])
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
        
        // Check if player needs onboarding
        const preferences = playerData.player_preferences || {}
        if (!preferences.onboarding_completed) {
          router.push('/onboarding')
          return
        }
      }

      // Load available languages
      const { data: languagesData } = await supabase
        .from('speaking_languages')
        .select('*')
        .eq('is_active', true)
        .order('language_name')
      
      if (languagesData) {
        setLanguages(languagesData)
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


  const handleCategoryClick = (category: string, event: React.MouseEvent) => {
    event.preventDefault()
    
    if (!player) return

    // For speaking category, navigate to speaking continue page
    if (category === 'speaking') {
      router.push('/speaking/continue')
      return
    }

    // Navigate to tutorials page
    router.push(`/tutorials?category=${category}`)
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <KidCard className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Loading your dashboard...</p>
          </div>
        </KidCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {/* Unified App Header */}
      {user && (
        <AppHeader
          user={user}
          player={player}
          title="AiBubu"
          showBackButton={false}
          showVoiceSettings={true}
          onVoiceSettingsClick={() => router.push('/voice-settings')}
          onMyLevelsClick={() => router.push('/my-levels')}
          showPlayerStats={true}
          tutorials={tutorials}
          progress={progress}
        />
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Tutorial Categories */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">🎯 Ready to learn?</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Speaking Category */}
            <KidCard 
              onClick={(e: any) => handleCategoryClick('speaking', e)}
              className="p-8 cursor-pointer border-pink-300 hover:border-pink-400 bg-gradient-to-br from-pink-50/50 to-red-50/50"
            >
              <div className="text-center">
                {/* AiBubu Speaking Character */}
                <div className="mb-6 flex justify-center">
                  <img 
                    src="/images/aibubu-speaking-400x400.png" 
                    alt="AiBubu Speaking Character"
                    className="w-32 h-32 md:w-40 md:h-40 object-contain"
                  />
                </div>
                
                <h3 className="font-black text-gray-800 text-2xl mb-3">Speaking</h3>
                <p className="text-gray-600 text-lg mb-6">Pronunciation Practice</p>
                
                {/* Call to Action */}
                <div className="pt-4 border-t border-pink-200">
                  <p className="text-pink-600 font-bold text-sm">Click to start speaking practice!</p>
                </div>
              </div>
            </KidCard>

            {/* Mathematics Category */}
            <KidCard 
              onClick={(e: any) => handleCategoryClick('maths', e)}
              className="p-8 cursor-pointer border-yellow-300 hover:border-yellow-400 bg-gradient-to-br from-yellow-50/50 to-orange-50/50"
            >
              <div className="text-center">
                {/* AiBubu Math Character */}
                <div className="mb-6 flex justify-center">
                  <img 
                    src="/images/aibubu-math-400x400.png" 
                    alt="AiBubu Math Character"
                    className="w-32 h-32 md:w-40 md:h-40 object-contain"
                  />
                </div>
                
                <h3 className="font-black text-gray-800 text-2xl mb-3">Mathematics</h3>
                <p className="text-gray-600 text-lg mb-6">Numbers & Logic</p>
                
                {/* Math Level Display */}
                {player && player.player_levels?.maths ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 font-bold mb-3">Your Level:</p>
                    <KidBadge color="yellow">
                      <span className="mr-1">📊</span>
                      {String(player.player_levels.maths.general || 'Not set').toUpperCase()}
                    </KidBadge>
                  </div>
                ) : (
                  <div className="mb-4">
                    <KidBadge color="gray">
                      <span className="mr-1">📊</span>
                      Level not set
                    </KidBadge>
                  </div>
                )}
                
                {/* Call to Action */}
                <div className="pt-4 border-t border-yellow-200">
                  <p className="text-orange-600 font-bold text-sm">Click to start maths practice!</p>
                </div>
              </div>
            </KidCard>
          </div>
        </div>

        {/* Continue Learning Link */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-lg border-4 border-blue-300 hover:shadow-xl hover:border-blue-400 transition-all duration-300 p-6 md:p-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">🚀 Continue Learning</h2>
                    <p className="text-gray-600 text-base md:text-lg">Pick up where you left off</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 text-sm">
                  <KidBadge color="green">
                    <Trophy className="w-4 h-4 mr-1" />
                    {Object.values(progress).filter(p => p.status === 'completed').length} Completed
                  </KidBadge>
                  <KidBadge color="blue">
                    <Target className="w-4 h-4 mr-1" />
                    {Object.values(progress).filter(p => p.status === 'in_progress').length} In Progress
                  </KidBadge>
                  <KidBadge color="purple">
                    <Star className="w-4 h-4 mr-1" />
                    {tutorials.length} Total Lessons
                  </KidBadge>
                </div>
              </div>
              
              <div className="w-full lg:w-auto flex justify-center lg:justify-end lg:flex-shrink-0">
                <KidButton 
                  variant="primary" 
                  size="lg" 
                  href="/tutorials" 
                  className="w-full sm:w-auto whitespace-nowrap min-w-fit px-6 py-3"
                >
                  <Play className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="flex-shrink-0">View All Tutorials</span>
                  <ChevronRight className="w-5 h-5 ml-2 flex-shrink-0" />
                </KidButton>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}