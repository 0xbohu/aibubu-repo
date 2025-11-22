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
  ChevronLeft,
  ChevronRight,
  Send,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Mic,
  MicOff,
  Play,
  Volume2,
  Home,
  VolumeX,
  Speaker
} from 'lucide-react'

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

export default function EnhancedTutorialClassicPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tutorial, setTutorial] = useState<Tutorial | null>(null)
  const [currentStep, setCurrentStep] = useState(0) // 0: content screens, 1: questions, 2: completion
  const [currentScreen, setCurrentScreen] = useState(0)
  const [answers, setAnswers] = useState<AnswerState>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [showGenerateMore, setShowGenerateMore] = useState(false)

  // Speech-related state
  const [isRecording, setIsRecording] = useState(false)
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
      const response = await fetch('/api/elevenlabs-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: 'JBFqnCBsd6RMkjVDRZzb', // Child-friendly female voice
          model_id: 'eleven_flash_v2_5', // Fastest model
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: false
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
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)
      
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
        setIsRecording(false)
      }
      
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Please allow microphone access to practice pronunciation')
    }
  }

  // Stop recording and validate function
  const stopRecordingAndValidate = async (questionId: string, question: any) => {
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
          setIsRecording(false)
          resolve(audioBlob)
        }
        
        mediaRecorder.stop()
      })
      
      // Stop the audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
        setAudioStream(null)
      }
      
      // Wait for recording to complete, then validate
      const audioBlob = await recordingPromise
      validatePronunciation(questionId, question, audioBlob)
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
    setIsRecording(false)
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

      // Automatically read the AI feedback aloud
      await readAIFeedbackAloud(validation)

    } catch (error) {
      console.error('Error validating pronunciation:', error)
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          pronunciationFeedback: 'Sorry, there was an error validating your pronunciation. Please try again.'
        }
      }))
      
      // Even on error, provide encouraging audio feedback
      try {
        await speakText('Sorry, there was an error. Please try recording again!', 'en')
      } catch (speechError) {
        console.error('Error with error feedback speech:', speechError)
      }
    } finally {
      setIsValidatingPronunciation(false)
      setValidatingQuestionId(null)
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{tutorial.title} - Classic View</h1>
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              
              <div className="h-6 w-px bg-gray-300" />
            </div>

            <div className="flex items-center space-x-3">
              {/* Progress indicator */}
              <div className="flex items-center space-x-2">
                {contentScreens.length > 0 && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  <HelpCircle className="w-4 h-4" />
                </div>
                {isCompleted && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Dashboard return button */}
              <div className="h-6 w-px bg-gray-300" />
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
                title="Return to Dashboard"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Step 1: Chat-style Tutorial Introduction */}
        {currentStep === 0 && (
          <div className="max-w-2xl mx-auto">
            {/* Aibubu Character Introduction */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <img src="/aibubu-logo.svg" alt="Aibubu" className="w-12 h-12" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 rounded-2xl rounded-tl-sm p-4 relative">
                    <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-blue-50 border-b-8 border-b-transparent"></div>
                    <h3 className="font-bold text-blue-900 mb-2">Hi there! I'm Aibubu! 👋</h3>
                    <p className="text-gray-700 mb-3">
                      Welcome to <strong>{tutorial.title}</strong>! I'm excited to help you learn today.
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => speakText(`Hi there! I'm Aibubu! Welcome to ${tutorial.title}! I'm excited to help you learn today.`)}
                        className="flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm text-blue-700 transition-colors"
                      >
                        <Volume2 className="w-4 h-4 mr-1" />
                        Listen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <img src="/aibubu-logo.svg" alt="Aibubu" className="w-12 h-12" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-green-50 rounded-2xl rounded-tl-sm p-4 relative">
                    <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-green-50 border-b-8 border-b-transparent"></div>
                    <h3 className="font-bold text-green-900 mb-3">What you'll learn today: 🎯</h3>
                    <div className="space-y-2">
                      {(tutorial.learning_objectives || []).map((objective, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span className="text-gray-700">{objective}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={() => speakText(`What you'll learn today: ${(tutorial.learning_objectives || []).join('. ')}`)}
                        className="flex items-center px-3 py-1 bg-green-100 hover:bg-green-200 rounded-lg text-sm text-green-700 transition-colors"
                      >
                        <Volume2 className="w-4 h-4 mr-1" />
                        Listen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tutorial Content (if any) */}
            {contentScreens.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <img src="/aibubu-logo.svg" alt="Aibubu" className="w-12 h-12" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-purple-50 rounded-2xl rounded-tl-sm p-4 relative">
                      <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-purple-50 border-b-8 border-b-transparent"></div>
                      <h3 className="font-bold text-purple-900 mb-3">Let me explain: 📚</h3>
                      <div className="space-y-3 mb-3">
                        {contentScreens.map((screen, index) => (
                          <div key={index}>
                            {screen.title && (
                              <h4 className="font-semibold text-purple-800 mb-1">{screen.title}</h4>
                            )}
                            <p className="text-gray-700">{screen.content}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => speakText(`Let me explain. ${contentScreens.map(screen => `${screen.title || ''}. ${screen.content}`).join('. ')}`)}
                          className="flex items-center px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-lg text-sm text-purple-700 transition-colors"
                        >
                          <Volume2 className="w-4 h-4 mr-1" />
                          Listen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ready to Start */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <img src="/aibubu-logo.svg" alt="Aibubu" className="w-12 h-12" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-yellow-50 rounded-2xl rounded-tl-sm p-4 relative">
                    <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-yellow-50 border-b-8 border-b-transparent"></div>
                    <h3 className="font-bold text-yellow-900 mb-2">Ready to get started? 🚀</h3>
                    <p className="text-gray-700 mb-4">
                      Great! Now let's put your knowledge to the test. I've prepared some {tutorial.tutorial_type === 'speaking' ? 'pronunciation challenges' : 'questions'} for you. You can earn up to <strong>{tutorial.points_reward} XP</strong>!
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <button
                                                 onClick={() => speakText(`Ready to get started? Great! Now let's put your knowledge to the test. I've prepared some ${tutorial.tutorial_type === 'speaking' ? 'pronunciation challenges' : 'questions'} for you. You can earn up to ${tutorial.points_reward} XP!`)}
                        className="flex items-center px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-sm text-yellow-700 transition-colors"
                      >
                        <Volume2 className="w-4 h-4 mr-1" />
                        Listen
                      </button>
                      
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
                      >
                        Let's Start!
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Time to Answer!</h2>
              <p className="text-gray-600">Show what you've learned</p>
            </div>

            {/* Temperature Slider for Speaking Tutorials */}
            {tutorial.tutorial_type === 'speaking' && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-1">AI Temperature</h3>
                    <p className="text-sm text-blue-600">Temperature is a parameter that controls the AI output</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-700">{temperature.toFixed(1)}</span>
                    <p className="text-xs text-blue-500">
                      {temperature < 0.3 ? 'Conservative' : temperature < 0.7 ? 'Balanced' : 'Creative'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600 min-w-fit">0.1</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="flex-1 h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(temperature - 0.1) / 0.9 * 100}%, #dbeafe ${(temperature - 0.1) / 0.9 * 100}%, #dbeafe 100%)`
                    }}
                  />
                  <span className="text-sm font-medium text-gray-600 min-w-fit">1.0</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Lower values give more consistent responses • Higher values give more creative and varied feedback
                </div>
              </div>
            )}

            {questions.map((question, index) => {
              const answerState = answers[question.id]
              
              return (
                <div key={question.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        Question {index + 1}
                      </h3>
                      {question.type !== 'pronunciation' && (
                        <button
                          onClick={() => speakText(`Question ${index + 1}. ${question.question}`)}
                          className="flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm text-blue-700 transition-colors"
                        >
                          <Volume2 className="w-4 h-4 mr-1" />
                          Listen
                        </button>
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
                    <div className="space-y-4 mb-4">
                      {/* Target word/phrase display */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-blue-800 mb-2">
                            {question.instruction || `Say: "${question.word || question.phrase}"`}
                          </h4>
                          {question.phonetic && (
                            <p className="text-blue-600 text-sm mb-3">
                              Pronunciation: <span className="font-mono">{question.phonetic}</span>
                            </p>
                          )}
                          
                          <div className="flex justify-center space-x-2 mb-3">
                            {/* Listen to instruction button */}
                            {question.instruction && (
                              <button
                                                                 onClick={() => speakText(question.instruction || '', question.language || 'en-US')}
                                className="flex items-center bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
                              >
                                <Volume2 className="w-4 h-4 mr-1" />
                                Instruction
                              </button>
                            )}
                            
                            {/* Listen to target word/phrase button */}
                            <button
                              onClick={() => speakText(
                                question.word || question.phrase || '', 
                                question.language || 'en-US'
                              )}
                              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <Volume2 className="w-4 h-4 mr-2" />
                              Listen to Word
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Recording interface */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-center">
                          <p className="text-gray-600 mb-2">Record yourself saying the word:</p>
                          {isValidatingPronunciation && validatingQuestionId === question.id ? (
                            <p className="text-xs text-blue-600 mb-3 animate-pulse">
                              🤖 Analyzing your pronunciation with AI...
                            </p>
                          ) : !isRecording && recordedAudio ? (
                            <p className="text-xs text-green-600 mb-3">
                              ✅ Recording complete! Click "Stop Recording" to analyze.
                            </p>
                          ) : isRecording ? (
                            <p className="text-xs text-red-600 mb-3 animate-pulse">
                              🔴 Recording... Speak clearly into the microphone
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mb-3">
                              🎤 Click "Start Recording" to begin pronunciation practice
                            </p>
                          )}
                          
                          <div className="flex justify-center items-center space-x-3">
                            {!isRecording ? (
                              <button
                                onClick={() => startRecording()}
                                disabled={isValidatingPronunciation && validatingQuestionId === question.id}
                                className="flex items-center bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Mic className="w-5 h-5 mr-2" />
                                {isValidatingPronunciation && validatingQuestionId === question.id ? 'Analyzing...' : 'Start Recording'}
                              </button>
                            ) : (
                              <button
                                onClick={() => stopRecordingAndValidate(question.id, question)}
                                className="flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors animate-pulse"
                              >
                                <MicOff className="w-5 h-5 mr-2" />
                                Stop Recording
                              </button>
                            )}
                            
                            {/* Small replay button for recorded audio */}
                            {recordedAudioUrl && !isRecording && (
                              <button
                                onClick={() => {
                                  const audio = new Audio(recordedAudioUrl)
                                  audio.play()
                                }}
                                className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                title="Play my recording"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          
                          {isRecording && (
                            <p className="text-red-600 text-sm mt-2 animate-pulse">
                              🔴 Recording... Speak clearly!
                            </p>
                          )}
                        </div>
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
                          <Send className="w-4 h-4 mr-2" />
                          Check Answer
                        </>
                      )}
                    </button>
                  )}

                  

                  {/* Feedback */}
                  {answerState?.isValidated && (
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
                      
                      {/* Pronunciation-specific feedback */}
                      {question.type === 'pronunciation' && (
                        <>
                          {isValidatingPronunciation ? (
                            <div className="mb-3">
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-sm text-gray-600">Analyzing your pronunciation...</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="h-2 bg-blue-300 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          ) : answerState.pronunciationScore !== undefined ? (
                            <div className="mb-3">
                              {/* Language Mismatch Warning */}
                              {answerState.languageMismatch && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-center mb-1">
                                    <span className="text-red-600 text-lg mr-2">⚠️</span>
                                    <span className="font-semibold text-red-800">Language Mismatch Detected!</span>
                                  </div>
                                  <p className="text-sm text-red-700">
                                    {answerState.detectedLanguage ? 
                                      `It sounds like you spoke in ${getLanguageName(answerState.detectedLanguage)} instead of ${getLanguageName(question.language || 'en')}.` :
                                      `Please make sure you're speaking in ${getLanguageName(question.language || 'en')}.`
                                    }
                                  </p>
                                  <p className="text-xs text-red-600 mt-1">
                                    Try again using the correct language for the best results.
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Pronunciation Score:</span>
                                <span className="font-bold text-lg">{answerState.pronunciationScore}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                <div 
                                  className={`h-2 rounded-full ${
                                    answerState.languageMismatch ? 'bg-red-500' :
                                    answerState.pronunciationScore >= 80 ? 'bg-green-500' :
                                    answerState.pronunciationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${answerState.pronunciationScore}%` }}
                                ></div>
                              </div>

                              {/* Detailed LLM Analysis */}
                              <div className="space-y-4">
                                {/* What I heard */}
                                {answerState.pronunciationTranscript && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-blue-900 mb-1 flex items-center">
                                      <span className="mr-2">👂</span>
                                      What I heard you say:
                                    </h4>
                                    <p className="text-blue-800 font-mono text-sm">{answerState.pronunciationTranscript}</p>
                                  </div>
                                )}

                                {/* AI Feedback */}
                                {answerState.pronunciationFeedback && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-green-900 mb-2 flex items-center justify-between">
                                      <div className="flex items-center">
                                        <span className="mr-2">💬</span>
                                        AI Feedback:
                                        {isReadingFeedback && (
                                          <div className="ml-3 flex items-center">
                                            <Speaker className="w-4 h-4 text-green-600 animate-pulse mr-1" />
                                            <span className="text-xs text-green-600 animate-pulse">Speaking...</span>
                                          </div>
                                        )}
                                      </div>
                                      {isReadingFeedback && (
                                        <button
                                          onClick={stopFeedbackAudio}
                                          className="flex items-center px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                                          title="Stop audio feedback"
                                        >
                                          <VolumeX className="w-3 h-3 mr-1" />
                                          Stop
                                        </button>
                                      )}
                                    </h4>
                                    <p className="text-green-800 text-sm">{answerState.pronunciationFeedback}</p>
                                  </div>
                                )}

                                {/* Issues to work on */}
                                {answerState.pronunciationIssues && answerState.pronunciationIssues.length > 0 && (
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                                      <span className="mr-2">🎯</span>
                                      Areas to improve:
                                    </h4>
                                    <ul className="text-orange-800 text-sm space-y-1">
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
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                                      <span className="mr-2">💡</span>
                                      Tips to help you:
                                    </h4>
                                    <ul className="text-purple-800 text-sm space-y-1">
                                      {answerState.pronunciationTips.map((tip, index) => (
                                        <li key={index} className="flex items-start">
                                          <span className="mr-2 text-purple-600">•</span>
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Language Detection Info */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                    <span className="mr-2">🌍</span>
                                    Language Analysis:
                                  </h4>
                                  <div className="text-sm text-gray-700 space-y-1">
                                    <p>
                                      <span className="font-medium">Expected:</span> {getLanguageName(question.language || 'en')}
                                    </p>
                                    <p>
                                      <span className="font-medium">Detected:</span> {getLanguageName(answerState.detectedLanguage || 'en')}
                                      {!answerState.languageMismatch && <span className="ml-2 text-green-600">✓</span>}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                      
                      {isValidatingPronunciation ? (
                        <div className="text-sm text-gray-500 italic">
                          Please wait while we analyze your pronunciation...
                        </div>
                      ) : (
                        <p className="text-sm">{answerState.feedback}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

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
    </div>
  )
}