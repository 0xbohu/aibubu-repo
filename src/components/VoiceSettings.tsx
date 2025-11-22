'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Settings, Crown, RefreshCw } from 'lucide-react'
import VoiceSelector from './VoiceSelector'
import { VoiceOption, getAllAvailableVoices } from '@/lib/voice-utils'

interface VoiceSettingsProps {
  user: User
  playerPreferences: any
  onPreferencesUpdate: (preferences: any) => void
}

export default function VoiceSettings({ user, playerPreferences, onPreferencesUpdate }: VoiceSettingsProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshingVoices, setRefreshingVoices] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([])

  useEffect(() => {
    // Initialize selected voice from preferences
    const voiceSettings = playerPreferences?.voice_settings
    if (voiceSettings) {
      const voices = getAllAvailableVoices(playerPreferences)
      const currentVoice = voices.find(v => v.voice_id === voiceSettings.voice_id)
      if (currentVoice) {
        setSelectedVoice(currentVoice)
      }
    }
    
    setAvailableVoices(getAllAvailableVoices(playerPreferences))
  }, [playerPreferences])

  const refreshCustomVoices = async () => {
    setRefreshingVoices(true)
    try {
      const response = await fetch('/api/get-custom-voices')
      if (response.ok) {
        const data = await response.json()
        
        // Update player preferences with latest custom voices
        const updatedPreferences = {
          ...playerPreferences,
          available_custom_voices: data.custom_voices
        }

        // Update in database
        await supabase
          .from('players')
          .update({ player_preferences: updatedPreferences })
          .eq('id', user.id)

        onPreferencesUpdate(updatedPreferences)
        setAvailableVoices(getAllAvailableVoices(updatedPreferences))
      }
    } catch (error) {
      console.error('Error refreshing custom voices:', error)
    } finally {
      setRefreshingVoices(false)
    }
  }

  const handleVoiceChange = async (voice: VoiceOption) => {
    setSelectedVoice(voice)
    setLoading(true)

    try {
      const voiceSettings = {
        voice_id: voice.voice_id,
        voice_name: voice.name,
        is_custom: voice.is_custom || false
      }

      const updatedPreferences = {
        ...playerPreferences,
        voice_settings: voiceSettings
      }

      // Update in database
      const { error } = await supabase
        .from('players')
        .update({ player_preferences: updatedPreferences })
        .eq('id', user.id)

      if (error) throw error

      onPreferencesUpdate(updatedPreferences)
    } catch (error) {
      console.error('Error updating voice settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Voice Settings</h3>
        </div>
        
        <button
          onClick={refreshCustomVoices}
          disabled={refreshingVoices}
          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingVoices ? 'animate-spin' : ''}`} />
          <span>Refresh Custom Voices</span>
        </button>
      </div>

      {selectedVoice && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎤</div>
            <div>
              <div className="font-medium text-blue-800 flex items-center">
                Current Voice: {selectedVoice.name}
                {selectedVoice.is_custom && <Crown className="w-4 h-4 ml-2 text-purple-500" />}
              </div>
              <div className="text-sm text-blue-600 capitalize">
                {selectedVoice.labels.gender}, {selectedVoice.labels.accent}
                {selectedVoice.is_custom && ' • Custom Voice'}
              </div>
            </div>
          </div>
        </div>
      )}

      <VoiceSelector
        selectedVoiceId={selectedVoice?.voice_id || ''}
        onVoiceSelect={handleVoiceChange}
        playerPreferences={playerPreferences}
      />

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-blue-600">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            <span>Updating voice settings...</span>
          </div>
        </div>
      )}
    </div>
  )
}