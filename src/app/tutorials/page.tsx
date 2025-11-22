'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  ArrowLeft,
  Trophy, 
  Star, 
  Play, 
  Lock,
  Target,
  Zap,
  ChevronRight,
  Settings,
  Crown,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'

type Tutorial = {
  id: string
  title: string
  description: string
  difficulty_level: number
  category: string
  tutorial_type: 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent' | 'speaking'
  age_min: number
  age_max: number
  points_reward: number
  order_index: number
  is_published: boolean
  questions?: Record<string, any>
}

type Progress = {
  tutorial_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  points_earned: number
}

type PlayerData = {
  id: string
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

// AiBubu UI Components
const KidCard = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
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

export default function TutorialsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([])
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [loading, setLoading] = useState(true)
  const [languages, setLanguages] = useState<Language[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'all'
  const languageFromQuery = searchParams.get('language')
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(languageFromQuery || 'en')

  const categoryInfo = {
    all: { title: 'All Tutorials', emoji: '🌟', color: 'blue' },
    speaking: { title: 'Speaking & Pronunciation', emoji: '🗣️', color: 'indigo' },
    maths: { title: 'Mathematics', emoji: '🔢', color: 'orange' }
  }

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)

      // Get player data including levels
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (playerData) {
        setPlayer(playerData)
      }

      // Load available languages
      const { data: languagesData } = await supabase
        .from('speaking_languages')
        .select('*')
        .eq('is_active', true)
        .order('language_name')
      
      if (languagesData) {
        setLanguages(languagesData)
        
        // Set language from query string or default for speaking tutorials
        if (category === 'speaking') {
          if (languageFromQuery) {
            // Use language from query string if valid
            const queryLang = languagesData.find(l => l.language_code === languageFromQuery)
            if (queryLang) {
              setSelectedLanguageCode(languageFromQuery)
            } else {
              // Fallback to English if query language not found
              const defaultLang = languagesData.find(l => l.language_code === 'en') || languagesData[0]
              if (defaultLang) {
                setSelectedLanguageCode(defaultLang.language_code)
              }
            }
          } else {
            // No query string, use default
            const defaultLang = languagesData.find(l => l.language_code === 'en') || languagesData[0]
            if (defaultLang) {
              setSelectedLanguageCode(defaultLang.language_code)
            }
          }
        }
      }
      
      // Get tutorials based on category (only speaking and maths)
      let query = supabase
        .from('tutorials')
        .select('*')
        .eq('is_published', true)
        .in('tutorial_type', ['speaking', 'maths'])
      
      if (category !== 'all') {
        query = query.eq('tutorial_type', category)
      }
      
      const { data: tutorialsData } = await query.order('order_index')
      
      if (tutorialsData) {
        setTutorials(tutorialsData as Tutorial[])
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

    initialize()
  }, [router, category])

  // Filter tutorials based on player levels
  useEffect(() => {
    if (!player || !tutorials.length) {
      setFilteredTutorials(tutorials)
      return
    }

    const playerLevels = player.player_levels || {}
    
    const filtered = tutorials.filter(tutorial => {
      // For speaking tutorials, filter based on selected language AND difficulty level
      if (tutorial.tutorial_type === 'speaking') {
        // First, check if the tutorial matches the selected language
        const tutorialQuestions = tutorial.questions || {}
        const questions = tutorialQuestions.questions || []
        
        // Check if any question in this tutorial matches the selected language
        const hasMatchingLanguage = questions.some((question: any) => 
          question.language === selectedLanguageCode
        )
        
        // If tutorial doesn't match the selected language, exclude it
        if (!hasMatchingLanguage) return false
        
        // Now filter by difficulty level
        const speakingLevels = playerLevels.speaking || {}
        const languageLevel = speakingLevels[selectedLanguageCode]
        
        // If no level set for this language, tutorial is available (user will be prompted)
        if (!languageLevel) return true
        
        // Extract the text level from the language level object (fixed TypeError)
        const textLevel = typeof languageLevel === 'string' ? languageLevel : languageLevel.textLevel
        
        // If still no valid text level, show all tutorials
        if (!textLevel) return true
        
        // Map player levels to tutorial difficulty levels (this is a simplified mapping)
        const levelMapping: { [key: string]: number[] } = {
          'new': [1],
          'a1': [1, 2],
          'beginner': [1, 2],
          'a2': [2, 3],
          'intermediate': [2, 3, 4],
          'b1': [3, 4],
          'advanced': [4, 5],
          'b2': [4, 5],
          'expert': [5, 6],
          'c1': [5, 6],
          'c2': [6],
          'proficient': [6]
        }
        
        const allowedDifficulties = levelMapping[textLevel.toLowerCase()] || [1, 2, 3, 4, 5, 6]
        return allowedDifficulties.includes(tutorial.difficulty_level)
      }
      
      // For maths tutorials, similar filtering could be applied
      if (tutorial.tutorial_type === 'maths') {
        const mathsLevels = playerLevels.maths || {}
        const mathLevel = mathsLevels.general
        
        if (!mathLevel) return true
        
        // Extract the text level from the math level object
        const textLevel = typeof mathLevel === 'string' ? mathLevel : mathLevel.textLevel
        
        // If still no valid text level, show all tutorials
        if (!textLevel) return true
        
        // Similar level mapping for maths
        const levelMapping: { [key: string]: number[] } = {
          'new': [1],
          'beginner': [1, 2],
          'intermediate': [2, 3, 4],
          'advanced': [4, 5],
          'expert': [5, 6],
          'proficient': [6]
        }
        
        const allowedDifficulties = levelMapping[textLevel.toLowerCase()] || [1, 2, 3, 4, 5, 6]
        return allowedDifficulties.includes(tutorial.difficulty_level)
      }
      
      return true
    })
    
    setFilteredTutorials(filtered)
  }, [tutorials, player, selectedLanguageCode])

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800 border-green-200'
    if (level <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getDifficultyText = (level: number) => {
    if (level <= 2) return 'Easy'
    if (level <= 3) return 'Medium'
    return 'Advanced'
  }

  const getProgressIcon = (tutorialId: string) => {
    const prog = progress[tutorialId]
    if (!prog || prog.status === 'not_started') return <Play className="w-5 h-5 text-blue-500" />
    if (prog.status === 'in_progress') return <Target className="w-5 h-5 text-orange-500" />
    return <Star className="w-5 h-5 text-yellow-500 fill-current" />
  }

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguageCode(languageCode)
  }

  const handleSetLanguageLevel = () => {
    router.push('/my-levels')
  }


  const getCurrentLanguageLevel = () => {
    if (!player || category !== 'speaking') return null
    const speakingLevels = player.player_levels?.speaking || {}
    const levelData = speakingLevels[selectedLanguageCode]
    
    // Return the text level string, handle both old (string) and new (object) formats
    if (!levelData) return null
    return typeof levelData === 'string' ? levelData : levelData.textLevel
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <KidCard className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Loading tutorials...</p>
          </div>
        </KidCard>
      </div>
    )
  }

  const currentCategory = categoryInfo[category as keyof typeof categoryInfo] || categoryInfo.all

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {/* Unified App Header */}
      {user && (
        <AppHeader
          user={user}
          player={player}
          showBackButton={true}
          showVoiceSettings={true}
          onVoiceSettingsClick={() => router.push('/voice-settings')}
          onMyLevelsClick={() => router.push('/my-levels')}
          showPlayerStats={true}
          tutorials={filteredTutorials}
          progress={progress}
        />
      )}

      <main className="max-w-6xl mx-auto p-6">

        {/* Combined Category and Language Controls */}
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 mb-6">
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-lg">🎯 Category & Settings</h3>
            
            {/* Category Selection Row */}
            <div className="flex flex-row gap-2 items-end">
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => router.push(`/tutorials?category=${e.target.value}`)}
                  className="w-full px-2 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm font-medium"
                >
                  {Object.entries(categoryInfo).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.emoji} {key === 'all' ? 'All Tutorials' : info.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language & Level Controls for Speaking */}
            {category === 'speaking' && languages.length > 0 && (
              <div className="flex flex-row gap-2 items-end">
                {/* Language Selection */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-600 mb-1">Language</label>
                  <select
                    value={selectedLanguageCode}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full px-2 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm font-medium"
                  >
                    {languages.map((lang) => (
                      <option key={lang.language_code} value={lang.language_code}>
                        {lang.flag_emoji} {lang.language_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Current Level */}
                {getCurrentLanguageLevel() && (
                  <div className="flex-shrink-0">
                    <label className="block text-xs text-gray-600 mb-1">Level</label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                        <Crown className="w-3 h-3 mr-1" />
                        {getCurrentLanguageLevel().toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Change Level Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={handleSetLanguageLevel}
                    className="px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Learning Journey */}
        {filteredTutorials.length === 0 ? (
          <KidCard className="p-12 text-center border-dashed border-gray-300">
            {tutorials.length === 0 ? (
              <>
                <h2 className="text-3xl font-black text-gray-800 mb-4">No tutorials yet</h2>
                <p className="text-gray-600 mb-8 text-lg">More {currentCategory.title.toLowerCase()} tutorials are coming soon!</p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-black text-gray-800 mb-4">No tutorials match your level</h2>
                <p className="text-gray-600 mb-8 text-lg">
                  {category === 'speaking' 
                    ? `No ${languages.find(l => l.language_code === selectedLanguageCode)?.language_name} tutorials available for your current level. Try adjusting your language level setting.`
                    : `No tutorials available for your current level in ${currentCategory.title.toLowerCase()}.`
                  }
                </p>
                {category === 'speaking' && (
                  <KidButton
                    variant="secondary"
                    size="lg"
                    onClick={handleSetLanguageLevel}
                    className="mb-6"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Adjust Language Level
                  </KidButton>
                )}
              </>
            )}
            <KidButton variant="primary" size="lg" href="/dashboard">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </KidButton>
          </KidCard>
        ) : (
          <div className="h-screen flex flex-col">
            {/* Journey Header and Scrollable Content */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-lg border-4 border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex-shrink-0 p-6 text-center border-b border-blue-200/50">
                <p className="text-gray-600">Your Learning Journey for {currentCategory.title.toLowerCase()}!</p>
              </div>
              
              {/* Scrollable Journey Container */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
                  <div className="relative py-4 sm:py-8">
                {/* Group tutorials by difficulty level */}
                {(() => {
                  const groupedTutorials = filteredTutorials.reduce((acc, tutorial) => {
                    const level = tutorial.difficulty_level
                    if (!acc[level]) acc[level] = []
                    acc[level].push(tutorial)
                    return acc
                  }, {} as Record<number, typeof filteredTutorials>)

                  const getDifficultyInfo = (level: number) => {
                    const difficultyMap = {
                      1: { cefr: "A1", bgColor: "from-green-400 to-green-600", name: "New", bgClass: "bg-green-500" },
                      2: { cefr: "A1-A2", bgColor: "from-blue-400 to-blue-600", name: "Beginner", bgClass: "bg-blue-500" },
                      3: { cefr: "A2-B1", bgColor: "from-purple-400 to-purple-600", name: "Intermediate", bgClass: "bg-purple-500" },
                      4: { cefr: "B1-B2", bgColor: "from-pink-400 to-pink-600", name: "Advanced", bgClass: "bg-pink-500" },
                      5: { cefr: "B2-C1", bgColor: "from-red-400 to-red-600", name: "Expert", bgClass: "bg-red-500" },
                      6: { cefr: "C2", bgColor: "from-orange-400 to-orange-600", name: "Master", bgClass: "bg-orange-500" },
                    } as const
                    return difficultyMap[level as keyof typeof difficultyMap] || difficultyMap[1]
                  }

                  const getTutorialIcon = (type: string) => {
                    switch (type) {
                      case 'speaking': return '🗣️'
                      case 'maths': return '🔢'
                      case 'reading': return '📖'
                      case 'writing': return '✏️'
                      case 'science': return '🔬'
                      default: return '📚'
                    }
                  }

                  const getProgressStatus = (tutorialId: string) => {
                    const prog = progress[tutorialId]
                    if (!prog || prog.status === 'not_started') return 'available'
                    return prog.status
                  }

                  const getNodeColor = (status: string) => {
                    switch (status) {
                      case "completed":
                        return "bg-green-500 hover:bg-green-600 border-green-300"
                      case "in_progress":
                        return "bg-blue-500 hover:bg-blue-600 border-blue-300"
                      case "available":
                        return "bg-blue-500 hover:bg-blue-600 border-blue-300"
                      default:
                        return "bg-gray-300 border-gray-400"
                    }
                  }

                  let absoluteIndex = 0

                  return Object.keys(groupedTutorials)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((levelKey) => {
                      const level = parseInt(levelKey)
                      const levelTutorials = groupedTutorials[level]
                      const diffInfo = getDifficultyInfo(level)
                      
                      return (
                        <div key={level} className="relative mb-8">
                          {/* Section Header */}
                          <div className={`sticky top-0 z-30 mb-8 flex items-center justify-between bg-gradient-to-r ${diffInfo.bgColor} rounded-2xl p-4 shadow-lg border-4 border-white/30`}>
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl font-black text-white">
                                SECTION {level}
                              </div>
                              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                <span className="text-white font-bold text-lg">{diffInfo.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Tutorial Nodes for this section */}
                          <div className="space-y-32">
                            {levelTutorials.map((tutorial, sectionIndex) => {
                              const tutorialProgress = getProgressStatus(tutorial.id)
                              const isEven = absoluteIndex % 2 === 0
                              const isLast = absoluteIndex === filteredTutorials.length - 1
                              
                              absoluteIndex++

                              return (
                                <div key={tutorial.id} className="relative">
                                  {/* Enhanced Milestone Characters - Demo Style */}
                                  {absoluteIndex === 1 && (
                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center z-25 animate-bounce" style={{ animationDuration: '3s' }}>
                                      <div className="text-4xl">🦉</div>
                                      <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-green-600 shadow-lg border-2 border-green-300 mt-1">
                                        Start here!
                                      </div>
                                    </div>
                                  )}
                                  
                                  {level === 2 && sectionIndex === 0 && (
                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center z-25 animate-pulse" style={{ animationDuration: '3s' }}>
                                      <div className="text-3xl">🐸</div>
                                      <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-blue-600 shadow-lg border-2 border-blue-300 mt-1">
                                        Keep going!
                                      </div>
                                    </div>
                                  )}

                                  {level === 3 && sectionIndex === 0 && (
                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center z-25 animate-bounce" style={{ animationDuration: '3s' }}>
                                      <div className="text-3xl">🦋</div>
                                      <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-purple-600 shadow-lg border-2 border-purple-300 mt-1">
                                        You're flying!
                                      </div>
                                    </div>
                                  )}

                                  {level === 4 && sectionIndex === 1 && (
                                    <div className="absolute right-4 sm:right-8 top-0 z-25">
                                      <div className="text-2xl sm:text-4xl animate-spin" style={{ animationDuration: '8s' }}>
                                        🦋
                                      </div>
                                    </div>
                                  )}

                                  {level === 5 && sectionIndex === 0 && (
                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center z-25 animate-bounce" style={{ animationDuration: '4s' }}>
                                      <div className="text-3xl">🎓</div>
                                      <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-purple-600 shadow-lg border-2 border-purple-300 mt-1">
                                        Expert level!
                                      </div>
                                    </div>
                                  )}

                                  {level === 6 && sectionIndex === 0 && (
                                    <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 text-center z-25 animate-pulse" style={{ animationDuration: '2s' }}>
                                      <div className="text-5xl">👑</div>
                                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg px-3 py-2 text-xs font-bold text-orange-800 shadow-lg border-2 border-yellow-400 mt-1">
                                        Master Level!
                                      </div>
                                    </div>
                                  )}

                                  {/* One decoration per section - only at section start */}
                                  {sectionIndex === 0 && level === 2 && (
                                    <div className="absolute right-2 sm:right-4 top-4 z-25 animate-pulse" style={{ animationDuration: '3s' }}>
                                      <div className="text-xl sm:text-2xl">🌟</div>
                                    </div>
                                  )}

                                  {sectionIndex === 0 && level === 3 && (
                                    <div className="absolute left-2 sm:left-4 top-4 z-25 animate-bounce" style={{ animationDuration: '3s' }}>
                                      <div className="text-xl sm:text-2xl">🚀</div>
                                    </div>
                                  )}

                                  {sectionIndex === 0 && level === 4 && (
                                    <div className="absolute right-2 sm:right-4 top-4 z-25 animate-pulse" style={{ animationDuration: '3s' }}>
                                      <div className="text-xl sm:text-2xl">🎉</div>
                                    </div>
                                  )}

                                  {/* Responsive Tutorial Node with curved positioning */}
                                  <div className={`relative z-30 flex flex-col items-center transform ${isEven ? 'translate-x-4 sm:translate-x-8' : '-translate-x-4 sm:-translate-x-8'}`}>
                                    <Link
                                      href={`/tutorial/${tutorial.id}`}
                                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-300 transform hover:scale-110 shadow-xl border-4 text-white ${getNodeColor(tutorialProgress)}`}
                                    >
                                      {tutorialProgress === 'completed' ? (
                                        <CheckCircle className="w-8 h-8" />
                                      ) : (
                                        <span className="text-2xl font-bold">{absoluteIndex}</span>
                                      )}

                                      {/* Crown for completed */}
                                      {tutorialProgress === 'completed' && (
                                        <div className="absolute -top-3 -right-3">
                                          <Crown className="w-6 h-6 text-yellow-500 animate-bounce" />
                                        </div>
                                      )}

                                      {/* Sparkles for in progress */}
                                      {tutorialProgress === 'in_progress' && (
                                        <div className="absolute -top-2 -right-2">
                                          <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                                        </div>
                                      )}
                                    </Link>
                                    
                                    {/* Responsive Tutorial Info */}
                                    <div className="mt-2 sm:mt-3 text-center max-w-xs px-2">
                                      <h4 className="font-bold text-xs sm:text-sm text-gray-800 leading-tight">{tutorial.title}</h4>
                                      <p className="text-xs mt-1 text-gray-600 line-clamp-2 sm:line-clamp-none">{tutorial.description}</p>
                                      <div className="flex justify-center items-center space-x-1 sm:space-x-2 mt-2 flex-wrap">
                                        <KidBadge color="yellow">
                                          <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                                          <span className="text-xs">{tutorial.points_reward} XP</span>
                                        </KidBadge>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${diffInfo.bgClass} text-white whitespace-nowrap`}>{diffInfo.cefr}</span>
                                      </div>
                                    </div>
                                  </div>


                                  {/* Roadstone Path */}
                                  {!isLast && (
                                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full h-64 z-20">
                                      {/* Roadstone Pattern Path */}
                                      <svg
                                        className="w-full h-full"
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                      >
                                        <defs>
                                          {/* Define stone-rocks pattern */}
                                          <pattern id={`stoneRocks${absoluteIndex}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <image href="/stone-rocks.svg" width="20" height="20" opacity="0.8" />
                                          </pattern>
                                        </defs>
                                        
                                        {/* Main path with stone-rocks pattern - Narrow like demo */}
                                        <path
                                          d={isEven 
                                            ? "M 50 0 Q 70 50 50 100" // Curve right then back
                                            : "M 50 0 Q 30 50 50 100" // Curve left then back
                                          }
                                          stroke={`url(#stoneRocks${absoluteIndex})`}
                                          strokeWidth="6"
                                          fill="none"
                                          strokeLinecap="round"
                                        />
                                        
                                        {/* Underlying base path for better definition - Narrow */}
                                        <path
                                          d={isEven 
                                            ? "M 50 0 Q 70 50 50 100"
                                            : "M 50 0 Q 30 50 50 100"
                                          }
                                          stroke="#8B7355"
                                          strokeWidth="4"
                                          fill="none"
                                          strokeLinecap="round"
                                          opacity="0.4"
                                        />
                                      </svg>
                                      
                                      {/* Individual roadstones along the path */}
                                      <div className="absolute inset-0 pointer-events-none">
                                        {/* Generate roadstones along the curve - Smaller for narrow path */}
                                        {Array.from({ length: 6 }, (_, i) => {
                                          const progress = (i + 1) / 7; // Progress along path (0 to 1) - fewer stones
                                          
                                          // Calculate position along the curve
                                          const t = progress;
                                          let x, y;
                                          
                                          if (isEven) {
                                            // Right curve: M 50 0 Q 70 50 50 100
                                            x = 50 + 20 * Math.sin(Math.PI * t) * (1 - Math.abs(2 * t - 1));
                                            y = t * 100;
                                          } else {
                                            // Left curve: M 50 0 Q 30 50 50 100
                                            x = 50 - 20 * Math.sin(Math.PI * t) * (1 - Math.abs(2 * t - 1));
                                            y = t * 100;
                                          }
                                          
                                          return (
                                            <div
                                              key={i}
                                              className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                              style={{
                                                left: `${x}%`,
                                                top: `${y}%`,
                                              }}
                                            >
                                              <img 
                                                src="/stone-rocks.svg" 
                                                alt="stone-rocks" 
                                                className="w-4 h-4 opacity-60 drop-shadow-sm"
                                                style={{
                                                  filter: 'sepia(20%) saturate(80%) hue-rotate(15deg)',
                                                }}
                                              />
                                            </div>
                                          );
                                        })}
                                        
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  )
}