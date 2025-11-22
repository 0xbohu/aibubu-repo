'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useChat } from 'ai/react'
import Monaco from '@monaco-editor/react'
import { checkAchievements, type Achievement } from '@/lib/achievements'
import AchievementModal from '@/components/AchievementModal'
import Link from 'next/link'
import { 
  ArrowLeft, 
  ArrowRight,
  Check, 
  Star, 
  Target,
  Lightbulb,
  Sparkles,
  Trophy,
  RefreshCw,
  Undo2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Speaker,
  Play
} from 'lucide-react'
import UnifiedVoiceSettingsModal from '@/components/UnifiedVoiceSettingsModal'
import UserDropdown from '@/components/UserDropdown'
import AppHeader from '@/components/AppHeader'

// AiBubu UI Components
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

type Tutorial = {
  id: string
  title: string
  description: string
  difficulty_level: number
  category: string
  tutorial_type: 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent' | 'speaking'
  age_min: number
  age_max: number
  learning_objectives: string[]
  code_template?: string
  expected_output?: string
  content_screens?: {
    screens: Array<{
      type: 'content' | 'instruction'
      title: string
      content: string
      image?: string
    }>
  }
  questions?: {
    questions: Array<{
      id: string
      type: 'multiple_choice' | 'input' | 'textarea' | 'pronunciation'
      question?: string
      instruction?: string
      options?: string[]
      correct?: string
      min_words?: number
      // Pronunciation-specific fields
      language?: string
      word?: string
      phrase?: string
      phonetic?: string
      audio_url?: string
    }>
  }
  max_generated_points: number
  points_reward: number
}

type AnswerState = {
  [questionId: string]: {
    answer: string
    isValidated: boolean
    isCorrect?: boolean
    feedback?: string
    points?: number
      // Pronunciation-specific fields
  audioBlob?: Blob
  pronunciationScore?: number
  pronunciationFeedback?: string
  languageMismatch?: boolean
  detectedLanguage?: string
  // Additional LLM response fields
  pronunciationTranscript?: string
  pronunciationIssues?: string[]
  pronunciationTips?: string[]
  }
}

// Helper function to get language display names
const getLanguageName = (languageCode: string): string => {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'ja': 'Japanese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'ko': 'Korean'
  }
  return languageNames[languageCode] || languageCode
}

