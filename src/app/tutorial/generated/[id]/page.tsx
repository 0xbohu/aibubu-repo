'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { checkAchievements, type Achievement } from '@/lib/achievements'
import AchievementModal from '@/components/AchievementModal'
import { 
  ArrowLeft, 
  Check, 
  Star, 
  Lightbulb,
  Sparkles,
  Trophy,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  BookOpen,
  HelpCircle,
  CheckCircle2
} from 'lucide-react'

type GeneratedTutorial = {
  id: string
  base_tutorial_id: string
  player_id: string
  generated_content: {
    screens: Array<{
      type: 'content' | 'instruction'
      title: string
      content: string
      image?: string
    }>
  }
  generated_questions: {
    questions: Array<{
      id: string
      type: 'multiple_choice' | 'input' | 'textarea'
      question: string
      options?: string[]
      correct?: string
      min_words?: number
    }>
  }
  points_awarded: number
  created_at: string
}

type BaseTutorial = {
  title: string
  tutorial_type: 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent'
  age_min: number
  age_max: number
  difficulty_level: number
}

type AnswerState = {
  [questionId: string]: {
    answer: string
    isValidated: boolean
    isCorrect?: boolean
    feedback?: string
    points?: number
  }
}

export default function GeneratedTutorialPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tutorial, setTutorial] = useState<GeneratedTutorial | null>(null)
  const [baseTutorial, setBaseTutorial] = useState<BaseTutorial | null>(null)
  const [currentStep, setCurrentStep] = useState(0) // 0: content screens, 1: questions, 2: completion
  const [currentScreen, setCurrentScreen] = useState(0)
  const [answers, setAnswers] = useState<AnswerState>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Load generated tutorial
      const { data: tutorialData } = await supabase
        .from('generated_tutorials')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (tutorialData) {
        setTutorial(tutorialData as GeneratedTutorial)
        
        // Load base tutorial info
        const { data: baseData } = await supabase
          .from('tutorials')
          .select('title, tutorial_type, age_min, age_max, difficulty_level')
          .eq('id', tutorialData.base_tutorial_id)
          .single()
        
        if (baseData) {
          setBaseTutorial(baseData as BaseTutorial)
        }
      }
      
      setLoading(false)
    }

    initialize()
  }, [params.id, router])

  const validateAnswer = async (questionId: string, answer: string) => {
    if (!tutorial || !baseTutorial) return

    setIsValidating(true)

    try {
      const response = await fetch('/api/validate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorialId: tutorial.base_tutorial_id, // Use base tutorial for context
          questionId,
          answer,
          tutorialType: baseTutorial.tutorial_type
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
        generated_tutorial_id: tutorial.id,
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

  const completeGeneratedTutorial = async () => {
    if (!tutorial || !user) return

    // Calculate total points earned
    const totalPoints = Object.values(answers).reduce((sum, answer) => 
      sum + (answer.points || 0), 0
    )

    // Update generated tutorial as completed
    await supabase
      .from('generated_tutorials')
      .update({ 
        points_awarded: totalPoints,
        completed_at: new Date().toISOString()
      })
      .eq('id', tutorial.id)

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
      tutorialType: baseTutorial?.tutorial_type || 'maths'
    })

    if (achievement && !Array.isArray(achievement)) {
      setNewAchievement(achievement)
    }

    setIsCompleted(true)
  }

  if (loading || !tutorial || !baseTutorial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading generated tutorial...</p>
        </div>
      </div>
    )
  }

  const contentScreens = tutorial.generated_content?.screens || []
  const questions = tutorial.generated_questions?.questions || []

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
              
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  <Sparkles className="w-5 h-5 inline mr-2 text-purple-500" />
                  Generated: {baseTutorial.title}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Ages {baseTutorial.age_min}-{baseTutorial.age_max}</span>
                  <span>•</span>
                  <span className="capitalize">{baseTutorial.tutorial_type}</span>
                  <span>•</span>
                  <span>{tutorial.points_awarded} XP</span>
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Step 1: Content Screens */}
        {currentStep === 0 && contentScreens.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {contentScreens[currentScreen]?.title}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {currentScreen + 1} of {contentScreens.length}
                  </span>
                </div>
                
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {contentScreens[currentScreen]?.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen(Math.max(0, currentScreen - 1))}
                  disabled={currentScreen === 0}
                  className="flex items-center px-4 py-2 text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                {currentScreen < contentScreens.length - 1 ? (
                  <button
                    onClick={() => setCurrentScreen(currentScreen + 1)}
                    className="flex items-center bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Start Questions
                    <ArrowLeft className="w-4 h-4 ml-2 transform rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {(currentStep === 1 || (currentStep === 0 && contentScreens.length === 0)) && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Time to Answer!</h2>
              <p className="text-gray-600">Show what you've learned</p>
            </div>

            {questions.map((question, index) => {
              const answerState = answers[question.id]
              
              return (
                <div key={question.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Question {index + 1}
                    </h3>
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

                  {/* Validation Button/Result */}
                  {answerState?.answer && !answerState.isValidated && (
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
                          {answerState.isCorrect ? 'Correct!' : 'Good try!'}
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
            })}

            {/* Complete Button */}
            {questions.every(q => answers[q.id]?.isValidated) && !isCompleted && (
              <div className="text-center">
                <button
                  onClick={completeGeneratedTutorial}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Trophy className="w-5 h-5 inline mr-2" />
                  Complete Tutorial!
                </button>
              </div>
            )}

            {/* Completion Message */}
            {isCompleted && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h2>
                <p className="text-gray-600 mb-6">You've completed this generated tutorial!</p>
                
                <Link
                  href="/tutorials"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  More Tutorials
                </Link>
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