'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Settings, Volume2, Mic, Play, Pause, X, Star, Brain, Sparkles } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import VoiceSelector from '@/components/VoiceSelector'
import { mockVoicesData } from '@/data/mock-voices'
import { VoiceOption } from '@/lib/voice-utils'

// AiBubu UI Components
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

export default function VoiceSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(mockVoicesData.voices[0] as VoiceOption)
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)

      // Get player data
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (playerData) {
        setPlayer(playerData)
        
        // Load current voice settings
        const preferences = playerData.player_preferences || {}
        if (preferences.voice_settings) {
          const voiceId = preferences.voice_settings.voice_id
          const foundVoice = mockVoicesData.voices.find(v => v.voice_id === voiceId)
          if (foundVoice) {
            setSelectedVoice(foundVoice as VoiceOption)
          }
          
          // Load advanced settings if they exist
          if (preferences.voice_settings.advanced_settings) {
            setVoiceSettings(preferences.voice_settings.advanced_settings)
          }
        }
      }
      
      setLoading(false)
    }

    getUser()
  }, [router])

  const testVoice = async () => {
    // Test the current voice with a sample phrase
    const testText = "Hello! This is how I sound with your current settings."
    
    try {
      // Use Web Speech API as fallback for testing
      const utterance = new SpeechSynthesisUtterance(testText)
      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Error testing voice:', error)
    }
  }

  const saveSettings = async () => {
    if (!user || !player) return

    setSaving(true)
    try {
      const currentPreferences = player.player_preferences || {}
      const updatedPreferences = {
        ...currentPreferences,
        voice_settings: {
          voice_name: selectedVoice.name,
          voice_id: selectedVoice.voice_id,
          is_custom: selectedVoice.is_custom || false,
          advanced_settings: voiceSettings
        }
      }

      const { error } = await supabase
        .from('players')
        .update({ player_preferences: updatedPreferences })
        .eq('id', user.id)

      if (error) throw error

      // Navigate back to previous page
      router.back()
    } catch (error) {
      console.error('Error saving voice settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {user && (
        <AppHeader
          user={user}
          title="🎤 Voice Settings"
          subtitle="Customize how AiBubu sounds!"
          showBackButton={true}
        />
      )}

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Voice Selection */}
        <KidCard className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800">Choose Voice</h3>
              <p className="text-gray-600">Pick the perfect voice for AiBubu</p>
            </div>
          </div>

          <VoiceSelector
            selectedVoiceId={selectedVoice.voice_id}
            onVoiceSelect={setSelectedVoice}
            playerPreferences={player?.player_preferences}
          />
        </KidCard>

        {/* Advanced Settings */}
        <KidCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Advanced Settings</h3>
                <p className="text-gray-600">Fine-tune voice characteristics</p>
              </div>
            </div>
            
            <KidButton 
              variant="secondary" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Brain className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </KidButton>
          </div>

          {showAdvanced && (
            <div className="space-y-6 border-t border-gray-200 pt-6">
              {/* Stability */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Voice Stability</label>
                  <span className="text-base text-gray-500 font-mono">{voiceSettings.stability.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.stability}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, stability: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Variable</span>
                  <span>Stable</span>
                </div>
              </div>

              {/* Style */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Style Exaggeration</label>
                  <span className="text-base text-gray-500 font-mono">{voiceSettings.style.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.style}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, style: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Neutral</span>
                  <span>Exaggerated</span>
                </div>
              </div>

              {/* Similarity Boost */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Similarity Boost</label>
                  <span className="text-base text-gray-500 font-mono">{voiceSettings.similarity_boost.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.similarity_boost}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, similarity_boost: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}
        </KidCard>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <KidButton variant="success" onClick={testVoice} size="lg">
            <Volume2 className="w-5 h-5 mr-2" />
            Test Current Settings
          </KidButton>
          
          <KidButton 
            variant="primary" 
            onClick={saveSettings} 
            size="lg"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
            <Sparkles className="w-5 h-5 ml-2" />
          </KidButton>
        </div>
      </main>
    </div>
  )
}