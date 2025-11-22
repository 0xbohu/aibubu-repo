'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { X, Mic, Play, Pause, Check, Star, BookOpen, TestTube, Brain, Award, Target } from 'lucide-react'
import { 
  mapCefrToPlayerLevel, 
  getAvailableLevels, 
  textLevelToDbLevel,
  PLAYER_LEVEL_MAPPINGS,
  type LevelMapping 
} from '@/lib/level-utils'

// AiBubu UI Components (matching dashboard style)
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
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
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

  const buttonClasses = `${variants[variant]} ${sizes[size]} font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-4 border-white/30 inline-flex items-center justify-center whitespace-nowrap ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <button className={buttonClasses} onClick={onClick} disabled={disabled}>
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

// Rotating evaluation messages
const EVALUATION_MESSAGES = [
  "Working hard...",
  "Analyzing your pronunciation...",
  "Comparing with native speakers...",
  "Evaluating language patterns...",
  "Processing audio quality...",
  "Determining proficiency level...",
  "Almost done...",
  "Finalizing assessment..."
]

function mapLLMResultToPlayerLevel(llmLevel: string, language: any): string {
  const normalizedLevel = llmLevel.toLowerCase().trim()
  
  // If it's a CEFR language, use CEFR mapping
  if (language.cefr_supported) {
    return mapCefrToPlayerLevel(normalizedLevel)
  }
  
  // For non-CEFR languages, check if it's a valid player level
  const playerLevels = PLAYER_LEVEL_MAPPINGS.map(m => m.textLevel)
  if (playerLevels.includes(normalizedLevel)) {
    return normalizedLevel
  }
  
  // Fallback mapping for common terms
  const fallbackMap: Record<string, string> = {
    'novice': 'new',
    'elementary': 'beginner',
    'intermediate': 'intermediate', 
    'upper-intermediate': 'advanced',
    'advanced': 'advanced',
    'proficient': 'proficient',
    'fluent': 'expert',
    'native': 'proficient'
  }
  
  return fallbackMap[normalizedLevel] || 'beginner'
}

interface Language {
  id: string
  language_code: string
  language_name: string
  native_name: string
  flag_emoji: string
  cefr_supported: boolean
  difficulty_levels: string[]
}

interface Question {
  id: string
  question_text: string
  pronunciation_text: string
  difficulty_level: string
  difficulty_score: number
}

interface LanguageLevelModalProps {
  user: User
  category: string
  language: Language
  isOpen: boolean
  onComplete: (level: string) => void
  onClose: () => void
}

export default function LanguageLevelModal({ 
  user, 
  category, 
  language, 
  isOpen, 
  onComplete, 
  onClose 
}: LanguageLevelModalProps) {
  const [step, setStep] = useState(1) // 1: choose method, 2: manual select, 3: take test, 4: test results
  const [selectedLevel, setSelectedLevel] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordings, setRecordings] = useState<{ [key: number]: Blob }>({})
  const [evaluatedLevel, setEvaluatedLevel] = useState('')
  const [mappedPlayerLevel, setMappedPlayerLevel] = useState('')
  const [assessmentResults, setAssessmentResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [error, setError] = useState('')
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [evaluationMessage, setEvaluationMessage] = useState('')
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen && language) {
      setStep(1)
      setSelectedLevel('')
      setQuestions([])
      setCurrentQuestionIndex(0)
      setRecordings({})
      setEvaluatedLevel('')
      setMappedPlayerLevel('')
      setAssessmentResults(null)
      setTestCompleted(false)
      setError('')
      setShowDetailedResults(false)
      setShowAssessmentDetails(false)
      setRecordingTime(0)
      setEvaluationMessage('')
      setIsRecording(false)
      // Clean up any existing timers without depending on their state
      setRecordingTimer(prev => {
        if (prev) clearInterval(prev)
        return null
      })
    }
  }, [isOpen, language])

  const startTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/language-assessment-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language_code: language.language_code,
          count: 5 // Get 5 questions for assessment
        })
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions)
        setStep(3)
      } else {
        throw new Error('Failed to load questions')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      // Clear any existing timers first
      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
      
      setError('')
      // Start recording immediately
      startActualRecording()
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to start recording')
    }
  }

  const startActualRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setRecordings(prev => ({ ...prev, [currentQuestionIndex]: blob }))
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
          setIsRecording(false)
          clearInterval(timer)
          setRecordingTimer(null)
        }
      }, 10000)
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    // Stop recording if it's active
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      mediaRecorder.stream?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }
    }
  }

  const nextQuestion = () => {
    // Clear all recording-related state for next question
    setIsRecording(false)
    setRecordingTime(0)
    
    // Clear all timers
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // This is the last question - evaluate all responses
      console.log('Last question completed, evaluating all responses...')
      evaluateResponses()
    }
  }

  const evaluateResponses = async () => {
    setLoading(true)
    setError('')
    
    // Start rotating evaluation messages
    let messageIndex = 0
    setEvaluationMessage(EVALUATION_MESSAGES[0])
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % EVALUATION_MESSAGES.length
      setEvaluationMessage(EVALUATION_MESSAGES[messageIndex])
    }, 2000) // Change message every 2 seconds
    
    try {
      // Check if we have recordings for all questions
      const totalRecordings = Object.keys(recordings).length
      if (totalRecordings !== questions.length) {
        throw new Error(`Please record answers for all ${questions.length} questions. You have ${totalRecordings} recordings.`)
      }

      const formData = new FormData()
      formData.append('language_code', language.language_code)
      formData.append('questions', JSON.stringify(questions))
      
      Object.entries(recordings).forEach(([index, blob]) => {
        formData.append(`recording_${index}`, blob, `recording_${index}.wav`)
      })

      console.log('Sending evaluation request...', {
        language: language.language_code,
        questionsCount: questions.length,
        recordingsCount: Object.keys(recordings).length,
        recordings: Object.keys(recordings),
        currentQuestionIndex
      })

      const response = await fetch('/api/evaluate-language-level', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Evaluation result:', data)
        setEvaluatedLevel(data.level)
        
        // Map LLM result to player level
        const playerLevel = mapLLMResultToPlayerLevel(data.level, language)
        setMappedPlayerLevel(playerLevel)
        setSelectedLevel(playerLevel) // Pre-select the mapped level
        
        setAssessmentResults(data.assessment)
        setStep(4) // Go to assessment results step first
        setTestCompleted(true)
        
        // Clear evaluation messages
        clearInterval(messageInterval)
        setEvaluationMessage('')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error evaluating responses:', error)
      setError(error instanceof Error ? error.message : 'Failed to evaluate your recordings. Please try again.')
      
      // Clear evaluation messages on error
      clearInterval(messageInterval)
      setEvaluationMessage('')
    } finally {
      setLoading(false)
    }
  }

  const confirmLevel = async (level: string) => {
    setLoading(true)
    try {
      // Get current player levels
      const { data: playerData } = await supabase
        .from('players')
        .select('player_levels')
        .eq('id', user.id)
        .single()

      const currentLevels = playerData?.player_levels || {}
      
      // Convert text level to database level for tutorials filtering
      const dbLevel = textLevelToDbLevel(level, false) // Always use player level mapping for storage
      
      // Update the specific category and language with both text and db levels
      const updatedLevels = {
        ...currentLevels,
        [category]: {
          ...(currentLevels[category] || {}),
          [language.language_code]: {
            textLevel: level,
            dbLevel: dbLevel,
            updatedAt: new Date().toISOString()
          }
        }
      }

      const { error } = await supabase
        .from('players')
        .update({ player_levels: updatedLevels })
        .eq('id', user.id)

      if (error) throw error

      onComplete(level)
    } catch (error) {
      console.error('Error saving level:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !language) return null

  const currentQuestion = questions[currentQuestionIndex]
  const hasRecording = recordings[currentQuestionIndex]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 rounded-3xl shadow-2xl w-full max-w-6xl h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] flex flex-col border-4 border-white">
        <div className="p-4 sm:p-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-gray-800 mb-1 sm:mb-2">Assessment</h2>
                <p className="text-sm sm:text-lg text-gray-600">
                  {language.flag_emoji} {language.language_name} - {category}
                </p>
              </div>
            </div>
            <KidButton variant="danger" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </KidButton>
          </div>

          {/* Main content area with consistent height */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-4 sm:pb-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
            {/* Error display */}
            {error && (
              <KidCard className="p-4 bg-red-50 border-red-300 mb-6">
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  {error}
                </div>
              </KidCard>
            )}

            {/* Step 1: Choose method */}
            {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-gray-600 text-lg">Choose a level</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <KidCard 
                  onClick={() => setStep(2)}
                  className="p-8 cursor-pointer border-blue-300 hover:border-blue-400 bg-gradient-to-br from-blue-50/50 to-purple-50/50"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-gray-600 mb-4">I know my level and want to choose it myself</p>
                    <KidBadge color="blue">
                      <Star className="w-3 h-3 mr-1" />
                      Quick & Easy
                    </KidBadge>
                  </div>
                </KidCard>

                <KidCard 
                  onClick={startTest}
                  className={`p-8 cursor-pointer border-purple-300 hover:border-purple-400 bg-gradient-to-br from-purple-50/50 to-pink-50/50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <TestTube className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-gray-600 mb-4">Let me find my level with a quick speaking test</p>
                    <KidBadge color="purple">
                      <Award className="w-3 h-3 mr-1" />
                      5 Questions
                    </KidBadge>
                    {loading && (
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                      </div>
                    )}
                  </div>
                </KidCard>
              </div>
            </div>
          )}

          {/* Step 2: Manual selection */}
          {step === 2 && (
            <div className="space-y-8">

              {/* Action Buttons - Moved to Top */}
              <div className="flex flex-col sm:flex-row gap-4">
                <KidButton 
                  variant="primary" 
                  onClick={() => confirmLevel(selectedLevel)}
                  disabled={!selectedLevel || loading}
                  className="flex-1"
                >
                  <Target className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Confirm Level'}
                  <Check className="w-4 h-4 ml-2" />
                </KidButton>
              </div>

              <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getAvailableLevels(language.cefr_supported).map((levelInfo) => (
                    <KidCard
                      key={levelInfo.textLevel}
                      onClick={() => setSelectedLevel(levelInfo.textLevel)}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedLevel === levelInfo.textLevel
                          ? 'border-blue-400 bg-blue-50 scale-105'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base mx-auto mb-3 shadow-lg ${levelInfo.color}`}>
                          {levelInfo.dbLevel}
                        </div>
                        <h4 className="font-black text-gray-800 text-sm mb-2">{levelInfo.displayName}</h4>
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{levelInfo.description}</p>
                        {selectedLevel === levelInfo.textLevel && (
                          <div className="mt-2">
                            <KidBadge color="blue">
                              <Check className="w-2 h-2 mr-1" />
                              <span className="text-xs">Selected!</span>
                            </KidBadge>
                          </div>
                        )}
                      </div>
                    </KidCard>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Take test */}
          {step === 3 && currentQuestion && (
            <div className="space-y-6 min-h-[500px]">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h3>
                <div className="flex space-x-1">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        index === currentQuestionIndex ? 'bg-blue-500' :
                        recordings[index] ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Task:</h4>
                  <p className="text-gray-800 text-base leading-relaxed">{currentQuestion.question_text}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Pronounce this phrase:</h4>
                  <p className="font-semibold text-xl text-center text-blue-700">
                    "{currentQuestion.pronunciation_text}"
                  </p>
                </div>
              </div>

              <div className="text-center space-y-6 flex-1 flex flex-col justify-center min-h-[300px]">
                {!hasRecording ? (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      {isRecording ? (
                        <div className="relative">
                          {/* Animated volume indicator rings */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[1, 2, 3].map((ring) => (
                              <div
                                key={ring}
                                className="absolute rounded-full border-2 border-red-400 animate-ping"
                                style={{
                                  width: `${96 + ring * 20}px`,
                                  height: `${96 + ring * 20}px`,
                                  opacity: 0.4 + (ring * 0.2),
                                  animationDelay: `${ring * 0.2}s`,
                                  animationDuration: '2s'
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Recording button with animate-pulse */}
                          <button
                            onClick={stopRecording}
                            className="relative w-24 h-24 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg animate-pulse z-10"
                          >
                            <Mic className="w-8 h-8 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={startRecording}
                          className="relative w-24 h-24 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-white"
                        >
                          <Mic className="w-8 h-8" />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-center space-y-2">
                      {isRecording ? (
                        <div className="space-y-2">
                          <p className="text-red-600 font-semibold text-lg">🔴 Recording... ({recordingTime}s)</p>
                          <p className="text-gray-600">Speak clearly • Tap to stop early</p>
                          <p className="text-xs text-gray-500">Auto-stop in {10 - recordingTime} seconds</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-blue-600 font-semibold text-lg">Ready to Record</p>
                          <p className="text-gray-600">Tap the button to start</p>
                          <p className="text-sm text-gray-500">10 second max • Tap again to stop</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center text-green-600">
                      <Check className="w-8 h-8 mr-2" />
                      <span className="font-semibold">Recording completed!</span>
                    </div>
                    
                    {/* Evaluation Progress */}
                    {loading && currentQuestionIndex === questions.length - 1 && (
                      <div className="text-center space-y-3 mb-6">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <span className="text-lg font-semibold text-blue-600">
                            {evaluationMessage || 'Evaluating...'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Analyzing your pronunciation patterns and determining your proficiency level
                        </div>
                        <div className="flex justify-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-3 justify-center">
                      <button
                        onClick={() => setRecordings(prev => {
                          const updated = { ...prev }
                          delete updated[currentQuestionIndex]
                          return updated
                        })}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Re-record
                      </button>
                      <button
                        onClick={() => {
                          console.log('Next/Finish button clicked', {
                            currentQuestionIndex,
                            totalQuestions: questions.length,
                            isLastQuestion: currentQuestionIndex === questions.length - 1,
                            hasRecording: !!recordings[currentQuestionIndex],
                            recordingsCount: Object.keys(recordings).length
                          })
                          nextQuestion()
                        }}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {currentQuestionIndex === questions.length - 1 
                          ? (loading ? 'Processing...' : 'Finish Test') 
                          : 'Next Question'}
                      </button>
                    </div>
                  </>
                )}
                
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <X className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

                      {/* Step 4: Assessment Results */}
            {step === 4 && assessmentResults && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Assessment Complete!</h3>
                  <p className="text-gray-600">{assessmentResults.overall_assessment}</p>
                </div>

                {/* LLM Assessment Result */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800 mb-2">Assessment Result</h4>
                    <div className="text-3xl font-bold text-blue-700 mb-2">
                      {evaluatedLevel.toUpperCase()}
                      {language.cefr_supported && (
                        <span className="text-sm text-gray-600 ml-2">
                          (CEFR Level)
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mb-2">
                      Overall AiBubu thinks your level is: <span className="text-purple-700">{PLAYER_LEVEL_MAPPINGS.find(m => m.textLevel === mappedPlayerLevel)?.displayName}</span>
                    </div>
                    <p className="text-blue-600 text-sm">
                      {assessmentResults.recommendation_reason}
                    </p>
                  </div>
                </div>



                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={() => setStep(4.5)} // Use 4.5 as step identifier for details screen
                    className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Show Details
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Continue to Level Selection
                  </button>
                </div>
              </div>
            )}

            {/* Step 4.5: Detailed Assessment Results */}
            {step === 4.5 && assessmentResults && (
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Detailed Assessment Results</h3>
                  <p className="text-gray-600">Complete breakdown of your pronunciation assessment</p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex space-x-3 mb-6">
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Back to Summary
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Continue to Level Selection
                  </button>
                </div>

                {/* Scrollable Details Content - Only Question Analysis */}
                <div className="flex-1">
                  {/* Detailed Question Feedback */}
                  {assessmentResults.question_feedback && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 text-lg mb-4">Question by Question Analysis</h4>
                      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500 pr-2">
                      {assessmentResults.question_feedback.map((feedback: any, i: number) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-800 text-lg mb-2">
                                Question {feedback.question_number}
                              </h6>
                              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                <p className="text-sm text-gray-600 mb-1">
                                  <strong>Target:</strong> "{feedback.target_phrase}"
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Your response:</strong> "{feedback.student_response}"
                                </p>
                              </div>
                            </div>
                            <div className={`px-3 py-2 rounded-lg text-lg font-bold ml-4 ${
                              feedback.score >= 80 ? 'bg-green-100 text-green-800' :
                              feedback.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {feedback.score}/100
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 mb-1">Feedback:</p>
                              <p className="text-sm text-blue-700">{feedback.feedback}</p>
                            </div>
                            
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-purple-800 mb-1">Difficulty Assessment:</p>
                              <p className="text-sm text-purple-700">{feedback.difficulty_assessment}</p>
                            </div>

                            {feedback.strengths && feedback.strengths.length > 0 && (
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-green-800 mb-1">What you did well:</p>
                                <ul className="text-sm text-green-700 space-y-1">
                                  {feedback.strengths.map((strength: string, idx: number) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-green-500 mr-1 mt-0.5">•</span>
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.areas_for_improvement && feedback.areas_for_improvement.length > 0 && (
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-orange-800 mb-1">Areas to improve:</p>
                                <ul className="text-sm text-orange-700 space-y-1">
                                  {feedback.areas_for_improvement.map((area: string, idx: number) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-orange-500 mr-1 mt-0.5">•</span>
                                      {area}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                                              ))}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            )}

            {/* Step 5: Level selection */}
            {step === 5 && assessmentResults && (
                              <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Level</h3>
                    <p className="text-gray-600">Select the proficiency level that best fits your needs</p>
                  </div>

                  {/* Assessment Summary */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-800 mb-2">Assessment Recommendation</h4>
                      <div className="text-xl font-bold text-purple-700 mb-1">
                        {PLAYER_LEVEL_MAPPINGS.find(m => m.textLevel === mappedPlayerLevel)?.displayName}
                      </div>
                      <p className="text-purple-600 text-sm">
                        Based on your {evaluatedLevel.toUpperCase()} assessment
                      </p>
                    </div>
                  </div>

                                  {/* Level Selection */}
                  <div>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                      We recommend <strong>{PLAYER_LEVEL_MAPPINGS.find(m => m.textLevel === mappedPlayerLevel)?.displayName}</strong>, but you can choose any level:
                    </p>
                  
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {PLAYER_LEVEL_MAPPINGS.map((levelInfo) => (
                      <button
                        key={levelInfo.textLevel}
                        onClick={() => setSelectedLevel(levelInfo.textLevel)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          selectedLevel === levelInfo.textLevel
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : levelInfo.textLevel === mappedPlayerLevel
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${levelInfo.color}`}>
                            {levelInfo.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{levelInfo.displayName}</div>
                            <div className="text-xs text-gray-500 mt-1">{levelInfo.description}</div>
                            {levelInfo.textLevel === mappedPlayerLevel && (
                              <div className="text-xs text-purple-600 font-medium mt-1">Recommended</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep(4)}
                      className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Back to Details
                    </button>
                    <button
                      onClick={() => confirmLevel(selectedLevel || mappedPlayerLevel)}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : `Confirm ${PLAYER_LEVEL_MAPPINGS.find(m => m.textLevel === (selectedLevel || mappedPlayerLevel))?.displayName} Level`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}