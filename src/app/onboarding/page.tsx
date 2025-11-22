'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Check } from 'lucide-react'
import { mockVoicesData } from '@/data/mock-voices'
import VoiceSelector from '@/components/VoiceSelector'
import { VoiceOption } from '@/lib/voice-utils'
import AppHeader from '@/components/AppHeader'

const animalNames = ['Dragon', 'Phoenix', 'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Bear', 'Shark', 'Raven']
const superheroes = ['Captain', 'Shadow', 'Thunder', 'Lightning', 'Storm', 'Blaze', 'Frost', 'Nova', 'Viper', 'Hawk']

const generateRandomNickname = () => {
  const prefix = Math.random() > 0.5 ? animalNames : superheroes
  const name = prefix[Math.floor(Math.random() * prefix.length)]
  const number = Math.floor(Math.random() * 99999) + 100
  return `${name}${number}`
}

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(mockVoicesData.voices[0] as VoiceOption)
  const [currentPlayerPreferences, setCurrentPlayerPreferences] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      setNickname(generateRandomNickname())

      // Get current player preferences if they exist
      const { data: playerData } = await supabase
        .from('players')
        .select('player_preferences')
        .eq('id', user.id)
        .single()

      if (playerData?.player_preferences) {
        setCurrentPlayerPreferences(playerData.player_preferences)
        // If onboarding is already completed, redirect to dashboard
        if (playerData.player_preferences.onboarding_completed) {
          router.push('/dashboard')
          return
        }
      }
    }

    getUser()
  }, [router])

  const savePreferences = async () => {
    if (!user) {
      console.error('No user found')
      return
    }

    setSaving(true)
    try {
      const preferences = {
        ...currentPlayerPreferences,
        voice_settings: {
          voice_name: selectedVoice.name,
          voice_id: selectedVoice.voice_id,
          is_custom: selectedVoice.is_custom || false
        },
        onboarding_completed: true,
        nickname: nickname
      }

      console.log('Saving preferences:', preferences)

      const { data, error } = await supabase
        .from('players')
        .update({ 
          player_preferences: preferences,
          username: nickname
        })
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Preferences saved successfully:', data)

      // Navigate to dashboard
      console.log('Redirecting to dashboard...')
      
      // Use window.location as a more reliable redirect
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      alert(`Failed to save preferences: ${error.message || 'Unknown error'}. Please try again.`)
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {user && (
        <AppHeader
          user={user}
          title="Welcome to AiBubu!"
          showBackButton={false}
        />
      )}

      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Let's get you started!</h2>
              <p className="text-gray-600 mb-6">First, what should we call you?</p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your nickname"
              />
              <button
                onClick={() => setNickname(generateRandomNickname())}
                className="text-blue-500 text-sm hover:text-blue-600"
              >
                Generate random nickname
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                disabled={!nickname.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
              >
                Next: Choose Voice
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose Your AI Voice</h2>
              <p className="text-gray-600 mb-6">Pick a voice that AiBubu will use to talk to you!</p>
            </div>

            <VoiceSelector
              selectedVoiceId={selectedVoice.voice_id}
              onVoiceSelect={setSelectedVoice}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  console.log('Complete Setup button clicked!')
                  savePreferences()
                }}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
              >
                {saving ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}