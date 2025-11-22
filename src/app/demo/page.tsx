'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Star, 
  Trophy, 
  Heart, 
  Zap, 
  Target, 
  Medal, 
  Crown,
  Sparkles,
  Smile,
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Gift,
  Flame,
  Music,
  Mic,
  MicOff,
  BookOpen,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Users,
  Headphones,
  PenTool,
  MessageCircle,
  Calculator
} from 'lucide-react'

// Aibubu-style Kid-Friendly Components
export default function DemoPage() {
  const [hearts, setHearts] = useState(5)
  const [streak, setStreak] = useState(7)
  const [gems, setGems] = useState(150)
  
  // Recording demo states
  const [isRecording, setIsRecording] = useState(false)
  const [isCountdown, setIsCountdown] = useState(false)
  const [countdownValue, setCountdownValue] = useState(3)
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(10)
  const [volumeLevel, setVolumeLevel] = useState(0)
  
  // Progress bar demo state
  const [currentProgress, setCurrentProgress] = useState(65)

  const KidCard = ({ children, className = '', onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div 
      className={`bg-white rounded-3xl shadow-lg border-4 border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:scale-105 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )

  const KidButton = ({ children, variant = 'primary', size = 'md', onClick, className = '' }: {
    children: React.ReactNode
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    onClick?: () => void
    className?: string
  }) => {
    const variants = {
      primary: 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white',
      secondary: 'bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white',
      success: 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white',
      warning: 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white',
      danger: 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white'
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    return (
      <button 
        className={`${variants[variant]} ${sizes[size]} font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-4 border-white/30 ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }

  const AibubuProgressBar = ({ progress, sections = 5, className = '' }: { 
    progress: number, sections?: number, className?: string 
  }) => {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center space-x-1">
          {Array.from({ length: sections }, (_, index) => {
            const sectionProgress = Math.min(100, Math.max(0, (progress - (index * (100 / sections))) / (100 / sections) * 100))
            const isCompleted = sectionProgress >= 100
            const isActive = sectionProgress > 0 && sectionProgress < 100
            const isEmpty = sectionProgress === 0

            return (
              <div key={index} className="flex-1 relative">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      isCompleted ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      isActive ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      'bg-gray-200'
                    }`}
                    style={{ width: `${sectionProgress}%` }}
                  />
                </div>
                
                {/* Crown icon for completed sections */}
                {isCompleted && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Crown className="w-6 h-6 text-yellow-500 drop-shadow-md animate-bounce" />
                  </div>
                )}
                
                {/* Sparkle for active section */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Progress percentage */}
        <div className="text-center mt-3">
          <span className="text-lg font-bold text-gray-700">{Math.round(progress)}% Complete</span>
          <div className="text-sm text-gray-500 mt-1">
            {Math.round((progress / 100) * sections)} of {sections} lessons finished
          </div>
        </div>
      </div>
    )
  }

  const KidBadge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: string }) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      pink: 'bg-pink-100 text-pink-800 border-pink-300',
      gray: 'bg-gray-100 text-gray-600 border-gray-300'
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 ${colors[color as keyof typeof colors]}`}>
        {children}
      </span>
    )
  }

  const ProgressRing = ({ progress, size = 80, strokeWidth = 8 }: { progress: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-in-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-blue-600">{progress}%</span>
        </div>
      </div>
    )
  }

  const TutorialIntroCard = ({ title, description, difficulty, points, onStart }: {
    title: string
    description: string
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    points: number
    onStart: () => void
  }) => {
    const difficultyColors = {
      'Beginner': 'from-green-100 to-green-200 border-green-300',
      'Intermediate': 'from-yellow-100 to-yellow-200 border-yellow-300', 
      'Advanced': 'from-red-100 to-red-200 border-red-300'
    }

    return (
      <KidCard className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300">
        <div className="flex items-start space-x-4">
          {/* AiBubu Logo Character */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-blue-300 shadow-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/aibubu-logo.svg" 
                alt="AiBubu Character" 
                className="w-20 h-20 object-contain"
              />
            </div>
            {/* Speech bubble */}
            <div className="relative mt-2">
              <div className="bg-white rounded-xl px-3 py-2 shadow-lg border-2 border-blue-200 text-center">
                <span className="text-xs font-bold text-blue-600">Let's learn!</span>
              </div>
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
            </div>
          </div>
          
          {/* Tutorial Content */}
          <div className="flex-1">
            <div className="mb-3">
              <h3 className="text-2xl font-black text-purple-800 mb-2">{title}</h3>
              <p className="text-purple-600 mb-3">{description}</p>
              
              {/* Tags */}
              <div className="flex items-center space-x-2 mb-4">
                <KidBadge color="blue">
                  <Zap className="w-3 h-3 mr-1" />
                  {points} XP
                </KidBadge>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 bg-gradient-to-r ${difficultyColors[difficulty]}`}>
                  <Target className="w-3 h-3 mr-1" />
                  {difficulty}
                </span>
                <KidBadge color="green">
                  <Star className="w-3 h-3 mr-1" />
                  Fun & Interactive
                </KidBadge>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="flex justify-end">
              <KidButton variant="primary" size="lg" onClick={onStart}>
                <Play className="w-5 h-5 mr-2" />
                Start Learning!
              </KidButton>
            </div>
          </div>
        </div>
      </KidCard>
    )
  }

  const RecordingControls = ({ 
    isRecording, 
    isCountdown, 
    countdownValue, 
    recordingTimeLeft, 
    volumeLevel = 0,
    onStartRecording, 
    onStopRecording,
    className = '' 
  }: {
    isRecording: boolean
    isCountdown: boolean
    countdownValue: number
    recordingTimeLeft: number
    volumeLevel?: number
    onStartRecording: () => void
    onStopRecording: () => void
    className?: string
  }) => {
    return (
      <div className={`text-center ${className}`}>
        <div className="mb-4">
          {isCountdown ? (
            <p className="text-lg font-bold text-blue-600 animate-pulse">
              Get ready to speak in {countdownValue}...
            </p>
          ) : isRecording ? (
            <div>
              <p className="text-sm text-red-600 mb-2 animate-pulse">
                🔴 Recording... Speak clearly into the microphone
              </p>
              <p className="text-xs text-gray-500">
                Auto-stop in {recordingTimeLeft} seconds
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              🎤 Click to start recording (3s countdown + 10s max recording time)
            </p>
          )}
        </div>
        
        <div className="flex justify-center items-center">
          {/* Main Recording Button */}
          <div className="relative">
            {!isRecording && !isCountdown ? (
              // Start Recording Button
              <button
                onClick={onStartRecording}
                className="relative w-24 h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Mic className="w-8 h-8 text-white" />
              </button>
            ) : isCountdown ? (
              // Countdown State
              <div className="relative">
                {/* Animated rings during countdown */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {[1, 2].map((ring) => (
                    <div
                      key={ring}
                      className="absolute rounded-full border-2 border-blue-400 animate-ping"
                      style={{
                        width: `${96 + ring * 30}px`,
                        height: `${96 + ring * 30}px`,
                        animationDelay: `${ring * 0.3}s`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
                
                <button
                  onClick={onStopRecording}
                  className="relative w-24 h-24 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg z-10"
                >
                  <span className="text-2xl font-bold text-white">{countdownValue}</span>
                </button>
                
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
                    Get Ready!
                  </div>
                </div>
              </div>
            ) : (
              // Recording State
              <div className="relative">
                {/* Volume level rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {[1, 2, 3].map((ring) => (
                    <div
                      key={ring}
                      className="absolute rounded-full border-2 border-red-400 animate-ping"
                      style={{
                        width: `${96 + ring * 20 + (volumeLevel * 2)}px`,
                        height: `${96 + ring * 20 + (volumeLevel * 2)}px`,
                        opacity: Math.max(0.1, volumeLevel / 100),
                        animationDelay: `${ring * 0.2}s`,
                        animationDuration: '2s'
                      }}
                    />
                  ))}
                </div>
                
                <button
                  onClick={onStopRecording}
                  className="relative w-24 h-24 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg animate-pulse z-10"
                >
                  <div className="w-6 h-6 bg-white rounded-sm"></div>
                </button>
                
                {/* Volume indicator */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-3 rounded-full transition-all duration-100 ${
                          volumeLevel > (i + 1) * 20 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {Math.round(volumeLevel)}% volume
                  </p>
                </div>
                
                {/* Recording timer */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                    {recordingTimeLeft}s
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Tutorial difficulty mapping based on the schema
  const getDifficultyInfo = (level: number) => {
    const difficultyMap = {
      1: { cefr: 'A1', text: 'New', color: 'from-green-400 to-green-600', bgColor: 'bg-green-500' },
      2: { cefr: 'A1-A2', text: 'Beginner', color: 'from-green-400 to-blue-500', bgColor: 'bg-blue-500' },
      3: { cefr: 'A2-B1', text: 'Intermediate', color: 'from-blue-400 to-purple-500', bgColor: 'bg-purple-500' },
      4: { cefr: 'B1-B2', text: 'Intermediate+', color: 'from-purple-400 to-pink-500', bgColor: 'bg-pink-500' },
      5: { cefr: 'B2-C1', text: 'Advanced', color: 'from-pink-400 to-red-500', bgColor: 'bg-red-500' },
      6: { cefr: 'C2', text: 'Proficient', color: 'from-red-400 to-orange-500', bgColor: 'bg-orange-500' }
    }
    return difficultyMap[level as keyof typeof difficultyMap] || difficultyMap[1]
  }

  const LearningJourney = ({ tutorials, userProgress = {}, className = '' }: {
    tutorials: Array<{
      id: string
      title: string
      description: string
      difficulty_level: number
      tutorial_type: string
      points_reward: number
    }>
    userProgress?: Record<string, 'locked' | 'available' | 'completed'>
    className?: string
  }) => {
    const [jumpToLevel, setJumpToLevel] = useState<number | null>(null)

    // Group tutorials by difficulty level
    const tutorialsByLevel = tutorials.reduce((acc, tutorial) => {
      const level = tutorial.difficulty_level
      if (!acc[level]) acc[level] = []
      acc[level].push(tutorial)
      return acc
    }, {} as Record<number, typeof tutorials>)

    const TutorialNode = ({ tutorial, index, isLast }: {
      tutorial: typeof tutorials[0]
      index: number
      isLast: boolean
    }) => {
      const progress = userProgress[tutorial.id] || 'locked'
      const difficulty = getDifficultyInfo(tutorial.difficulty_level)
      
      const getIcon = () => {
        switch (tutorial.tutorial_type) {
          case 'speaking': return <Headphones className="w-5 h-5" />
          case 'maths': return <Calculator className="w-5 h-5" />
          case 'writing': return <PenTool className="w-5 h-5" />
          case 'reading': return <BookOpen className="w-5 h-5" />
          default: return <Star className="w-5 h-5" />
        }
      }

      const getNodeColor = () => {
        if (progress === 'completed') return 'bg-gradient-to-r from-green-400 to-green-600'
        if (progress === 'available') return `bg-gradient-to-r ${difficulty.color}`
        return 'bg-gray-300'
      }

      const getTextColor = () => {
        if (progress === 'locked') return 'text-gray-500'
        return 'text-white'
      }

      // Create curved path with alternating positions
      const isEven = index % 2 === 0
      const pathOffset = isEven ? 'translate-x-8' : '-translate-x-8'
      const curveDirection = isEven ? 'right' : 'left'
      
      return (
        <div className="relative flex flex-col items-center w-full">
          {/* Curved Road Path */}
          {!isLast && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full h-64 z-20">
              {/* Main road curve */}
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={`roadGradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#9CA3AF', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path
                  d={isEven 
                    ? "M 50 0 Q 70 50 50 100" // Curve right then back
                    : "M 50 0 Q 30 50 50 100" // Curve left then back
                  }
                  stroke={`url(#roadGradient${index})`}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Road center line */}
                <path
                  d={isEven 
                    ? "M 50 0 Q 70 50 50 100"
                    : "M 50 0 Q 30 50 50 100"
                  }
                  stroke="#FEF3C7"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="4,4"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Simplified environmental decorations */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Occasional grass patches */}
                {index % 4 === 0 && (
                  <div className={`absolute ${isEven ? 'right-2' : 'left-2'} top-8 text-green-500 text-xs`}>
                    🌱
                  </div>
                )}
                
                {/* Small rocks */}
                {index % 6 === 0 && (
                  <div className={`absolute ${isEven ? 'left-8' : 'right-8'} bottom-8 text-gray-600 text-xs`}>
                    🪨
                  </div>
                )}
                
                {/* Milestone flowers */}
                {index % 8 === 0 && (
                  <div className={`absolute ${isEven ? 'right-0' : 'left-0'} top-20 text-sm`}>
                    🌸
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tutorial Node with curved positioning */}
          <div className={`relative z-25 flex flex-col items-center transform ${pathOffset}`}>
            <button
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${getNodeColor()} ${
                progress === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={progress === 'locked'}
              onClick={() => {
                if (progress !== 'locked') {
                  alert(`Starting: ${tutorial.title}`)
                }
              }}
            >
              {progress === 'locked' ? (
                <Lock className="w-6 h-6 text-gray-600" />
              ) : progress === 'completed' ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <div className={getTextColor()}>
                  {getIcon()}
                </div>
              )}
            </button>
            
            {/* Tutorial Info */}
            <div className="mt-3 text-center max-w-xs">
              <h4 className={`font-bold text-sm ${progress === 'locked' ? 'text-gray-500' : 'text-gray-800'}`}>
                {tutorial.title}
              </h4>
              <p className={`text-xs mt-1 ${progress === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                {tutorial.description}
              </p>
              <div className="flex justify-center items-center space-x-2 mt-2">
                <KidBadge color={progress === 'locked' ? 'gray' : 'blue'}>
                  <Zap className="w-3 h-3 mr-1" />
                  {tutorial.points_reward} XP
                </KidBadge>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  progress === 'locked' 
                    ? 'bg-gray-100 text-gray-500' 
                    : `${difficulty.bgColor} text-white`
                }`}>
                  {difficulty.cefr}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const UnitHeader = ({ level, title, color, onJumpHere }: {
      level: number
      title: string
      color: string
      onJumpHere: () => void
    }) => (
      <div>
        <div className={`bg-gradient-to-r ${color} rounded-2xl p-4 shadow-md`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <ChevronDown className="w-4 h-4" />
              <div>
                <p className="text-xs font-semibold opacity-90">SECTION {level}</p>
                <h3 className="text-lg font-bold">{title}</h3>
              </div>
            </div>
            
            <button
              onClick={onJumpHere}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 backdrop-blur-sm border border-white/30"
            >
              📖 GUIDEBOOK
            </button>
          </div>
        </div>
        
        {jumpToLevel === level && (
          <div className="mt-4 flex justify-center">
            <div className="bg-white rounded-full px-4 py-2 shadow-lg border-2 border-blue-300 animate-bounce">
              <span className="text-blue-600 font-bold text-sm">JUMP HERE?</span>
            </div>
          </div>
        )}
      </div>
    )

    // Unit configurations based on screenshots
    const unitConfigs = {
      1: { title: 'Start Your Journey', color: 'from-green-500 to-green-600' },
      2: { title: 'Building Skills', color: 'from-blue-500 to-blue-600' },
      3: { title: 'Getting Confident', color: 'from-purple-500 to-purple-600' },
      4: { title: 'Advanced Practice', color: 'from-pink-500 to-pink-600' },
      5: { title: 'Expert Level', color: 'from-red-500 to-red-600' },
      6: { title: 'Master Class', color: 'from-orange-500 to-orange-600' }
    }

    return (
      <div className={`max-w-md mx-auto ${className} relative`}>
        {/* Background environment */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Animated clouds */}
          <div className="absolute top-4 left-4 text-2xl animate-pulse opacity-20" style={{ animationDuration: '6s' }}>
            ☁️
          </div>
          <div className="absolute top-12 right-8 text-xl animate-pulse opacity-30" style={{ animationDuration: '8s', animationDelay: '2s' }}>
            ☁️
          </div>
          <div className="absolute top-32 left-12 text-lg animate-pulse opacity-25" style={{ animationDuration: '10s', animationDelay: '4s' }}>
            ☁️
          </div>
          
          {/* Scattered environmental elements */}
          <div className="absolute top-64 right-4 text-sm animate-bounce opacity-60" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            🌼
          </div>
          <div className="absolute top-96 left-6 text-sm animate-pulse opacity-50" style={{ animationDuration: '5s' }}>
            🌺
          </div>
          <div className="absolute top-128 right-12 text-xs opacity-40">
            🦋
          </div>
          
          {/* Grass texture background */}
          <div className="absolute inset-0 opacity-10 text-xs text-green-600 leading-3">
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 32 }, (_, i) => (
                <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.5}s`, animationDuration: '3s' }}>
                  🌿
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-20 relative z-10">
          {Object.entries(tutorialsByLevel)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([levelStr, levelTutorials]) => {
              const level = parseInt(levelStr)
              const unitConfig = unitConfigs[level as keyof typeof unitConfigs]
              
              return (
                <div key={level}>
                  {/* Section Header - positioned at top */}
                  <div className="sticky top-0 z-30 mb-8">
                    <UnitHeader
                      level={level}
                      title={unitConfig?.title || `Level ${level}`}
                      color={unitConfig?.color || 'from-gray-500 to-gray-600'}
                      onJumpHere={() => {
                        setJumpToLevel(level)
                        setTimeout(() => setJumpToLevel(null), 3000)
                      }}
                    />
                  </div>
                  
                  {/* Section Connection Node */}
                  <div className="flex justify-center mb-12 relative">
                    <div className={`w-12 h-12 rounded-full ${unitConfig?.color ? 'bg-gradient-to-r ' + unitConfig.color : 'bg-gray-500'} shadow-lg border-4 border-white flex items-center justify-center z-25 relative`}>
                      <span className="text-white font-bold text-xs">{level}</span>
                    </div>
                    
                    {/* Path from section node to first tutorial */}
                    {levelTutorials.length > 0 && (
                      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-full h-20 z-20">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`sectionGradient${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                              <stop offset="50%" style={{ stopColor: '#9CA3AF', stopOpacity: 1 }} />
                              <stop offset="100%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 50 0 L 50 100"
                            stroke={`url(#sectionGradient${level})`}
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 50 0 L 50 100"
                            stroke="#FEF3C7"
                            strokeWidth="1"
                            fill="none"
                            strokeDasharray="4,4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-24">
                    {levelTutorials.map((tutorial, index) => (
                      <div key={tutorial.id} className="relative">
                        <TutorialNode
                          tutorial={tutorial}
                          index={index}
                          isLast={index === levelTutorials.length - 1 && level === Math.max(...Object.keys(tutorialsByLevel).map(Number))}
                        />
                        
                        {/* Special milestone characters */}
                        {level === 2 && index === 2 && (
                          <div className="absolute -right-16 top-0 animate-bounce" style={{ animationDuration: '2s', animationDelay: '1s' }}>
                            <div className="text-4xl">🦉</div>
                            <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-green-600 shadow-lg border-2 border-green-300 mt-1">
                              Keep going!
                            </div>
                          </div>
                        )}
                        
                        {level === 3 && index === 3 && (
                          <div className="absolute -left-20 top-0 animate-pulse" style={{ animationDuration: '3s' }}>
                            <div className="text-4xl">🐸</div>
                            <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-blue-600 shadow-lg border-2 border-blue-300 mt-1">
                              Awesome!
                            </div>
                          </div>
                        )}
                        
                        {level === 4 && index === 1 && (
                          <div className="absolute -right-18 top-0">
                            <div className="text-4xl animate-spin" style={{ animationDuration: '8s' }}>
                              🦋
                            </div>
                          </div>
                        )}
                        
                        {level === 5 && index === 0 && (
                          <div className="absolute -left-16 top-0 animate-bounce" style={{ animationDuration: '4s' }}>
                            <div className="text-3xl">🎓</div>
                            <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-purple-600 shadow-lg border-2 border-purple-300 mt-1">
                              Expert level!
                            </div>
                          </div>
                        )}
                        
                        {level === 6 && index === 0 && (
                          <div className="absolute -right-20 -top-4 animate-pulse" style={{ animationDuration: '2s' }}>
                            <div className="text-5xl">👑</div>
                            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg px-3 py-2 text-xs font-bold text-orange-800 shadow-lg border-2 border-yellow-400 mt-1">
                              Master Level!
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Path to next section (if not the last section) */}
                  {level < Math.max(...Object.keys(tutorialsByLevel).map(Number)) && (
                    <div className="flex justify-center mt-12 relative">
                      <div className="w-full h-20 z-20">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`interSectionGradient${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                              <stop offset="50%" style={{ stopColor: '#9CA3AF', stopOpacity: 1 }} />
                              <stop offset="100%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 50 0 L 50 100"
                            stroke={`url(#interSectionGradient${level})`}
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 50 0 L 50 100"
                            stroke="#FEF3C7"
                            strokeWidth="1"
                            fill="none"
                            strokeDasharray="4,4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
        
        {/* Experimental Roadstone Path Section */}
        <div className="mt-16 border-t-4 border-purple-300 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-800 mb-4">🧪 Experimental Roadstone Paths</h2>
            <p className="text-gray-600 text-lg">Testing different approaches to drawing paths between nodes</p>
          </div>
          
          <RoadstonePathExperiments />
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <button className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
            <ChevronUp className="w-6 h-6" />
          </button>
        </div>
      </div>
    )
  }

  // Horizontal Learning Journey Component
  const HorizontalLearningJourney = ({ 
    tutorials,
    userProgress = {},
    className = '' 
  }: { 
    tutorials: any[],
    userProgress?: Record<string, 'completed' | 'available' | 'locked'>,
    className?: string
  }) => {
    const [jumpToLevel, setJumpToLevel] = useState<number | null>(null)

    // Horizontal Tutorial Node Component
    const HorizontalTutorialNode = ({ 
      tutorial, 
      progress, 
      index, 
      isLast 
    }: { 
      tutorial: any, 
      progress: 'completed' | 'available' | 'locked', 
      index: number, 
      isLast: boolean 
    }) => {
      const difficulty = getDifficultyInfo(tutorial.difficulty_level)
      const isEven = index % 2 === 0
      
      const getNodeColor = () => {
        switch (progress) {
          case 'completed': return 'bg-green-500 hover:bg-green-600'
          case 'available': return 'bg-blue-500 hover:bg-blue-600'
          case 'locked': return 'bg-gray-300'
          default: return 'bg-gray-300'
        }
      }
      
      const getTextColor = () => {
        return progress === 'completed' || progress === 'available' ? 'text-white' : 'text-gray-600'
      }
      
      const getIcon = () => {
        switch (tutorial.tutorial_type) {
          case 'listening': return <Headphones className="w-5 h-5" />
          case 'speaking': return <Mic className="w-5 h-5" />
          case 'maths': return <Calculator className="w-5 h-5" />
          case 'writing': return <PenTool className="w-5 h-5" />
          case 'reading': return <BookOpen className="w-5 h-5" />
          default: return <Star className="w-5 h-5" />
        }
      }
      
      // Horizontal path offset (up/down instead of left/right)
      const pathOffset = isEven ? 'translate-y-8' : '-translate-y-8'
      
      return (
        <div className="relative flex flex-row items-center h-full">
          {/* Horizontal Road Path */}
          {!isLast && (
            <div className="absolute left-20 top-1/2 transform -translate-y-1/2 h-full w-64 z-0">
              {/* Main road curve */}
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={`horizontalRoadGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#9CA3AF', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#D1D5DB', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path
                  d={isEven 
                    ? "M 0 50 Q 50 30 100 50" // Curve up then back
                    : "M 0 50 Q 50 70 100 50" // Curve down then back
                  }
                  stroke={`url(#horizontalRoadGradient${index})`}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Road center line */}
                <path
                  d={isEven 
                    ? "M 0 50 Q 50 30 100 50"
                    : "M 0 50 Q 50 70 100 50"
                  }
                  stroke="#FEF3C7"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="4,4"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Simplified environmental decorations */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Occasional grass patches */}
                {index % 4 === 0 && (
                  <div className={`absolute left-8 ${isEven ? 'bottom-2' : 'top-2'} text-green-500 text-xs`}>
                    🌱
                  </div>
                )}
                
                {/* Small rocks */}
                {index % 6 === 0 && (
                  <div className={`absolute right-8 ${isEven ? 'top-8' : 'bottom-8'} text-gray-600 text-xs`}>
                    🪨
                  </div>
                )}
                
                {/* Milestone flowers */}
                {index % 8 === 0 && (
                  <div className={`absolute left-20 ${isEven ? 'top-0' : 'bottom-0'} text-sm`}>
                    🌸
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tutorial Node with horizontal positioning */}
          <div className={`relative z-25 flex flex-col items-center transform ${pathOffset}`}>
            <button
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${getNodeColor()} ${
                progress === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={progress === 'locked'}
              onClick={() => {
                if (progress !== 'locked') {
                  alert(`Starting: ${tutorial.title}`)
                }
              }}
            >
              {progress === 'locked' ? (
                <Lock className="w-6 h-6 text-gray-600" />
              ) : progress === 'completed' ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <div className={getTextColor()}>
                  {getIcon()}
                </div>
              )}
            </button>
            
            {/* Tutorial Info */}
            <div className="mt-3 text-center max-w-xs">
              <h4 className={`font-bold text-sm ${progress === 'locked' ? 'text-gray-500' : 'text-gray-800'}`}>
                {tutorial.title}
              </h4>
              <p className={`text-xs mt-1 ${progress === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                {tutorial.description}
              </p>
              <div className="flex justify-center items-center space-x-2 mt-2">
                <KidBadge color={progress === 'locked' ? 'gray' : 'blue'}>
                  <Zap className="w-3 h-3 mr-1" />
                  {tutorial.points_reward} XP
                </KidBadge>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  progress === 'locked' 
                    ? 'bg-gray-100 text-gray-500' 
                    : `${difficulty.bgColor} text-white`
                }`}>
                  {difficulty.cefr}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const HorizontalUnitHeader = ({ level, title, color, onJumpHere }: {
      level: number
      title: string
      color: string
      onJumpHere: () => void
    }) => (
      <div className="flex flex-col items-center mr-8">
        <div className={`bg-gradient-to-r ${color} rounded-2xl p-4 shadow-md`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <ChevronDown className="w-4 h-4" />
              <div>
                <p className="text-xs font-semibold opacity-90">SECTION {level}</p>
                <h3 className="text-lg font-bold">{title}</h3>
              </div>
            </div>
            
            <button
              onClick={onJumpHere}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 backdrop-blur-sm border border-white/30 ml-4"
            >
              📖 GUIDE
            </button>
          </div>
        </div>
        
        {jumpToLevel === level && (
          <div className="mt-4 flex justify-center">
            <div className="bg-white rounded-full px-4 py-2 shadow-lg border-2 border-blue-300 animate-bounce">
              <span className="text-blue-600 font-bold text-sm">JUMP HERE?</span>
            </div>
          </div>
        )}
      </div>
    )

    // Unit configurations based on screenshots
    const unitConfigs = {
      1: { title: 'Start Journey', color: 'from-green-500 to-green-600' },
      2: { title: 'Build Skills', color: 'from-blue-500 to-blue-600' },
      3: { title: 'Get Confident', color: 'from-purple-500 to-purple-600' },
      4: { title: 'Advanced', color: 'from-pink-500 to-pink-600' },
      5: { title: 'Expert', color: 'from-red-500 to-red-600' },
      6: { title: 'Master', color: 'from-orange-500 to-orange-600' }
    }

    return (
      <div className={`w-full ${className} relative`}>
        {/* Scrollable horizontal container */}
        <div className="overflow-x-auto overflow-y-hidden h-full">
          <div className="flex items-center space-x-24 h-full min-w-max px-8 py-8">
            {/* Tutorial Groups by Level */}
            {Array.from({ length: 6 }, (_, level) => {
              const levelNumber = level + 1
              const levelTutorials = tutorials.filter(t => t.difficulty_level === levelNumber)
              const config = unitConfigs[levelNumber as keyof typeof unitConfigs]
              
              return (
                <div key={levelNumber} className="flex items-center space-x-8 h-full">
                  {/* Unit Header (Vertical) */}
                  <HorizontalUnitHeader
                    level={levelNumber}
                    title={config.title}
                    color={config.color}
                    onJumpHere={() => {
                      setJumpToLevel(levelNumber)
                      setTimeout(() => setJumpToLevel(null), 3000)
                    }}
                  />
                  
                  <div className="flex space-x-24 items-center h-full">
                    {levelTutorials.map((tutorial, index) => (
                      <div key={tutorial.id} className="relative h-full flex items-center">
                        <HorizontalTutorialNode
                          tutorial={tutorial}
                          progress={userProgress[tutorial.id.toString()] || 'locked'}
                          index={tutorial.id - 1}
                          isLast={index === levelTutorials.length - 1 && levelNumber === 6}
                        />
                        
                        {/* Milestone Characters */}
                        {levelNumber === 1 && index === 0 && (
                          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDuration: '3s' }}>
                            <div className="text-4xl">🦉</div>
                            <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-green-600 shadow-lg border-2 border-green-300 mt-1">
                              Start here!
                            </div>
                          </div>
                        )}
                        
                        {levelNumber === 2 && index === 0 && (
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 animate-pulse" style={{ animationDuration: '3s' }}>
                            <div className="text-3xl">🐸</div>
                            <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-blue-600 shadow-lg border-2 border-blue-300 mt-1">
                              Keep going!
                            </div>
                          </div>
                        )}
                        
                        {levelNumber === 3 && index === 0 && (
                          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDuration: '3s' }}>
                            <div className="text-3xl">🦋</div>
                            <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-purple-600 shadow-lg border-2 border-purple-300 mt-1">
                              You're flying!
                            </div>
                          </div>
                        )}
                        
                        {levelNumber === 5 && index === 0 && (
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDuration: '4s' }}>
                            <div className="text-3xl">🎓</div>
                            <div className="bg-white rounded-lg px-2 py-1 text-xs font-bold text-purple-600 shadow-lg border-2 border-purple-300 mt-1">
                              Expert level!
                            </div>
                          </div>
                        )}
                        
                        {levelNumber === 6 && index === 0 && (
                          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 animate-pulse" style={{ animationDuration: '2s' }}>
                            <div className="text-5xl">👑</div>
                            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg px-3 py-2 text-xs font-bold text-orange-800 shadow-lg border-2 border-yellow-400 mt-1">
                              Master Level!
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Horizontal Scroll Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/80 rounded-full px-4 py-2 shadow-lg border border-gray-200">
            <span className="text-gray-600 font-bold text-xs flex items-center">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Scroll horizontally to explore
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Demo recording functions
  const startRecordingDemo = () => {
    setIsCountdown(true)
    setCountdownValue(3)
    
    const countdown = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdown)
          setIsCountdown(false)
          setIsRecording(true)
          setRecordingTimeLeft(10)
          startRecordingTimer()
          startVolumeSimulation()
          return 3
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const startRecordingTimer = () => {
    const timer = setInterval(() => {
      setRecordingTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          stopRecordingDemo()
          return 10
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const startVolumeSimulation = () => {
    // Simulate volume levels for demo
    const volumeTimer = setInterval(() => {
      if (!isRecording) {
        clearInterval(volumeTimer)
        return
      }
      setVolumeLevel(Math.random() * 80 + 20) // Random volume between 20-100
    }, 200)
    
    // Stop after 10 seconds
    setTimeout(() => {
      clearInterval(volumeTimer)
    }, 10000)
  }
  
  const stopRecordingDemo = () => {
    setIsRecording(false)
    setIsCountdown(false)
    setVolumeLevel(0)
    setRecordingTimeLeft(10)
    setCountdownValue(3)
  }

  // Experimental Roadstone Path Component
  const RoadstonePathExperiments = () => {
    const ExperimentNode = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold ${className}`}>
        {children}
      </div>
    );

    // Method 1: SVG Path with Pattern
    const SVGPatternPath = ({ fromX, fromY, toX, toY, pathId }: { fromX: number, fromY: number, toX: number, toY: number, pathId: string }) => {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      const controlOffset = 30;
      
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
          <defs>
            {/* Stone pattern definition */}
            <pattern id={`stonePattern${pathId}`} patternUnits="userSpaceOnUse" width="20" height="20">
              <image href="/roadstones.svg" x="0" y="0" width="20" height="20" opacity="0.8" />
            </pattern>
          </defs>
          <path
            d={`M ${fromX} ${fromY} Q ${midX + controlOffset} ${midY} ${toX} ${toY}`}
            stroke={`url(#stonePattern${pathId})`}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    };

    // Method 2: CSS Transform Chain
    const CSSTransformPath = ({ isReversed = false }: { isReversed?: boolean }) => {
      const stones = Array.from({ length: 8 }, (_, i) => {
        const progress = i / 7;
        const x = progress * 200 + (Math.sin(progress * Math.PI * 2) * 20);
        const y = progress * 100 + (Math.cos(progress * Math.PI) * 15);
        const rotation = progress * 90 + (i % 3) * 30;
        const scale = 0.8 + (i % 4) * 0.1;
        
        return { x, y, rotation, scale, key: i };
      });

      return (
        <div className="relative w-full h-full">
          {stones.map(stone => (
            <div
              key={stone.key}
              className="absolute"
              style={{
                left: `${stone.x}px`,
                top: `${stone.y}px`,
                transform: `rotate(${stone.rotation}deg) scale(${stone.scale})`,
                transition: `all 0.3s ease ${stone.key * 0.1}s`
              }}
            >
              <img src="/roadstones.svg" alt="stone" className="w-5 h-5 drop-shadow-sm" />
            </div>
          ))}
        </div>
      );
    };

    // Method 3: Canvas-based Path
    const CanvasPath = ({ pathId }: { pathId: string }) => {
      const canvasRef = React.useRef<HTMLCanvasElement>(null);

      React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Create stone image
        const img = new Image();
        img.onload = () => {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw curved path with stones
          const stones = 10;
          for (let i = 0; i < stones; i++) {
            const progress = i / (stones - 1);
            const x = 50 + progress * 150 + Math.sin(progress * Math.PI * 3) * 25;
            const y = 25 + progress * 50 + Math.cos(progress * Math.PI * 2) * 10;
            const rotation = progress * Math.PI / 2;
            const scale = 0.6 + (i % 3) * 0.2;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.scale(scale, scale);
            ctx.globalAlpha = 0.7 + (i % 4) * 0.075;
            ctx.drawImage(img, -10, -10, 20, 20);
            ctx.restore();
          }
        };
        img.src = '/roadstones.svg';
      }, []);

      return (
        <canvas
          ref={canvasRef}
          width={250}
          height={120}
          className="absolute inset-0"
          style={{ zIndex: 10 }}
        />
      );
    };

    // Method 4: CSS Grid with Animation
    const GridAnimatedPath = () => {
      const [animationPhase, setAnimationPhase] = React.useState(0);

      React.useEffect(() => {
        const interval = setInterval(() => {
          setAnimationPhase(prev => (prev + 1) % 4);
        }, 1000);
        return () => clearInterval(interval);
      }, []);

      return (
        <div className="grid grid-cols-8 grid-rows-4 gap-2 w-full h-full p-4">
          {Array.from({ length: 32 }, (_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const shouldShow = (col + row * 2 + animationPhase) % 4 === 0;
            const opacity = shouldShow ? 0.8 : 0.2;
            const scale = shouldShow ? 1 : 0.6;
            
            return (
              <div
                key={i}
                className="flex items-center justify-center transition-all duration-500"
                style={{ opacity, transform: `scale(${scale})` }}
              >
                <img src="/roadstones.svg" alt="stone" className="w-4 h-4" />
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="space-y-16">
        {/* Method 1: SVG Pattern Path */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-blue-200">
          <h3 className="text-2xl font-bold text-center mb-6 text-blue-800">Method 1: SVG Pattern Path</h3>
          <div className="relative h-40 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl overflow-hidden">
            <div className="absolute top-4 left-8">
              <ExperimentNode>A</ExperimentNode>
            </div>
            <div className="absolute bottom-4 right-8">
              <ExperimentNode>B</ExperimentNode>
            </div>
            <SVGPatternPath fromX={80} fromY={36} toX={300} toY={124} pathId="1" />
          </div>
          <p className="text-sm text-gray-600 mt-4">Uses SVG pattern with curved path and stone texture</p>
        </div>

        {/* Method 2: CSS Transform Chain */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-purple-200">
          <h3 className="text-2xl font-bold text-center mb-6 text-purple-800">Method 2: CSS Transform Chain</h3>
          <div className="relative h-40 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl overflow-hidden">
            <div className="absolute top-4 left-8">
              <ExperimentNode>A</ExperimentNode>
            </div>
            <div className="absolute bottom-4 right-8">
              <ExperimentNode>B</ExperimentNode>
            </div>
            <CSSTransformPath />
          </div>
          <p className="text-sm text-gray-600 mt-4">Individual stones positioned with CSS transforms and mathematical curves</p>
        </div>

        {/* Method 3: Canvas Path */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-green-200">
          <h3 className="text-2xl font-bold text-center mb-6 text-green-800">Method 3: Canvas Drawing</h3>
          <div className="relative h-40 bg-gradient-to-r from-green-100 to-yellow-100 rounded-2xl overflow-hidden">
            <div className="absolute top-4 left-8">
              <ExperimentNode>A</ExperimentNode>
            </div>
            <div className="absolute bottom-4 right-8">
              <ExperimentNode>B</ExperimentNode>
            </div>
            <CanvasPath pathId="canvas1" />
          </div>
          <p className="text-sm text-gray-600 mt-4">Canvas-based rendering with full control over stone placement and effects</p>
        </div>

        {/* Method 4: CSS Grid Animation */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-orange-200">
          <h3 className="text-2xl font-bold text-center mb-6 text-orange-800">Method 4: CSS Grid with Animation</h3>
          <div className="relative h-40 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl overflow-hidden">
            <div className="absolute top-4 left-8 z-20">
              <ExperimentNode>A</ExperimentNode>
            </div>
            <div className="absolute bottom-4 right-8 z-20">
              <ExperimentNode>B</ExperimentNode>
            </div>
            <GridAnimatedPath />
          </div>
          <p className="text-sm text-gray-600 mt-4">CSS Grid layout with animated stone appearance for dynamic paths</p>
        </div>

        {/* Comparison Summary */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-3xl p-8 border-4 border-indigo-300">
          <h3 className="text-2xl font-bold text-center mb-6 text-indigo-800">🎯 Method Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-indigo-700">Performance</h4>
              <div className="space-y-2 text-sm">
                <div>🥇 <strong>CSS Transform:</strong> Best performance, GPU accelerated</div>
                <div>🥈 <strong>SVG Pattern:</strong> Good performance, scalable</div>
                <div>🥉 <strong>CSS Grid:</strong> Good for simple layouts</div>
                <div>🥉 <strong>Canvas:</strong> Can be heavy with many redraws</div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-indigo-700">Flexibility</h4>
              <div className="space-y-2 text-sm">
                <div>🥇 <strong>Canvas:</strong> Full control over rendering</div>
                <div>🥈 <strong>CSS Transform:</strong> High customization</div>
                <div>🥈 <strong>SVG Pattern:</strong> Vector-based scaling</div>
                <div>🥉 <strong>CSS Grid:</strong> Limited to grid constraints</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b-4 border-rainbow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <KidButton variant="secondary" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </KidButton>
              </Link>
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  🎨 UI Demo
                </h1>
                <p className="text-purple-600 font-semibold">Aibubu-style Components for Kids!</p>
              </div>
            </div>
            
            {/* Stats Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full border-2 border-red-300">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-bold text-red-700">{hearts}</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-orange-100 px-4 py-2 rounded-full border-2 border-orange-300">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-700">{streak} day streak!</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full border-2 border-blue-300">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-blue-700">{gems} gems</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Welcome Card */}
        <KidCard className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-purple-700 mb-2">Welcome to our New UI!</h2>
            <p className="text-lg text-purple-600 font-semibold mb-6">
              These are Aibubu-style components designed especially for kids - colorful, fun, and interactive!
            </p>
            <div className="flex justify-center space-x-4">
              <KidButton variant="primary" size="lg">
                <Play className="w-5 h-5 mr-2" />
                Let's Start Learning!
              </KidButton>
              <KidButton variant="secondary" size="lg">
                <Gift className="w-5 h-5 mr-2" />
                Check Rewards
              </KidButton>
            </div>
          </div>
        </KidCard>

        {/* New Featured Components */}
        <div className="space-y-8 mb-8">
          {/* Aibubu Progress Bar */}
          <KidCard className="p-8">
            <h3 className="text-2xl font-black text-gray-800 mb-6 text-center">📊 Aibubu-Style Progress Bar</h3>
            <AibubuProgressBar progress={currentProgress} sections={5} />
            <div className="mt-6 text-center">
              <div className="flex justify-center space-x-2">
                <KidButton 
                  variant="success" 
                  size="sm"
                  onClick={() => setCurrentProgress(Math.min(100, currentProgress + 20))}
                >
                  + 20% Progress
                </KidButton>
                <KidButton 
                  variant="warning" 
                  size="sm"
                  onClick={() => setCurrentProgress(Math.max(0, currentProgress - 20))}
                >
                  - 20% Progress  
                </KidButton>
                <KidButton 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    const levels = [15, 35, 50, 75, 90, 100]
                    const randomLevel = levels[Math.floor(Math.random() * levels.length)]
                    setCurrentProgress(randomLevel)
                  }}
                >
                  Random Level
                </KidButton>
              </div>
            </div>
          </KidCard>

          {/* Tutorial Introduction Card */}
          <TutorialIntroCard
            title="Learn Fun Numbers!"
            description="Join AiBubu on an exciting adventure with numbers and counting. Perfect for young learners who want to master basic math skills through interactive games!"
            difficulty="Beginner"
            points={150}
            onStart={() => alert('🎉 Starting tutorial! (This is just a demo)')}
          />

          {/* Recording Controls Demo */}
          <KidCard className="p-8">
            <h3 className="text-2xl font-black text-gray-800 mb-6 text-center">🎤 Speech Recording Controls</h3>
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-blue-800 mb-2">Say: "Hello AiBubu!"</h4>
                <p className="text-blue-600 text-sm">Try the interactive recording controls below</p>
              </div>
              
              <RecordingControls
                isRecording={isRecording}
                isCountdown={isCountdown}
                countdownValue={countdownValue}
                recordingTimeLeft={recordingTimeLeft}
                volumeLevel={volumeLevel}
                onStartRecording={startRecordingDemo}
                onStopRecording={stopRecordingDemo}
              />
              
              <div className="mt-6 text-center">
                <div className="inline-flex space-x-2">
                  <KidButton variant="success" size="sm" onClick={startRecordingDemo}>
                    Demo Recording
                  </KidButton>
                  <KidButton variant="danger" size="sm" onClick={stopRecordingDemo}>
                    Reset Demo
                  </KidButton>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>✨ Features animated rings, countdown timer, volume detection, and auto-stop!</p>
            </div>
          </KidCard>
        </div>

        {/* Component Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Buttons Card */}
          <KidCard className="p-6">
            <h3 className="text-xl font-black text-gray-800 mb-4 text-center">🎯 Kid Buttons</h3>
            <div className="space-y-3">
              <KidButton variant="primary" className="w-full">Primary Action</KidButton>
              <KidButton variant="secondary" className="w-full">Secondary</KidButton>
              <KidButton variant="success" className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Success!
              </KidButton>
              <KidButton variant="warning" className="w-full">
                <Star className="w-4 h-4 mr-2" />
                Warning
              </KidButton>
              <KidButton variant="danger" className="w-full">
                <XCircle className="w-4 h-4 mr-2" />
                Try Again
              </KidButton>
            </div>
          </KidCard>

          {/* Badges Card */}
          <KidCard className="p-6">
            <h3 className="text-xl font-black text-gray-800 mb-4 text-center">🏆 Achievement Badges</h3>
            <div className="space-y-3">
              <div className="flex justify-center">
                <KidBadge color="blue">
                  <Star className="w-4 h-4 mr-1" />
                  Beginner
                </KidBadge>
              </div>
              <div className="flex justify-center">
                <KidBadge color="green">
                  <Trophy className="w-4 h-4 mr-1" />
                  Expert
                </KidBadge>
              </div>
              <div className="flex justify-center">
                <KidBadge color="yellow">
                  <Crown className="w-4 h-4 mr-1" />
                  Champion
                </KidBadge>
              </div>
              <div className="flex justify-center">
                <KidBadge color="purple">
                  <Zap className="w-4 h-4 mr-1" />
                  Super Fast!
                </KidBadge>
              </div>
              <div className="flex justify-center">
                <KidBadge color="pink">
                  <Heart className="w-4 h-4 mr-1" />
                  Perfect Score
                </KidBadge>
              </div>
            </div>
          </KidCard>

          {/* Progress Ring */}
          <KidCard className="p-6">
            <h3 className="text-xl font-black text-gray-800 mb-4 text-center">📊 Progress Tracker</h3>
            <div className="flex justify-center mb-4">
              <ProgressRing progress={75} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 mb-2">Today's Progress</p>
              <div className="flex justify-center space-x-2">
                <span className="text-2xl">🎯</span>
                <span className="text-2xl">📚</span>
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </KidCard>

          {/* Learning Category Card */}
          <KidCard className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50">
            <div className="text-center">
              <div className="text-5xl mb-3">🗣️</div>
              <h3 className="text-lg font-black text-gray-800 mb-2">Speaking Practice</h3>
              <p className="text-sm text-gray-600 mb-4">Learn pronunciation with AI!</p>
              <div className="flex justify-center space-x-2 mb-4">
                <KidBadge color="green">15 lessons</KidBadge>
                <KidBadge color="blue">+50 XP</KidBadge>
              </div>
              <div className="flex justify-center">
                <ProgressRing progress={45} size={60} strokeWidth={6} />
              </div>
            </div>
          </KidCard>

          {/* Math Category Card */}
          <KidCard className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50">
            <div className="text-center">
              <div className="text-5xl mb-3">🔢</div>
              <h3 className="text-lg font-black text-gray-800 mb-2">Mathematics</h3>
              <p className="text-sm text-gray-600 mb-4">Numbers & fun calculations!</p>
              <div className="flex justify-center space-x-2 mb-4">
                <KidBadge color="yellow">12 lessons</KidBadge>
                <KidBadge color="purple">+75 XP</KidBadge>
              </div>
              <div className="flex justify-center">
                <ProgressRing progress={80} size={60} strokeWidth={6} />
              </div>
            </div>
          </KidCard>

          {/* Achievement Showcase */}
          <KidCard className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300">
            <div className="text-center">
              <div className="text-5xl mb-3">🎖️</div>
              <h3 className="text-lg font-black text-orange-800 mb-2">Today's Achievement</h3>
              <p className="text-sm text-orange-600 mb-4">You completed 5 lessons!</p>
              <KidButton variant="warning" size="sm">
                <Trophy className="w-4 h-4 mr-2" />
                View All Achievements
              </KidButton>
            </div>
          </KidCard>
        </div>

        {/* Message Boxes Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-800 text-center mb-6">💬 Message Boxes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Success Message */}
            <div className="bg-green-100 border-4 border-green-300 rounded-3xl p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 rounded-full p-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-green-800">Awesome job! 🎉</h4>
                  <p className="text-green-700">You got all answers correct!</p>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-100 border-4 border-blue-300 rounded-3xl p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-blue-800">Tip of the day! 💡</h4>
                  <p className="text-blue-700">Practice every day to improve faster!</p>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-100 border-4 border-yellow-300 rounded-3xl p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500 rounded-full p-2">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-yellow-800">Almost there! ⚡</h4>
                  <p className="text-yellow-700">One more try and you'll get it right!</p>
                </div>
              </div>
            </div>

            {/* Fun Encouragement */}
            <div className="bg-purple-100 border-4 border-purple-300 rounded-3xl p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500 rounded-full p-2">
                  <Smile className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-purple-800">You're amazing! 🌟</h4>
                  <p className="text-purple-700">Keep up the fantastic learning!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo Section */}
        <KidCard className="p-8 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-purple-700 mb-2">🎮 Interactive Demo</h2>
            <p className="text-purple-600 font-semibold">Try clicking these fun elements!</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KidButton 
              variant="primary" 
              onClick={() => setHearts(hearts + 1)}
              className="flex flex-col items-center space-y-2"
            >
              <Heart className="w-6 h-6" />
              <span>+1 Heart</span>
            </KidButton>
            
            <KidButton 
              variant="warning" 
              onClick={() => setStreak(streak + 1)}
              className="flex flex-col items-center space-y-2"
            >
              <Flame className="w-6 h-6" />
              <span>+1 Day Streak</span>
            </KidButton>
            
            <KidButton 
              variant="secondary" 
              onClick={() => setGems(gems + 10)}
              className="flex flex-col items-center space-y-2"
            >
              <Sparkles className="w-6 h-6" />
              <span>+10 Gems</span>
            </KidButton>
            
            <KidButton 
              variant="success"
              className="flex flex-col items-center space-y-2"
              onClick={() => alert('🎉 Congratulations! You found the celebration button!')}
            >
              <Trophy className="w-6 h-6" />
              <span>Celebrate!</span>
            </KidButton>
          </div>
        </KidCard>

        {/* Design Notes */}
        <KidCard className="p-8 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-300">
          <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">🎨 Design Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-2xl p-4 border-2 border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">🌈 Bright Colors</h4>
              <p className="text-gray-700">Vibrant gradients and cheerful color schemes to engage kids</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-green-200">
              <h4 className="font-bold text-green-800 mb-2">✨ Interactive Elements</h4>
              <p className="text-gray-700">Hover effects, scale animations, and click feedback</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-purple-200">
              <h4 className="font-bold text-purple-800 mb-2">🎯 Large Touch Targets</h4>
              <p className="text-gray-700">Kid-friendly button sizes with generous padding</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-2">📱 Rounded Corners</h4>
              <p className="text-gray-700">Soft, friendly shapes that feel safe and approachable</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-pink-200">
              <h4 className="font-bold text-pink-800 mb-2">🎭 Emojis & Icons</h4>
              <p className="text-gray-700">Visual elements that kids can instantly understand</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-orange-200">
              <h4 className="font-bold text-orange-800 mb-2">🏆 Gamification</h4>
              <p className="text-gray-700">Progress tracking, achievements, and rewards system</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-teal-200">
              <h4 className="font-bold text-teal-800 mb-2">🗺️ Learning Journey</h4>
              <p className="text-gray-700">AiBubu-style vertical path with difficulty progression</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200">
              <h4 className="font-bold text-indigo-800 mb-2">🎯 CEFR Integration</h4>
              <p className="text-gray-700">A1-C2 language levels with visual difficulty mapping</p>
            </div>
          </div>
        </KidCard>

        {/* Large Learning Journey Component - Bottom of Page */}
        <div className="mt-12">
          <KidCard className="p-8">
            <h3 className="text-3xl font-black text-gray-800 mb-6 text-center">🗺️ Complete Learning Journey Path</h3>
            <p className="text-center text-gray-600 mb-8 text-lg">
              Experience the full AiBubu-style vertical learning journey with comprehensive tutorial progression from A1 to C2 levels
            </p>
            
            {/* Large Demo Journey - Natural Environment */}
            <div className="bg-gradient-to-b from-green-50 via-blue-50 to-yellow-50 rounded-3xl p-8 min-h-screen max-h-screen overflow-y-auto relative">
              {/* Sky and ground texture overlay */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                {/* Sky gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-100 to-transparent opacity-50"></div>
                
                {/* Ground texture at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-100 to-transparent opacity-50"></div>
                
                {/* Scattered environmental elements across the whole container */}
                <div className="absolute top-8 left-8 text-lg animate-pulse opacity-30" style={{ animationDuration: '7s' }}>
                  ☁️
                </div>
                <div className="absolute top-20 right-12 text-base animate-pulse opacity-40" style={{ animationDuration: '9s', animationDelay: '3s' }}>
                  ☁️
                </div>
                <div className="absolute top-40 left-16 text-sm animate-pulse opacity-35" style={{ animationDuration: '11s', animationDelay: '5s' }}>
                  ☁️
                </div>
                
                {/* Mountain silhouettes in the background */}
                <div className="absolute top-16 left-4 text-4xl opacity-15 text-green-800">
                  ⛰️
                </div>
                <div className="absolute top-12 right-8 text-3xl opacity-20 text-green-700">
                  🏔️
                </div>
                
                {/* Sun */}
                <div className="absolute top-6 right-6 text-3xl animate-pulse opacity-60" style={{ animationDuration: '4s' }}>
                  ☀️
                </div>
              </div>
              <LearningJourney
                tutorials={[
                  // Level 1 - New/A1 (5 tutorials)
                  {
                    id: '1',
                    title: 'Hello & Greetings',
                    description: 'Your first words and greetings',
                    difficulty_level: 1,
                    tutorial_type: 'speaking',
                    points_reward: 50
                  },
                  {
                    id: '2',
                    title: 'Numbers 1-10',
                    description: 'Learn to count the basics',
                    difficulty_level: 1,
                    tutorial_type: 'maths',
                    points_reward: 40
                  },
                  {
                    id: '3',
                    title: 'Basic Alphabet',
                    description: 'Learn the ABCs',
                    difficulty_level: 1,
                    tutorial_type: 'reading',
                    points_reward: 45
                  },
                  {
                    id: '4',
                    title: 'Colors & Shapes',
                    description: 'Identify colors and basic shapes',
                    difficulty_level: 1,
                    tutorial_type: 'speaking',
                    points_reward: 55
                  },
                  {
                    id: '5',
                    title: 'My First Words',
                    description: 'Write simple words',
                    difficulty_level: 1,
                    tutorial_type: 'writing',
                    points_reward: 60
                  },
                  
                  // Level 2 - Beginner/A1-A2 (6 tutorials)
                  {
                    id: '6',
                    title: 'Family Members',
                    description: 'Learn about family',
                    difficulty_level: 2,
                    tutorial_type: 'speaking',
                    points_reward: 70
                  },
                  {
                    id: '7',
                    title: 'Simple Math',
                    description: 'Addition and subtraction',
                    difficulty_level: 2,
                    tutorial_type: 'maths',
                    points_reward: 65
                  },
                  {
                    id: '8',
                    title: 'Food & Drinks',
                    description: 'Vocabulary for meals',
                    difficulty_level: 2,
                    tutorial_type: 'speaking',
                    points_reward: 75
                  },
                  {
                    id: '9',
                    title: 'Simple Sentences',
                    description: 'Form basic sentences',
                    difficulty_level: 2,
                    tutorial_type: 'writing',
                    points_reward: 80
                  },
                  {
                    id: '10',
                    title: 'Days of Week',
                    description: 'Learn calendar basics',
                    difficulty_level: 2,
                    tutorial_type: 'reading',
                    points_reward: 70
                  },
                  {
                    id: '11',
                    title: 'Simple Questions',
                    description: 'Ask basic questions',
                    difficulty_level: 2,
                    tutorial_type: 'speaking',
                    points_reward: 85
                  },
                  
                  // Level 3 - Intermediate/A2-B1 (7 tutorials)
                  {
                    id: '12',
                    title: 'Daily Routines',
                    description: 'Talk about daily activities',
                    difficulty_level: 3,
                    tutorial_type: 'speaking',
                    points_reward: 90
                  },
                  {
                    id: '13',
                    title: 'Time & Clock',
                    description: 'Tell time and schedules',
                    difficulty_level: 3,
                    tutorial_type: 'maths',
                    points_reward: 85
                  },
                  {
                    id: '14',
                    title: 'Short Stories',
                    description: 'Read simple stories',
                    difficulty_level: 3,
                    tutorial_type: 'reading',
                    points_reward: 100
                  },
                  {
                    id: '15',
                    title: 'Weather Talk',
                    description: 'Describe weather conditions',
                    difficulty_level: 3,
                    tutorial_type: 'speaking',
                    points_reward: 95
                  },
                  {
                    id: '16',
                    title: 'Creative Writing',
                    description: 'Write your own stories',
                    difficulty_level: 3,
                    tutorial_type: 'writing',
                    points_reward: 120
                  },
                  {
                    id: '17',
                    title: 'Shopping & Money',
                    description: 'Learn about buying things',
                    difficulty_level: 3,
                    tutorial_type: 'maths',
                    points_reward: 110
                  },
                  {
                    id: '18',
                    title: 'Emotions & Feelings',
                    description: 'Express how you feel',
                    difficulty_level: 3,
                    tutorial_type: 'speaking',
                    points_reward: 105
                  },
                  
                  // Level 4 - Intermediate+/B1-B2 (6 tutorials)
                  {
                    id: '19',
                    title: 'Travel & Directions',
                    description: 'Navigate and travel talk',
                    difficulty_level: 4,
                    tutorial_type: 'speaking',
                    points_reward: 130
                  },
                  {
                    id: '20',
                    title: 'Complex Problems',
                    description: 'Multi-step math challenges',
                    difficulty_level: 4,
                    tutorial_type: 'maths',
                    points_reward: 140
                  },
                  {
                    id: '21',
                    title: 'News Articles',
                    description: 'Read and understand news',
                    difficulty_level: 4,
                    tutorial_type: 'reading',
                    points_reward: 135
                  },
                  {
                    id: '22',
                    title: 'Debates & Opinions',
                    description: 'Express and defend opinions',
                    difficulty_level: 4,
                    tutorial_type: 'speaking',
                    points_reward: 150
                  },
                  {
                    id: '23',
                    title: 'Formal Letters',
                    description: 'Write professional letters',
                    difficulty_level: 4,
                    tutorial_type: 'writing',
                    points_reward: 145
                  },
                  {
                    id: '24',
                    title: 'Cultural Topics',
                    description: 'Discuss culture and society',
                    difficulty_level: 4,
                    tutorial_type: 'speaking',
                    points_reward: 155
                  },
                  
                  // Level 5 - Advanced/B2-C1 (5 tutorials)
                  {
                    id: '25',
                    title: 'Professional Meetings',
                    description: 'Business communication skills',
                    difficulty_level: 5,
                    tutorial_type: 'speaking',
                    points_reward: 180
                  },
                  {
                    id: '26',
                    title: 'Scientific Concepts',
                    description: 'Advanced science topics',
                    difficulty_level: 5,
                    tutorial_type: 'reading',
                    points_reward: 170
                  },
                  {
                    id: '27',
                    title: 'Academic Writing',
                    description: 'Research and essays',
                    difficulty_level: 5,
                    tutorial_type: 'writing',
                    points_reward: 200
                  },
                  {
                    id: '28',
                    title: 'Advanced Statistics',
                    description: 'Complex data analysis',
                    difficulty_level: 5,
                    tutorial_type: 'maths',
                    points_reward: 190
                  },
                  {
                    id: '29',
                    title: 'Philosophy & Ethics',
                    description: 'Deep thinking discussions',
                    difficulty_level: 5,
                    tutorial_type: 'speaking',
                    points_reward: 210
                  },
                  
                  // Level 6 - Proficient/C2 (4 tutorials)
                  {
                    id: '30',
                    title: 'Master Presentations',
                    description: 'Professional public speaking',
                    difficulty_level: 6,
                    tutorial_type: 'speaking',
                    points_reward: 250
                  },
                  {
                    id: '31',
                    title: 'Literary Analysis',
                    description: 'Analyze complex literature',
                    difficulty_level: 6,
                    tutorial_type: 'reading',
                    points_reward: 240
                  },
                  {
                    id: '32',
                    title: 'Research Papers',
                    description: 'Write academic research',
                    difficulty_level: 6,
                    tutorial_type: 'writing',
                    points_reward: 280
                  },
                  {
                    id: '33',
                    title: 'Master Challenge',
                    description: 'Ultimate skill assessment',
                    difficulty_level: 6,
                    tutorial_type: 'speaking',
                    points_reward: 300
                  }
                ]}
                userProgress={{
                  // Level 1 - All completed
                  '1': 'completed',
                  '2': 'completed', 
                  '3': 'completed',
                  '4': 'completed',
                  '5': 'completed',
                  
                  // Level 2 - Mostly completed
                  '6': 'completed',
                  '7': 'completed',
                  '8': 'completed',
                  '9': 'completed',
                  '10': 'available',
                  '11': 'available',
                  
                  // Level 3 - Some available
                  '12': 'available',
                  '13': 'available',
                  '14': 'locked',
                  '15': 'locked',
                  '16': 'locked',
                  '17': 'locked',
                  '18': 'locked',
                  
                  // Level 4+ - All locked
                  '19': 'locked',
                  '20': 'locked',
                  '21': 'locked',
                  '22': 'locked',
                  '23': 'locked',
                  '24': 'locked',
                  '25': 'locked',
                  '26': 'locked',
                  '27': 'locked',
                  '28': 'locked',
                  '29': 'locked',
                  '30': 'locked',
                  '31': 'locked',
                  '32': 'locked',
                  '33': 'locked'
                }}
              />
            </div>
            
            <div className="mt-8 text-center">
              <div className="grid grid-cols-3 gap-4 text-sm max-w-lg mx-auto mb-6">
                <div className="flex items-center justify-center space-x-2 bg-green-100 rounded-xl p-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-bold">Completed (9)</span>
                </div>
                <div className="flex items-center justify-center space-x-2 bg-blue-100 rounded-xl p-3">
                  <Play className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-bold">Available (4)</span>
                </div>
                <div className="flex items-center justify-center space-x-2 bg-gray-100 rounded-xl p-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800 font-bold">Locked (20)</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>33 Total Tutorials</strong> across 6 difficulty levels (A1-C2)</p>
                <p>Progress through levels: Complete previous lessons to unlock new challenges</p>
                <p>Scroll through the journey to see the complete learning path progression</p>
              </div>
            </div>
          </KidCard>
        </div>

        {/* Horizontal Learning Journey Alternative */}
        <div className="max-w-6xl mx-auto mb-8">
          <KidCard className="bg-white/80 backdrop-blur-sm border border-blue-200">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🌈 Horizontal Learning Journey</h2>
                <p className="text-gray-600">Alternative UI: Scroll horizontally through your learning path from left to right</p>
              </div>
              
              <HorizontalLearningJourney 
                className="h-96"
                tutorials={[
                  // Level 1 - New/A1 (5 tutorials)
                  {
                    id: '1',
                    title: 'Hello & Greetings',
                    description: 'Your first words and greetings',
                    difficulty_level: 1,
                    tutorial_type: 'speaking',
                    points_reward: 50
                  },
                  {
                    id: '2',
                    title: 'Numbers 1-10',
                    description: 'Learn to count the basics',
                    difficulty_level: 1,
                    tutorial_type: 'maths',
                    points_reward: 40
                  },
                  {
                    id: '3',
                    title: 'Basic Alphabet',
                    description: 'Learn the ABCs',
                    difficulty_level: 1,
                    tutorial_type: 'reading',
                    points_reward: 45
                  },
                  {
                    id: '4',
                    title: 'Colors & Shapes',
                    description: 'Identify colors and basic shapes',
                    difficulty_level: 1,
                    tutorial_type: 'speaking',
                    points_reward: 55
                  },
                  {
                    id: '5',
                    title: 'My First Words',
                    description: 'Write simple words',
                    difficulty_level: 1,
                    tutorial_type: 'writing',
                    points_reward: 60
                  },
                  
                  // Level 2 - Beginner/A1-A2 (6 tutorials)
                  {
                    id: '6',
                    title: 'Family Members',
                    description: 'Learn about family',
                    difficulty_level: 2,
                    tutorial_type: 'speaking',
                    points_reward: 70
                  },
                  {
                    id: '7',
                    title: 'Simple Math',
                    description: 'Addition and subtraction',
                    difficulty_level: 2,
                    tutorial_type: 'maths',
                    points_reward: 65
                  },
                  {
                    id: '8',
                    title: 'Food & Drinks',
                    description: 'Vocabulary for meals',
                    difficulty_level: 2,
                    tutorial_type: 'speaking',
                    points_reward: 75
                  },
                  {
                    id: '9',
                    title: 'Simple Sentences',
                    description: 'Form basic sentences',
                    difficulty_level: 2,
                    tutorial_type: 'writing',
                    points_reward: 80
                  },
                  {
                    id: '10',
                    title: 'Days of Week',
                    description: 'Learn calendar basics',
                    difficulty_level: 2,
                    tutorial_type: 'reading',
                    points_reward: 70
                  },
                  {
                    id: '11',
                    title: 'Simple Questions',
                    description: 'Ask basic questions',
                    difficulty_level: 2,
                    tutorial_type: 'speaking',
                    points_reward: 85
                  },
                  
                  // Level 3 - Intermediate/A2-B1 (7 tutorials)
                  {
                    id: '12',
                    title: 'Daily Routines',
                    description: 'Talk about your day',
                    difficulty_level: 3,
                    tutorial_type: 'speaking',
                    points_reward: 90
                  },
                  {
                    id: '13',
                    title: 'Time & Dates',
                    description: 'Express time and dates',
                    difficulty_level: 3,
                    tutorial_type: 'reading',
                    points_reward: 85
                  },
                  {
                    id: '14',
                    title: 'Past Tense',
                    description: 'Learn past tense verbs',
                    difficulty_level: 3,
                    tutorial_type: 'writing',
                    points_reward: 100
                  },
                  {
                    id: '15',
                    title: 'Shopping',
                    description: 'Conversations at stores',
                    difficulty_level: 3,
                    tutorial_type: 'speaking',
                    points_reward: 95
                  },
                  {
                    id: '16',
                    title: 'Hobbies',
                    description: 'Talk about interests',
                    difficulty_level: 3,
                    tutorial_type: 'speaking',
                    points_reward: 90
                  },
                  {
                    id: '17',
                    title: 'Directions',
                    description: 'Give and get directions',
                    difficulty_level: 3,
                    tutorial_type: 'listening',
                    points_reward: 85
                  },
                  {
                    id: '18',
                    title: 'Weather Talk',
                    description: 'Describe weather conditions',
                    difficulty_level: 3,
                    tutorial_type: 'speaking',
                    points_reward: 80
                  },
                  
                  // Level 4 - Advanced/B1-B2 (6 tutorials)
                  {
                    id: '19',
                    title: 'Job Interviews',
                    description: 'Professional conversations',
                    difficulty_level: 4,
                    tutorial_type: 'speaking',
                    points_reward: 120
                  },
                  {
                    id: '20',
                    title: 'Complex Grammar',
                    description: 'Advanced sentence structures',
                    difficulty_level: 4,
                    tutorial_type: 'writing',
                    points_reward: 115
                  },
                  {
                    id: '21',
                    title: 'Travel Planning',
                    description: 'Organize trips and reservations',
                    difficulty_level: 4,
                    tutorial_type: 'speaking',
                    points_reward: 110
                  },
                  {
                    id: '22',
                    title: 'News Reading',
                    description: 'Understand current events',
                    difficulty_level: 4,
                    tutorial_type: 'reading',
                    points_reward: 125
                  },
                  {
                    id: '23',
                    title: 'Debates & Opinions',
                    description: 'Express complex viewpoints',
                    difficulty_level: 4,
                    tutorial_type: 'speaking',
                    points_reward: 130
                  },
                  {
                    id: '24',
                    title: 'Formal Writing',
                    description: 'Business and academic writing',
                    difficulty_level: 4,
                    tutorial_type: 'writing',
                    points_reward: 135
                  },
                  
                  // Level 5 - Expert/B2-C1 (5 tutorials)
                  {
                    id: '25',
                    title: 'Academic Presentations',
                    description: 'Present complex topics',
                    difficulty_level: 5,
                    tutorial_type: 'speaking',
                    points_reward: 150
                  },
                  {
                    id: '26',
                    title: 'Literature Analysis',
                    description: 'Analyze literary works',
                    difficulty_level: 5,
                    tutorial_type: 'reading',
                    points_reward: 145
                  },
                  {
                    id: '27',
                    title: 'Research Papers',
                    description: 'Write academic research',
                    difficulty_level: 5,
                    tutorial_type: 'writing',
                    points_reward: 160
                  },
                  {
                    id: '28',
                    title: 'Cultural Analysis',
                    description: 'Discuss cultural differences',
                    difficulty_level: 5,
                    tutorial_type: 'speaking',
                    points_reward: 155
                  },
                  {
                    id: '29',
                    title: 'Advanced Listening',
                    description: 'Understand complex audio',
                    difficulty_level: 5,
                    tutorial_type: 'listening',
                    points_reward: 140
                  },
                  
                  // Level 6 - Master/C2 (4 tutorials)
                  {
                    id: '30',
                    title: 'Philosophical Discourse',
                    description: 'Engage in deep discussions',
                    difficulty_level: 6,
                    tutorial_type: 'speaking',
                    points_reward: 200
                  },
                  {
                    id: '31',
                    title: 'Professional Translation',
                    description: 'Translate complex texts',
                    difficulty_level: 6,
                    tutorial_type: 'writing',
                    points_reward: 180
                  },
                  {
                    id: '32',
                    title: 'Creative Writing',
                    description: 'Write poetry and stories',
                    difficulty_level: 6,
                    tutorial_type: 'writing',
                    points_reward: 190
                  },
                  {
                    id: '33',
                    title: 'Master Certification',
                    description: 'Final mastery assessment',
                    difficulty_level: 6,
                    tutorial_type: 'speaking',
                    points_reward: 250
                  }
                ]}
                userProgress={{
                  '1': 'completed',
                  '2': 'completed', 
                  '3': 'completed',
                  '4': 'completed',
                  '5': 'completed',
                  '6': 'completed',
                  '7': 'completed',
                  '8': 'completed',
                  '9': 'completed',
                  '10': 'available',
                  '11': 'available',
                  '12': 'available',
                  '13': 'available',
                  '14': 'locked',
                  '15': 'locked',
                  '16': 'locked',
                  '17': 'locked',
                  '18': 'locked',
                  '19': 'locked',
                  '20': 'locked',
                  '21': 'locked',
                  '22': 'locked',
                  '23': 'locked',
                  '24': 'locked',
                  '25': 'locked',
                  '26': 'locked',
                  '27': 'locked',
                  '28': 'locked',
                  '29': 'locked',
                  '30': 'locked',
                  '31': 'locked',
                  '32': 'locked',
                  '33': 'locked'
                }}
              />
            </div>
            
            <div className="px-6 pb-6 text-center">
              <div className="grid grid-cols-3 gap-4 text-sm max-w-lg mx-auto mb-6">
                <div className="flex items-center justify-center space-x-2 bg-green-100 rounded-xl p-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-bold">Completed (9)</span>
                </div>
                <div className="flex items-center justify-center space-x-2 bg-blue-100 rounded-xl p-3">
                  <Play className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-bold">Available (4)</span>
                </div>
                <div className="flex items-center justify-center space-x-2 bg-gray-100 rounded-xl p-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800 font-bold">Locked (20)</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Horizontal Journey:</strong> Same 33 tutorials across 6 levels (A1-C2)</p>
                <p>Scroll horizontally to progress through difficulty levels from left to right</p>
                <p>Compare vertical vs horizontal journey layouts and navigation patterns</p>
              </div>
            </div>
          </KidCard>
        </div>
      </main>
    </div>
  )
}