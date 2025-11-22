'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { X, Mic, MicOff, Play, Pause, Check, Star, BookOpen, TestTube, Brain, Award, Target, ChevronRight, Trophy, Volume2, VolumeX } from 'lucide-react'
import { 
  mapCefrToPlayerLevel, 
  getAvailableLevels, 
  textLevelToDbLevel,
  PLAYER_LEVEL_MAPPINGS,
  type LevelMapping 
} from '@/lib/level-utils'
import AppHeader from '@/components/AppHeader'

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

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [language, setLanguage] = useState<Language | null>(null)
  const category = params.category as string
  const languageCode = params.languageCode as string
  
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
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null)
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(10)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioController, setAudioController] = useState<any>(null)
  const [voiceSettings, setVoiceSettings] = useState({
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    voice_name: 'Default Female Voice',
    preset: 'calm',
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: false
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Get player data including preferences
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (playerData) {
        setPlayer(playerData)
        
        // Initialize voice settings from player preferences
        const voicePrefs = playerData.player_preferences?.voice_settings
        const advancedPrefs = playerData.player_preferences?.advanced_voice_settings
        if (voicePrefs || advancedPrefs) {
          setVoiceSettings({
            voice_id: voicePrefs?.voice_id || 'JBFqnCBsd6RMkjVDRZzb',
            voice_name: voicePrefs?.voice_name || 'Default Female Voice',
            preset: advancedPrefs?.preset || 'calm',
            stability: advancedPrefs?.stability || 0.6,
            similarity_boost: advancedPrefs?.similarity_boost || 0.8,
            style: advancedPrefs?.style || 0.3,
            use_speaker_boost: advancedPrefs?.use_speaker_boost || false
          })
        }
      }
    }

    const getLanguage = async () => {
      const { data: languageData } = await supabase
        .from('speaking_languages')
        .select('*')
        .eq('language_code', languageCode)
        .eq('is_active', true)
        .single()
      
      if (languageData) {
        setLanguage(languageData)
      } else {
        router.push('/dashboard')
      }
    }

    getUser()
    getLanguage()
  }, [languageCode, router])

  useEffect(() => {
    if (language) {
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
        if (prev) clearTimeout(prev)
        return null
      })
      setCountdownTimer(prev => {
        if (prev) clearInterval(prev)
        return null
      })
      // Reset recording state for new question
      setRecordingTimeLeft(10)
      setIsRecording(false)
      // Stop any playing audio
      stopAudio()
    }
  }, [language])

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopAudio()
      if (recordingTimer) {
        clearTimeout(recordingTimer)
      }
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    }
  }, [])

  const startTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/language-assessment-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language_code: language?.language_code,
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setRecordingTimeLeft(10)

      // Set up 10-second auto-stop timer
      const autoStopTimer = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
        }
      }, 10000)

      // Start recording timer (counts up for display)
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Recording countdown timer (10 seconds, counts down)
      const countdownInterval = setInterval(() => {
        setRecordingTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setRecordingTimer(autoStopTimer)
      setCountdownTimer(countdownInterval)

      // Combined onstop handler
      recorder.onstop = () => {
        // Original recording save functionality
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setRecordings(prev => ({
          ...prev,
          [currentQuestionIndex]: blob
        }))
        stream.getTracks().forEach(track => track.stop())
        
        // Timer cleanup functionality
        clearInterval(countdownInterval)
        clearInterval(timer)
        if (autoStopTimer) {
          clearTimeout(autoStopTimer)
        }
        setRecordingTimer(null)
        setCountdownTimer(null)
        setRecordingTimeLeft(10)
        setIsRecording(false)
      }

    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setRecordingTimeLeft(10)
      if (recordingTimer) {
        clearTimeout(recordingTimer)
        setRecordingTimer(null)
      }
      if (countdownTimer) {
        clearInterval(countdownTimer)
        setCountdownTimer(null)
      }
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // All questions completed, process the assessment
      processAssessment()
    }
  }

  // ElevenLabs speech synthesis
  const tryElevenLabsSpeech = async (text: string): Promise<boolean> => {
    try {
      // Use voice settings from player preferences if available
      const currentVoiceSettings = player?.player_preferences?.advanced_voice_settings || voiceSettings
      const currentVoiceId = player?.player_preferences?.voice_settings?.voice_id || voiceSettings.voice_id
      
      const response = await fetch('/api/elevenlabs-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: currentVoiceId,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: currentVoiceSettings.stability,
            similarity_boost: currentVoiceSettings.similarity_boost,
            style: currentVoiceSettings.style,
            use_speaker_boost: currentVoiceSettings.use_speaker_boost
          }
        })
      })

      const audioData = await response.json()
      if (audioData.success && audioData.audio_data) {
        // Convert base64 to audio blob
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioData.audio_data), c => c.charCodeAt(0))],
          { type: audioData.content_type }
        )
        
        // Create audio URL and play
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        // Store reference for stopping if needed
        setAudioController(audio)
        
        // Play the audio
        await audio.play()
        
        // Clean up the URL after playing
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setAudioController(null)
          setIsPlayingAudio(false)
        }
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setAudioController(null)
          setIsPlayingAudio(false)
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error)
      return false
    }
  }

  // Fallback Web Speech API
  const speakTextFallback = async (text: string, language: string = 'en') => {
    if (!speechSynthesis) return
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language.includes('-') ? language : `${language}-US`
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.volume = 0.8
    
    // Try to find a voice for the language
    const voices = speechSynthesis.getVoices()
    const langCode = language.split('-')[0]
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(langCode) && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.startsWith(langCode))
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.onend = () => {
      setIsPlayingAudio(false)
    }
    
    utterance.onerror = () => {
      setIsPlayingAudio(false)
    }
    
    speechSynthesis.speak(utterance)
  }

  // Main speak function
  const speakText = async (text: string, language: string = 'en') => {
    try {
      // If currently playing, stop the audio
      if (isPlayingAudio) {
        stopAudio()
        return
      }
      
      setIsPlayingAudio(true)
      
      // Try ElevenLabs first for best quality
      const elevenLabsSuccess = await tryElevenLabsSpeech(text)
      if (!elevenLabsSuccess) {
        // Fallback to Web Speech API
        await speakTextFallback(text, language)
      }
    } catch (error) {
      console.error('Error with speech synthesis:', error)
      setIsPlayingAudio(false)
      // Final fallback
      await speakTextFallback(text, language)
    }
  }

  // Stop audio function
  const stopAudio = () => {
    try {
      if (audioController) {
        audioController.pause()
        audioController.currentTime = 0
        setAudioController(null)
      }
      
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
      
      setIsPlayingAudio(false)
    } catch (error) {
      console.error('Error stopping audio:', error)
    }
  }

  const processAssessment = async () => {
    setStep(4)
    setLoading(true)
    
    // Start rotating evaluation messages
    let messageIndex = 0
    const messageInterval = setInterval(() => {
      setEvaluationMessage(EVALUATION_MESSAGES[messageIndex])
      messageIndex = (messageIndex + 1) % EVALUATION_MESSAGES.length
    }, 2000)

    try {
      // Create FormData with recordings
      const formData = new FormData()
      formData.append('language_code', language?.language_code || '')
      formData.append('questions', JSON.stringify(questions))
      
      // Add each recording
      Object.entries(recordings).forEach(([index, blob]) => {
        formData.append(`recording_${index}`, blob, `recording_${index}.wav`)
      })

      const response = await fetch('/api/evaluate-language-level', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setAssessmentResults(data.assessment)
        setEvaluatedLevel(data.level || 'beginner')
        
        // Map LLM result to player level
        const mapped = mapLLMResultToPlayerLevel(data.level || 'beginner', language)
        setMappedPlayerLevel(mapped)
        
        clearInterval(messageInterval)
        setStep(5)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Assessment API error:', errorData)
        throw new Error('Failed to process assessment')
      }
    } catch (error) {
      console.error('Error processing assessment:', error)
      clearInterval(messageInterval)
      setError('Failed to process your assessment. Please try again.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const confirmLevel = async (level: string) => {
    setLoading(true)
    try {
      if (!user || !language) return

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

      // Navigate to tutorials page with speaking category
      router.push('/tutorials?category=speaking')
    } catch (error) {
      console.error('Error saving level:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !language) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      <AppHeader
        user={user}
        title="Assessment"
        subtitle={`${language.flag_emoji} ${language.language_name} - ${category}`}
        showBackButton={true}
      />

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {getAvailableLevels(language.cefr_supported).map((levelInfo) => (
                  <KidCard
                    key={levelInfo.textLevel}
                    onClick={() => confirmLevel(levelInfo.textLevel)}
                    className="p-4 cursor-pointer transition-all border-gray-200 hover:border-purple-300 hover:scale-105"
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
        )}

        {/* Step 3: Take the speaking test */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Speaking Assessment
              </h3>
              <p className="text-gray-600 mb-2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {questions[currentQuestionIndex] && (
              <KidCard className="p-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50 border-blue-300">
                <div className="text-center space-y-6">
                  
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6 hover:transform-none hover:shadow-none hover:border-yellow-200 hover:scale-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-gray-800 flex-1">
                        "{questions[currentQuestionIndex].pronunciation_text}"
                      </p>
                      <button
                        onClick={() => speakText(questions[currentQuestionIndex].pronunciation_text, language?.language_code || 'en')}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ml-3 flex-shrink-0 ${
                          isPlayingAudio 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        title={isPlayingAudio ? 'Stop Audio' : 'Listen to Pronunciation'}
                      >
                        {isPlayingAudio ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Recording Controls */}
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      {!isRecording && !recordings[currentQuestionIndex] && (
                        <button
                          onClick={startRecording}
                          className="relative w-24 h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Mic className="w-8 h-8 text-white" />
                        </button>
                      )}

                      {isRecording && (
                        <div className="relative">
                          {/* Animated rings around recording button */}
                          <div className="absolute inset-0 rounded-full border-4 border-red-400 opacity-75 animate-ping"></div>
                          <div className="absolute inset-2 rounded-full border-4 border-red-300 opacity-50 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                          
                          {/* Volume visualization rings */}
                          {Array.from({ length: 3 }, (_, i) => (
                            <div
                              key={i}
                              className="absolute rounded-full border-2 border-red-300"
                              style={{
                                inset: `${-8 * (i + 1)}px`,
                                opacity: Math.max(0.1, Math.min(0.8, (recordingTime % 3) / 3 - i * 0.2)),
                                animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
                                animationDelay: `${i * 0.3}s`
                              }}
                            />
                          ))}
                          
                          {/* Recording countdown timer */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                            <div className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                              {recordingTimeLeft}s
                            </div>
                          </div>
                          
                          {/* Main recording button */}
                          <button
                            onClick={stopRecording}
                            className="relative w-24 h-24 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg animate-pulse z-10"
                          >
                            <MicOff className="w-8 h-8 text-white" />
                          </button>
                        </div>
                      )}

                      {recordings[currentQuestionIndex] && !isRecording && (
                        <button
                          onClick={startRecording}
                          className="relative w-24 h-24 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Check className="w-8 h-8 text-white" />
                        </button>
                      )}
                    </div>

                    {/* Recording status text */}
                    {isRecording && (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-lg font-medium text-gray-700">
                            Recording... {recordingTime}s
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Auto-stop in {recordingTimeLeft} seconds</p>
                      </div>
                    )}

                    {!isRecording && !recordings[currentQuestionIndex] && (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Click to start recording (10s max)</p>
                      </div>
                    )}

                    {recordings[currentQuestionIndex] && !isRecording && (
                      <div className="space-y-4">
                        <div className="flex space-x-3">
                          <KidButton
                            variant="success"
                            onClick={nextQuestion}
                            className="flex-1"
                          >
                            {currentQuestionIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </KidButton>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </KidCard>
            )}
          </div>
        )}

        {/* Step 4: Processing/Loading */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Analyzing Your Speaking...
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                {evaluationMessage || "Processing your recordings..."}
              </p>
              
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments...</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && (
          <div className="space-y-8">
            <div className="text-center">
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Assessment Complete!
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Based on your speaking assessment, here's your level:
              </p>
            </div>

            <KidCard className="p-8 bg-gradient-to-br from-green-50/50 to-blue-50/50 border-green-300 focus-within:ring-4 focus-within:ring-green-200 focus-within:border-green-400 transition-all duration-300">
              <div className="text-center space-y-6">
                <div className="text-3xl font-bold text-green-600 mb-4">
                  {mappedPlayerLevel.toUpperCase()}
                </div>
                
                <h4 className="text-xl font-bold text-gray-800">
                  Your {language.language_name} Level
                </h4>
                
                {/* Action Buttons - Moved to top */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <KidButton
                    variant="success"
                    onClick={() => confirmLevel(mappedPlayerLevel)}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Confirm This Level'}
                    <Check className="w-5 h-5 ml-2" />
                  </KidButton>
                  
                  {assessmentResults?.question_feedback && (
                    <KidButton
                      variant="secondary"
                      onClick={() => setShowDetailedResults(!showDetailedResults)}
                    >
                      {showDetailedResults ? 'Hide' : 'Show'} Details
                    </KidButton>
                  )}
                </div>
                
                {assessmentResults && (
                  <div className="space-y-4 text-left">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h5 className="font-semibold text-gray-800 mb-2">Assessment Summary:</h5>
                      <p className="text-gray-600 text-sm mb-2">
                        Evaluated Level: <span className="font-medium">{evaluatedLevel}</span>
                      </p>
                      <p className="text-gray-600 text-sm mb-2">
                        Mapped to Player Level: <span className="font-medium">{mappedPlayerLevel}</span>
                      </p>
                      {assessmentResults.overall_assessment && (
                        <p className="text-gray-700 text-sm mt-3 italic">
                          {assessmentResults.overall_assessment}
                        </p>
                      )}
                    </div>
                    
                    {showDetailedResults && assessmentResults.question_feedback && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h5 className="font-semibold text-blue-800 mb-3">Detailed Question Feedback:</h5>
                        <div className="space-y-3">
                          {assessmentResults.question_feedback.map((feedback: any, index: number) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="font-medium text-blue-800">Question {feedback.question_number}</h6>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                  Score: {feedback.score}/100
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Target:</strong> "{feedback.target_phrase}"
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>You said:</strong> "{feedback.student_response}"
                              </p>
                              <p className="text-sm text-blue-700">{feedback.feedback}</p>
                            </div>
                          ))}
                        </div>
                        
                        {assessmentResults.strengths && assessmentResults.strengths.length > 0 && (
                          <div className="mt-4">
                            <h6 className="font-medium text-green-800 mb-2">Your Strengths:</h6>
                            <ul className="text-sm text-green-700 list-disc list-inside">
                              {assessmentResults.strengths.map((strength: string, index: number) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {assessmentResults.areas_for_improvement && assessmentResults.areas_for_improvement.length > 0 && (
                          <div className="mt-4">
                            <h6 className="font-medium text-orange-800 mb-2">Areas for Improvement:</h6>
                            <ul className="text-sm text-orange-700 list-disc list-inside">
                              {assessmentResults.areas_for_improvement.map((area: string, index: number) => (
                                <li key={index}>{area}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </KidCard>
          </div>
        )}
      </main>
    </div>
  )
}