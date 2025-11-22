'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { X, Settings, Crown, RefreshCw, Mic, Plus, Play, Volume2 } from 'lucide-react'
import VoiceSelector from './VoiceSelector'
import { VoiceOption, getAllAvailableVoices } from '@/lib/voice-utils'

interface VoiceSettingsModalProps {
  user: User
  playerPreferences: any
  isOpen: boolean
  onClose: () => void
  onPreferencesUpdate: (preferences: any) => void
}

export default function VoiceSettingsModal({ 
  user, 
  playerPreferences, 
  isOpen, 
  onClose, 
  onPreferencesUpdate 
}: VoiceSettingsModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshingVoices, setRefreshingVoices] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([])
  const [showCreateVoice, setShowCreateVoice] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [customVoiceBlob, setCustomVoiceBlob] = useState<Blob | null>(null)
  const [customVoiceUrl, setCustomVoiceUrl] = useState<string>('')
  const [isCreatingCustomVoice, setIsCreatingCustomVoice] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
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
    } else {
      // Reset state when modal closes
      setShowCreateVoice(false)
      setCustomVoiceBlob(null)
      setCustomVoiceUrl('')
      setIsRecording(false)
      setRecordingTime(0)
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }
    }
  }, [isOpen, playerPreferences, recordingTimer])

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setCustomVoiceBlob(blob)
        setCustomVoiceUrl(URL.createObjectURL(blob))
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)

      // Auto-stop after 20 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
          stream.getTracks().forEach(track => track.stop())
          setIsRecording(false)
          clearInterval(timer)
          setRecordingTimer(null)
        }
      }, 20000)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
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

  const createCustomVoice = async () => {
    if (!customVoiceBlob) return

    setIsCreatingCustomVoice(true)
    try {
      const formData = new FormData()
      formData.append('audio', customVoiceBlob, 'voice_sample.wav')
      formData.append('name', `${user.email?.split('@')[0]}_voice_${Date.now()}`)
      formData.append('description', `Custom voice for ${user.email}`)

      const response = await fetch('/api/elevenlabs-voice-clone', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update player preferences with new custom voice
        const updatedPreferences = {
          ...playerPreferences,
          custom_voice_data: data.voice_data
        }

        // Update in database
        await supabase
          .from('players')
          .update({ player_preferences: updatedPreferences })
          .eq('id', user.id)

        onPreferencesUpdate(updatedPreferences)
        setAvailableVoices(getAllAvailableVoices(updatedPreferences))
        
        // Auto-select the new voice
        setSelectedVoice(data.voice_data)
        
        // Reset creation UI
        setShowCreateVoice(false)
        setCustomVoiceBlob(null)
        setCustomVoiceUrl('')
      } else {
        throw new Error('Failed to create custom voice')
      }
    } catch (error) {
      console.error('Error creating custom voice:', error)
    } finally {
      setIsCreatingCustomVoice(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-800">Voice Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Current Voice Display */}
          {selectedVoice && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🎤</div>
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={refreshCustomVoices}
              disabled={refreshingVoices}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingVoices ? 'animate-spin' : ''}`} />
              <span>Refresh Custom Voices</span>
            </button>

            <button
              onClick={() => setShowCreateVoice(!showCreateVoice)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Voice</span>
            </button>
          </div>

          {/* Voice Creation Section */}
          {showCreateVoice && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <h3 className="font-semibold text-purple-700 mb-4">✨ Create Custom Voice</h3>
              
              {!customVoiceBlob ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center font-bold transition-all duration-300 transform ${
                          isRecording
                            ? 'bg-red-500 text-white scale-110 shadow-lg animate-pulse'
                            : 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-105 shadow-md'
                        }`}
                      >
                        <Mic className="w-8 h-8" />
                      </button>
                      
                      {isRecording && (
                        <>
                          <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-75"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>
                        </>
                      )}
                    </div>
                    
                    <div className="text-center">
                      {isRecording ? (
                        <div className="space-y-2">
                          <p className="text-red-600 font-semibold">🎙️ Recording...</p>
                          <div className="text-2xl font-mono font-bold text-red-600">
                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      ) : (
                        <p className="text-purple-600 font-semibold">Tap to record your voice</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-green-300 flex items-center justify-center mx-auto mb-3">
                      <Mic className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-green-600 font-semibold">Recording Complete!</p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setCustomVoiceBlob(null)
                        setCustomVoiceUrl('')
                      }}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Re-record
                    </button>
                    
                    <button
                      onClick={createCustomVoice}
                      disabled={isCreatingCustomVoice}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                    >
                      {isCreatingCustomVoice ? 'Creating...' : '✨ Create Voice'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice Selector */}
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

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Done
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}