export default function EnhancedTutorialPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [tutorial, setTutorial] = useState<Tutorial | null>(null)
  const [currentStep, setCurrentStep] = useState(0) // 0: content screens, 1: questions, 2: completion
  const [currentScreen, setCurrentScreen] = useState(0)
  const [answers, setAnswers] = useState<AnswerState>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [showGenerateMore, setShowGenerateMore] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  
  // View state for question/review transition
  const [showReviewView, setShowReviewView] = useState<{[questionId: string]: boolean}>({})

  // Speech-related state
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [isValidatingPronunciation, setIsValidatingPronunciation] = useState(false)
  const [validatingQuestionId, setValidatingQuestionId] = useState<string | null>(null)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [temperature, setTemperature] = useState(0.5) // AI response creativity (0.1-1.0)
  const [isReadingFeedback, setIsReadingFeedback] = useState(false)
  const [feedbackAudioController, setFeedbackAudioController] = useState<any>(null)
  
  // Volume detection and auto-stop state
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(10)
  
  // Voice settings state (using database)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState({
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    voice_name: 'Default Female Voice',
    preset: 'calm',
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: false
  })

  // Legacy coding mode states (for agent tutorials)
  const [mode, setMode] = useState<'coding' | 'chat'>('coding')
  const [code, setCode] = useState('')
  const [simulationResult, setSimulationResult] = useState('')

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { mode }
  })


  useEffect(() => {
    const initialize = async () => {
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
      
      // Load tutorial
      const { data: tutorialData } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (tutorialData) {
        setTutorial(tutorialData as Tutorial)
        // Initialize code for agent tutorials
        if (tutorialData.tutorial_type === 'agent' && tutorialData.code_template) {
          setCode(tutorialData.code_template)
        }
      }
      
      setLoading(false)
    }

    initialize()
  }, [params.id, router])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis)
      
      // Load voices if not already loaded
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length === 0) {
          // Voices not loaded yet, wait for them
          window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
        }
      }
      loadVoices()
    }
  }, [])

  // Enhanced speech synthesis with multiple options: ElevenLabs > Web Speech API > LLM fallback
  const speakText = async (text: string, language: string = 'en') => {
    try {
      // First option: Try ElevenLabs for highest quality and fastest response
      const elevenLabsSuccess = await tryElevenLabsSpeech(text)
      if (elevenLabsSuccess) {
        console.log('✅ Used ElevenLabs speech synthesis')
        return
      }

      // Second option: Web Speech API (reliable, instant)
      if (speechSynthesis) {
        console.log('⚡ Using Web Speech API fallback')
        await speakTextFallback(text, language)
        return
      }

      // Third option: LLM-enhanced Web Speech API (intelligent but slower)
      console.log('🧠 Using LLM-enhanced speech synthesis')
      await tryLLMEnhancedSpeech(text, language)

    } catch (error) {
      console.error('Error with all speech synthesis methods:', error)
      // Final fallback
      await speakTextFallback(text, language)
    }
  }

  // ElevenLabs speech synthesis (primary option)
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
          model_id: 'eleven_flash_v2_5', // Fastest model
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
        setFeedbackAudioController(audio)
        
        // Play the audio
        await audio.play()
        
        // Clean up the URL after playing
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setFeedbackAudioController(null)
        }
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setFeedbackAudioController(null)
        }

        return true
      }

      return false
    } catch (error) {
      console.error('ElevenLabs speech failed:', error)
      return false
    }
  }

  // LLM-enhanced speech synthesis (fallback option)
  const tryLLMEnhancedSpeech = async (text: string, language: string) => {
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          voice_style: 'child',
          speed: 'normal',
          emotion: 'encouraging'
        })
      })

      const speechData = await response.json()

      if (speechData.success && speechSynthesis) {
        let utteranceText = text
        let voiceConfig = speechData.web_speech_fallback

        // Use LLM-enhanced SSML if available
        if (speechData.method === 'llm_enhanced' && speechData.synthesis_config?.ssml_text) {
          utteranceText = speechData.synthesis_config.ssml_text
            .replace(/<[^>]*>/g, '') // Remove SSML tags
            .trim()
        }

        const utterance = new SpeechSynthesisUtterance(utteranceText)
        utterance.lang = voiceConfig.language
        utterance.rate = voiceConfig.rate
        utterance.pitch = voiceConfig.pitch
        utterance.volume = 0.8

        // Enhanced voice selection based on LLM recommendations
        if (speechData.synthesis_config?.voice_characteristics) {
          const voices = speechSynthesis.getVoices()
          const langCode = voiceConfig.language.split('-')[0]
          const voiceChar = speechData.synthesis_config.voice_characteristics

          let selectedVoice = voices.find(v => v.lang.startsWith(langCode) && 
            (voiceChar.gender === 'female' ? 
              (v.name.toLowerCase().includes('female') ||
               !v.name.toLowerCase().includes('male')) : true) &&
            (voiceChar.age === 'young' ?
              (v.name.toLowerCase().includes('child') ||
               v.name.toLowerCase().includes('young')) : true))

          if (selectedVoice) {
            utterance.voice = selectedVoice
          }
        }

        speechSynthesis.speak(utterance)
      } else {
        await speakTextFallback(text, language)
      }
    } catch (error) {
      console.error('LLM speech failed:', error)
      await speakTextFallback(text, language)
    }
  }

  // Fallback Web Speech API function (backup of original implementation)
  const speakTextFallback = async (text: string, language: string = 'en') => {
    if (!speechSynthesis) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language.includes('-') ? language : `${language}-US`
    utterance.rate = 0.9 // Slightly faster for child-like speech
    utterance.pitch = 1.3 // Higher pitch for younger sound
    
    // Try to find a child-friendly voice for the language
    const voices = speechSynthesis.getVoices()
    const langCode = language.split('-')[0]
    
    // Priority order: Child voices > Female voices > Any voice
    let selectedVoice = 
      // First try to find child/young voices
      voices.find(v => v.lang.startsWith(langCode) && 
        (v.name.toLowerCase().includes('child') || 
         v.name.toLowerCase().includes('young') ||
         v.name.toLowerCase().includes('kid'))) ||
      // Then try female voices (typically higher pitched)
      voices.find(v => v.lang.startsWith(langCode) && 
        (v.name.toLowerCase().includes('female') ||
         v.name.toLowerCase().includes('woman') ||
         v.name.toLowerCase().includes('girl') ||
         !v.name.toLowerCase().includes('male'))) ||
      // Fallback to any voice for the language
      voices.find(v => v.lang.startsWith(langCode))
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    // Add some excitement for kids
    utterance.volume = 0.8
    
    speechSynthesis.speak(utterance)
  }

  // Automatically read AI feedback aloud using ElevenLabs
  const readAIFeedbackAloud = async (validationResult: any) => {
    try {
      if (!validationResult) return

      setIsReadingFeedback(true)

      // Create a natural, encouraging feedback message
      let feedbackText = ''
      
      // Start with score announcement
      if (validationResult.score !== undefined) {
        const score = validationResult.score
        if (score >= 90) {
          feedbackText += "Excellent! "
        } else if (score >= 75) {
          feedbackText += "Great job! "
        } else if (score >= 60) {
          feedbackText += "Good effort! "
        } else {
          feedbackText += "Nice try! "
        }
        feedbackText += `Your pronunciation scored ${score} out of 100. `
      }

      // Add main feedback
      if (validationResult.feedback) {
        feedbackText += validationResult.feedback + " "
      }

      // Add specific issues if any
      if (validationResult.specific_issues && validationResult.specific_issues.length > 0) {
        feedbackText += "Here are some areas to focus on: " + validationResult.specific_issues.join(", ") + ". "
      }

      // Add pronunciation tips if any
      if (validationResult.pronunciation_tips && validationResult.pronunciation_tips.length > 0) {
        feedbackText += "Here's a tip: " + validationResult.pronunciation_tips[0] + " "
      }

      // Add language mismatch warning if needed
      if (validationResult.language_mismatch && validationResult.detected_language) {
        feedbackText += `Please note, I detected you spoke in ${validationResult.detected_language}, but this exercise is for English pronunciation. `
      }

      // Encouraging ending
      if (validationResult.score >= 75) {
        feedbackText += "Keep up the great work!"
      } else {
        feedbackText += "Keep practicing, you're doing great!"
      }

      // Use our enhanced speech synthesis to read the feedback
      console.log('🎤 Reading AI feedback aloud:', feedbackText.substring(0, 50) + '...')
      
      // Try ElevenLabs first for best quality
      const elevenLabsSuccess = await tryElevenLabsSpeech(feedbackText)
      if (!elevenLabsSuccess) {
        // Fallback to Web Speech API
        await speakTextFallback(feedbackText, 'en')
      }

    } catch (error) {
      console.error('Error reading AI feedback aloud:', error)
      // Don't fail silently - try a simple fallback
      try {
        if (validationResult.feedback) {
          await speakTextFallback(validationResult.feedback, 'en')
        }
      } catch (fallbackError) {
        console.error('Fallback speech also failed:', fallbackError)
      }
    } finally {
      setIsReadingFeedback(false)
    }
  }

  // Stop feedback audio function
  const stopFeedbackAudio = () => {
    try {
      // Stop Web Speech API if active
      if (speechSynthesis) {
        speechSynthesis.cancel()
      }
      
      // Stop any audio element if active
      if (feedbackAudioController) {
        feedbackAudioController.pause()
        feedbackAudioController.currentTime = 0
      }
      
      setIsReadingFeedback(false)
      console.log('🔇 Stopped AI feedback audio')
    } catch (error) {
      console.error('Error stopping feedback audio:', error)
    }
  }

  // Start recording function
  const startRecording = async (questionId: string) => {
    try {
      // Get microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)
      setRecordingQuestionId(questionId)
      
      // Start recording immediately
      startActualRecording(questionId, stream)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Please allow microphone access to practice pronunciation')
    }
  }
  
  // Actual recording function (called after countdown)
  const startActualRecording = (questionId: string, stream: MediaStream) => {
    try {
      // Set up audio analysis for volume detection
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      analyser.fftSize = 256
      microphone.connect(analyser)
      setAudioAnalyser(analyser)
      
      // Volume monitoring function
      const monitorVolume = () => {
        if (recordingQuestionId === questionId) {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          setVolumeLevel(Math.min(100, (average / 128) * 100))
          requestAnimationFrame(monitorVolume)
        }
      }
      monitorVolume()
      
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      
      const audioChunks: BlobPart[] = []
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        setRecordedAudio(audioBlob)
        // Create URL for playback
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordedAudioUrl(audioUrl)
        setRecordingQuestionId(null)
        setVolumeLevel(0)
        
        // Clean up audio context
        audioContext.close()
        setAudioAnalyser(null)
        
        // Auto-send to LLM for tutorials
        const question = tutorial?.questions?.questions?.find((q: any) => q.id === questionId)
        if (question) {
          validatePronunciation(questionId, question, audioBlob)
        }
      }
      
      recorder.start()
      setRecordingTimeLeft(10)
      
      // Set up 10-second auto-stop timer
      const timer = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
        }
      }, 10000)
      setRecordingTimer(timer)
      
      // Recording countdown timer (10 seconds)
      const countdownInterval = setInterval(() => {
        setRecordingTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Clean up countdown and timer on recording stop
      const originalOnStop = recorder.onstop
      recorder.onstop = (event) => {
        clearInterval(countdownInterval)
        if (timer) {
          clearTimeout(timer)
          setRecordingTimer(null)
        }
        if (originalOnStop) originalOnStop.call(recorder, event)
      }
      
    } catch (error) {
      console.error('Error starting actual recording:', error)
      // Clean up if recording fails
      setRecordingQuestionId(null)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }


  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
    if (recordingTimer) {
      clearTimeout(recordingTimer)
      setRecordingTimer(null)
    }
    setRecordingQuestionId(null)
    setVolumeLevel(0)
    setRecordingTimeLeft(10)
  }

  // Stop recording function (without auto-validation)
  const stopRecordingOnly = async (questionId: string) => {
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Create a promise that resolves when recording is complete
      const recordingPromise = new Promise<Blob>((resolve) => {
        const audioChunks: BlobPart[] = []
        
        // Collect any remaining data
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          setRecordedAudio(audioBlob)
          // Create URL for playback
          const audioUrl = URL.createObjectURL(audioBlob)
          setRecordedAudioUrl(audioUrl)
          setRecordingQuestionId(null)
          
          // Auto-send to LLM for tutorials (for 10s timeout case)
          const question = tutorial?.questions?.questions?.find((q: any) => q.id === questionId)
          if (question) {
            validatePronunciation(questionId, question, audioBlob)
          }
          
          resolve(audioBlob)
        }
        
        mediaRecorder.stop()
      })
      
      // Stop the audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
        setAudioStream(null)
      }
      
      // Just wait for recording to complete, don't auto-validate
      await recordingPromise
    }
  }
  

  const validateAnswer = async (questionId: string, answer: string) => {
    if (!tutorial) return

    setIsValidating(true)

    try {
      const response = await fetch('/api/validate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorialId: tutorial.id,
          questionId,
          answer,
          tutorialType: tutorial.tutorial_type
        })
      })

      const validation = await response.json()
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          answer,
          isValidated: true,
          isCorrect: validation.isCorrect,
          feedback: validation.feedback,
          points: validation.points
        }
      }))

      // Save response to database
      await supabase.from('tutorial_responses').insert({
        player_id: user!.id,
        tutorial_id: tutorial.id,
        question_id: questionId,
        player_answer: answer,
        llm_validation: validation,
        is_correct: validation.isCorrect,
        points_earned: validation.points || 0
      })

    } catch (error) {
      console.error('Error validating answer:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const validatePronunciation = async (questionId: string, question: any, audioBlob?: Blob) => {
    if (!tutorial) return

    setIsValidatingPronunciation(true)
    setValidatingQuestionId(questionId)
    
    // Reset previous feedback while loading
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        pronunciationScore: undefined,
        pronunciationFeedback: undefined,
        isValidated: false
      }
    }))

    try {
      let requestBody: any = {
        target_word: question.word || question.phrase || '',
        language: question.language || 'en',
        phonetic_target: question.phonetic,
        difficulty_level: 'easy', // More encouraging for kids
        temperature: temperature // AI response creativity
      }

      // If audio is provided, convert to base64 and send
      if (audioBlob) {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const base64Audio = btoa(Array.from(uint8Array, byte => String.fromCharCode(byte)).join(''))
        requestBody.audio_data = base64Audio
      } else {
        // Fallback to text input
        const userInput = answers[questionId]?.answer || ''
        requestBody.transcript = userInput || '[no input provided]'
      }

      const response = await fetch('/api/validate-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      const validation = result.validation
      
      const actualTranscript = audioBlob ? 'Audio recording' : (answers[questionId]?.answer || '[no input]')
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          answer: actualTranscript,
          isValidated: true,
          isCorrect: validation.is_correct,
          feedback: validation.feedback,
          points: Math.round((validation.score / 100) * 10), // Convert score to points
          pronunciationScore: validation.score,
          pronunciationFeedback: validation.feedback,
          languageMismatch: validation.language_mismatch,
          detectedLanguage: validation.detected_language,
          pronunciationTranscript: validation.transcript,
          pronunciationIssues: validation.specific_issues,
          pronunciationTips: validation.pronunciation_tips
        }
      }))

      // Save response to database
      await supabase.from('tutorial_responses').insert({
        player_id: user!.id,
        tutorial_id: tutorial.id,
        question_id: questionId,
        player_answer: actualTranscript,
        llm_validation: result,
        is_correct: validation.is_correct,
        points_earned: Math.round((validation.score / 100) * 10)
      })

      // Show the review view with transition (removed automatic audio playback)
      setShowReviewView(prev => ({ ...prev, [questionId]: true }))

    } catch (error) {
      console.error('Error validating pronunciation:', error)
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          pronunciationFeedback: 'Sorry, there was an error validating your pronunciation. Please try again.'
        }
      }))
      
      // Error occurred, user can manually play feedback if needed
    } finally {
      setIsValidatingPronunciation(false)
      setValidatingQuestionId(null)
    }
  }

  // Function to go back to question view
  const goBackToQuestion = (questionId: string) => {
    setShowReviewView(prev => ({ ...prev, [questionId]: false }))
    
    // Clear the answer state to remove AI score and feedback
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isValidated: false,
        pronunciationScore: undefined,
        pronunciationFeedback: '',
        detectedLanguage: '',
        languageMismatch: false,
        pronunciationDetails: undefined
      }
    }))
    
    // Stop any playing feedback audio
    if (isReadingFeedback) {
      stopFeedbackAudio()
    }
    
    // Clear recorded audio for fresh start
    setRecordedAudio(null)
    setRecordedAudioUrl('')
  }

  // Function to play only the LLM feedback audio or stop if currently playing
  const playFeedbackAudio = async (feedbackText: string) => {
    try {
      // If currently playing, stop the audio
      if (isReadingFeedback) {
        stopFeedbackAudio()
        return
      }
      
      if (!feedbackText) return
      
      setIsReadingFeedback(true)
      
      // Try ElevenLabs first for best quality
      const elevenLabsSuccess = await tryElevenLabsSpeech(feedbackText)
      if (!elevenLabsSuccess) {
        // Fallback to Web Speech API
        await speakTextFallback(feedbackText, 'en')
      }
      
    } catch (error) {
      console.error('Error playing feedback audio:', error)
      // Fallback to Web Speech API
      try {
        await speakTextFallback(feedbackText, 'en')
      } catch (fallbackError) {
        console.error('Fallback speech also failed:', fallbackError)
      }
    } finally {
      setIsReadingFeedback(false)
    }
  }

  const completeStepTwo = async () => {
    if (!tutorial || !user) return

    // Calculate total points earned
    const totalPoints = Object.values(answers).reduce((sum, answer) => 
      sum + (answer.points || 0), 0
    )

    // Update player progress
    await supabase.from('player_progress').upsert({
      player_id: user.id,
      tutorial_id: tutorial.id,
      status: 'completed',
      points_earned: totalPoints,
      completed_at: new Date().toISOString()
    })

    // Update player total points
    const { data: playerData } = await supabase
      .from('players')
      .select('total_points')
      .eq('id', user.id)
      .single()

    if (playerData) {
      await supabase
        .from('players')
        .update({ total_points: playerData.total_points + totalPoints })
        .eq('id', user.id)
    }

    // Check for achievements
    const achievement = await checkAchievements(user.id, {
      tutorialCompleted: true,
      pointsEarned: totalPoints,
      tutorialType: tutorial.tutorial_type
    })

    if (achievement && !Array.isArray(achievement)) {
      setNewAchievement(achievement)
    }

    setIsCompleted(true)
    setShowGenerateMore(true)
    
    // Redirect to tutorials learning path
    router.push('/tutorials')
  }

  const generateSimilarTutorial = async () => {
    if (!tutorial || !user) return

    setIsValidating(true)
    
    try {
      const response = await fetch('/api/generate-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseTutorialId: tutorial.id,
          playerId: user.id,
          difficultyAdjustment: 0 // Could be adjusted based on player performance
        })
      })

      if (response.status === 429) {
        const data = await response.json()
        alert(`You've reached your daily limit of ${data.dailyLimit} points from generated tutorials. Try again tomorrow!`)
        return
      }

      const data = await response.json()
      
      if (response.ok && data.tutorial) {
        // Navigate to the generated tutorial
        router.push(`/tutorial/generated/${data.tutorial.id}`)
      } else {
        throw new Error(data.error || 'Failed to generate tutorial')
      }
    } catch (error) {
      console.error('Error generating similar tutorial:', error)
      alert('Sorry, we couldn\'t generate a similar tutorial right now. Please try again later!')
    } finally {
      setIsValidating(false)
    }
  }

  if (loading || !tutorial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutorial...</p>
        </div>
      </div>
    )
  }

  // Legacy coding tutorial (agent type)
  if (tutorial.tutorial_type === 'agent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Existing agent tutorial UI would go here - keeping it unchanged */}
        <div className="text-center p-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{tutorial.title}</h1>
          <p className="text-gray-600">Agent tutorial - Legacy coding interface</p>
          <Link href="/dashboard" className="text-blue-500 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const contentScreens = tutorial.content_screens?.screens || []
  const questions = tutorial.questions?.questions || []
  const totalSteps = contentScreens.length > 0 ? 2 : 1 // Content + Questions, or just Questions

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Unified App Header */}
      {user && (
        <AppHeader
          user={user}
          player={player}
          subtitle={''}
          showBackButton={true}
          showVoiceSettings={true}
          showTemperature={tutorial?.tutorial_type === 'speaking'}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          onVoiceSettingsClick={() => setShowVoiceSettings(true)}
        />
      )}


      <main className="max-w-4xl mx-auto p-6">
        {/* Step 1: Tutorial Overview */}
        {currentStep === 0 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative">
              {/* Audio Button - Top Right */}
              <button
                onClick={() => {
                  const objectivesText = (tutorial.learning_objectives || []).length > 0 
                    ? ` You'll learn: ${(tutorial.learning_objectives || []).join(', ')}.` 
                    : '';
                  const fullText = `Welcome to ${tutorial.title}. ${tutorial.description}${objectivesText} This tutorial is worth ${tutorial.points_reward} XP. Let's get started!`;
                  speakText(fullText);
                }}
                className="absolute top-4 right-4 inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors text-sm"
              >
                <Volume2 className="w-4 h-4 mr-1" />
                Listen
              </button>

              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-3">{tutorial.title}</h1>
                <p className="text-gray-600 text-lg">{tutorial.description}</p>
              </div>

              {/* Learning Objectives */}
              {(tutorial.learning_objectives || []).length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎯</span>
                    What you'll learn:
                  </h2>
                  <div className="grid gap-2">
                    {(tutorial.learning_objectives || []).map((objective, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-blue-500 font-bold text-lg">•</span>
                        <span className="text-gray-700">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Button */}
              <div className="text-center">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold px-8 py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Let's Start!
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Earn up to <strong>{tutorial.points_reward} XP</strong> by completing this tutorial
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{tutorial.title}</h2>
            </div>


            {/* Current Question */}
            {questions.length > 0 && currentQuestionIndex < questions.length && (() => {
              const question = questions[currentQuestionIndex]
              const index = currentQuestionIndex
              const answerState = answers[question.id]
              
              return (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 min-h-[80vh] flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      {showReviewView[question.id] && answerState?.isValidated ? (
                        <>
                          <div></div> {/* Empty div for spacing */}
                          {currentQuestionIndex === questions.length - 1 ? (
                            <KidButton
                              variant="success"
                              size="lg"
                              onClick={completeStepTwo}
                            >
                              Complete Tutorial
                              <CheckCircle2 className="w-6 h-6 ml-2" />
                            </KidButton>
                          ) : (
                            <KidButton
                              variant="secondary"
                              size="lg"
                              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                            >
                              Next
                              <ChevronRight className="w-6 h-6 ml-2" />
                            </KidButton>
                          )}
                        </>
                      ) : (
                        <span className="text-lg font-semibold text-gray-800">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                      )}
                      
                      {question.type !== 'pronunciation' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => speakText(`Question ${index + 1}. ${question.question}`)}
                            className="flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm text-blue-700 transition-colors"
                          >
                            <Volume2 className="w-4 h-4 mr-1" />
                            Listen
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700">{question.question}</p>
                  </div>

                  {/* Multiple Choice */}
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2 mb-4">
                      {question.options?.map((option) => (
                        <label key={option} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            onChange={(e) => setAnswers(prev => ({
                              ...prev,
                              [question.id]: { ...prev[question.id], answer: e.target.value, isValidated: false }
                            }))}
                            className="w-4 h-4 text-blue-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  {question.type === 'input' && (
                    <input
                      type="text"
                      placeholder="Type your answer..."
                      onChange={(e) => setAnswers(prev => ({
                        ...prev,
                        [question.id]: { ...prev[question.id], answer: e.target.value, isValidated: false }
                      }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    />
                  )}

                  {/* Textarea */}
                  {question.type === 'textarea' && (
                    <textarea
                      placeholder="Write your answer..."
                      rows={4}
                      onChange={(e) => setAnswers(prev => ({
                        ...prev,
                        [question.id]: { ...prev[question.id], answer: e.target.value, isValidated: false }
                      }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    />
                  )}

                  {/* Pronunciation */}
                  {question.type === 'pronunciation' && (
                    <div className="flex-1 space-y-4 relative overflow-hidden flex flex-col">
                      <div className="relative flex-1 flex flex-col">
                        {/* Question/Recording View */}
                        <div className={`flex-1 flex flex-col transition-transform duration-500 ease-in-out ${
                          showReviewView[question.id] ? '-translate-y-full' : 'translate-y-0'
                        }`}>
                          {/* Target word/phrase display */}
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="text-center">
                              <h4 className="text-lg font-semibold text-blue-800 mb-2">
                                {question.instruction || `Say: "${question.word || question.phrase}"`}
                              </h4>
                              {question.phonetic && (
                                <p className="text-blue-600 text-sm">
                                  Pronunciation: <span className="font-mono">{question.phonetic}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Recording interface with big red circle */}
                          <div className="bg-gray-50 rounded-lg p-6 flex-1 flex flex-col justify-start">
                            {/* Desktop layout: left-right, Mobile layout: center */}
                            <div className="md:flex md:items-center">
                              {/* Left side: Text and status */}
                              <div className="md:flex-1 text-center md:text-left">
                                <p className="text-gray-600 mb-4">Record yourself saying the word:</p>
                                {recordingQuestionId !== question.id && recordedAudio ? (
                                  <p className="text-xs text-green-600 mb-4">
                                    Record your speaking
                                  </p>
                                ) : recordingQuestionId === question.id ? (
                                  <div className="mb-4">
                                    <p className="text-xs text-red-600 mb-2 animate-pulse">
                                      🔴 Recording... Speak clearly into the microphone
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 mb-4">
                                    🎤 Click to start recording (10s max recording time)
                                  </p>
                                )}
                              </div>
                              
                              {/* Right side: Record button */}
                              <div className="flex justify-center items-center md:flex-1 md:ml-6">
                                {/* Big Red Circle Recording Button */}
                                <div className="relative">
                                  {recordingQuestionId !== question.id ? (
                                    <button
                                      onClick={() => startRecording(question.id)}
                                      disabled={isValidatingPronunciation && validatingQuestionId === question.id}
                                      className="relative w-24 h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                      <Mic className="w-8 h-8 text-white" />
                                    </button>
                                  ) : (
                                    <div className="relative">
                                      {/* Animated volume indicator rings */}
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
                                      
                                      {/* Main recording button */}
                                      <button
                                        onClick={() => stopRecordingOnly(question.id)}
                                        className="relative w-24 h-24 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg animate-pulse z-10"
                                      >
                                        <MicOff className="w-8 h-8 text-white" />
                                      </button>
                                      
                                      {/* Volume level indicator */}
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
                                        <p className="text-xs text-gray-500 mt-1">
                                          {Math.round(volumeLevel)}% volume
                                        </p>
                                      </div>
                                      
                                      {/* Recording countdown timer */}
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
                            
                            {/* Analyzing indicator under record button */}
                            {isValidatingPronunciation && validatingQuestionId === question.id && (
                              <div className="flex items-center justify-center mt-4">
                                <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                  <span className="text-sm text-blue-600 animate-pulse">🤖 Analyzing...</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Review View */}
                        {answerState?.isValidated && answerState.pronunciationScore !== undefined && (
                          <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
                            showReviewView[question.id] ? 'translate-y-0' : 'translate-y-full'
                          }`}>
                            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 flex flex-col h-full">
                              <style jsx>{`
                                .review-scrollable::-webkit-scrollbar {
                                  width: 8px;
                                }
                                .review-scrollable::-webkit-scrollbar-track {
                                  background: #E5E7EB;
                                  border-radius: 4px;
                                }
                                .review-scrollable::-webkit-scrollbar-thumb {
                                  background: #9CA3AF;
                                  border-radius: 4px;
                                }
                                .review-scrollable::-webkit-scrollbar-thumb:hover {
                                  background: #6B7280;
                                }
                              `}</style>
                              {/* Scrollable Content */}
                              <div 
                                className="p-6 review-scrollable" 
                                style={{ 
                                  flex: 1,
                                  overflowY: 'scroll',
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: '#9CA3AF #E5E7EB'
                                }}
                              >
                                {/* Language Mismatch Warning */}
                                {answerState.languageMismatch && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-center mb-2">
                                    <span className="text-red-600 text-xl mr-2">⚠️</span>
                                    <span className="font-semibold text-red-800">Language Mismatch Detected!</span>
                                  </div>
                                  <p className="text-sm text-red-700">
                                    {answerState.detectedLanguage ? 
                                      `It sounds like you spoke in ${getLanguageName(answerState.detectedLanguage)} instead of ${getLanguageName(question.language || 'en')}.` :
                                      `Please make sure you're speaking in ${getLanguageName(question.language || 'en')}.`
                                    }
                                  </p>
                                </div>
                              )}
                              
                              {/* Score Display */}
                              <div className="mb-6">
                                <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                                  {/* Score Circle */}
                                  <div className="flex-shrink-0 text-center md:text-left mb-4 md:mb-0">
                                    <button
                                      onClick={() => playFeedbackAudio(answerState.pronunciationFeedback || '')}
                                      className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 cursor-pointer"
                                      title="Click to play feedback"
                                    >
                                      {answerState.pronunciationScore}/100
                                    </button>
                                  </div>
                                  
                                  {/* Feedback Text */}
                                  <div className="flex-1">
                                    {answerState.pronunciationFeedback && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                                          <span className="mr-2">💬</span>
                                          AI Feedback:
                                          {isReadingFeedback && (
                                            <div className="ml-3 flex items-center">
                                              <Speaker className="w-4 h-4 text-green-600 animate-pulse mr-1" />
                                              <span className="text-xs text-green-600 animate-pulse">Playing...</span>
                                            </div>
                                          )}
                                        </h4>
                                        <p className="text-green-800">{answerState.pronunciationFeedback}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Detailed Analysis */}
                              <div className="space-y-4">
                                {/* What I heard */}
                                {answerState.pronunciationTranscript && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                                      <span className="mr-2">👂</span>
                                      What I heard you say:
                                    </h4>
                                    <p className="text-blue-800 font-mono text-lg">{answerState.pronunciationTranscript}</p>
                                  </div>
                                )}


                                {/* Issues to work on */}
                                {answerState.pronunciationIssues && answerState.pronunciationIssues.length > 0 && (
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                                      <span className="mr-2">🎯</span>
                                      Areas to improve:
                                    </h4>
                                    <ul className="text-orange-800 space-y-1">
                                      {answerState.pronunciationIssues.map((issue, index) => (
                                        <li key={index} className="flex items-start">
                                          <span className="mr-2 text-orange-600">•</span>
                                          {issue}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Tips for improvement */}
                                {answerState.pronunciationTips && answerState.pronunciationTips.length > 0 && (
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                                      <span className="mr-2">💡</span>
                                      Tips to help you:
                                    </h4>
                                    <ul className="text-purple-800 space-y-1">
                                      {answerState.pronunciationTips.map((tip, index) => (
                                        <li key={index} className="flex items-start">
                                          <span className="mr-2 text-purple-600">•</span>
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Validation Button/Result */}
                  {answerState?.answer && !answerState.isValidated && question.type !== 'pronunciation' && (
                    <button
                      onClick={() => validateAnswer(question.id, answerState.answer)}
                      disabled={isValidating}
                      className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Check Answer
                        </>
                      )}
                    </button>
                  )}

                  

                  {/* Feedback for non-pronunciation questions */}
                  {answerState?.isValidated && question.type !== 'pronunciation' && (
                    <div className={`p-4 rounded-lg border ${
                      answerState.isCorrect 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}>
                      <div className="flex items-center mb-2">
                        {answerState.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                        ) : (
                          <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                        )}
                        <span className="font-medium">
                          {answerState.isCorrect ? 'Excellent!' : 'Good try!'}
                        </span>
                        {answerState.points && (
                          <span className="ml-auto font-bold">+{answerState.points} XP</span>
                        )}
                      </div>
                      <p className="text-sm">{answerState.feedback}</p>
                    </div>
                  )}

                </div>
              )
            })()}

            {/* Complete Button */}
            {questions.every(q => answers[q.id]?.isValidated) && !isCompleted && (
              <div className="text-center">
                <button
                  onClick={completeStepTwo}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Trophy className="w-5 h-5 inline mr-2" />
                  Complete Tutorial!
                </button>
              </div>
            )}

            {/* Completion & Generate More */}
            {isCompleted && showGenerateMore && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h2>
                <p className="text-gray-600 mb-6">You've completed this tutorial!</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/tutorials')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    More Tutorials
                  </button>
                  <button
                    onClick={generateSimilarTutorial}
                    disabled={isValidating}
                    className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Generate Similar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Achievement Modal */}
      {newAchievement && (
        <AchievementModal 
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
      
      {/* Voice Settings Modal */}
      {user && player && (
        <UnifiedVoiceSettingsModal
          user={user}
          playerPreferences={player.player_preferences || {}}
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          onPreferencesUpdate={(updatedPreferences) => {
            setPlayer({ ...player, player_preferences: updatedPreferences })
            
            // Update local voice settings for immediate use
            const voicePrefs = updatedPreferences.voice_settings
            const advancedPrefs = updatedPreferences.advanced_voice_settings
            if (voicePrefs || advancedPrefs) {
              setVoiceSettings({
                voice_id: voicePrefs?.voice_id || voiceSettings.voice_id,
                voice_name: voicePrefs?.voice_name || voiceSettings.voice_name,
                preset: advancedPrefs?.preset || voiceSettings.preset,
                stability: advancedPrefs?.stability || voiceSettings.stability,
                similarity_boost: advancedPrefs?.similarity_boost || voiceSettings.similarity_boost,
                style: advancedPrefs?.style || voiceSettings.style,
                use_speaker_boost: advancedPrefs?.use_speaker_boost || voiceSettings.use_speaker_boost
              })
            }
          }}
        />
      )}
    </div>
  )
}