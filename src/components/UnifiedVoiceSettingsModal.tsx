'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { X, Settings, Crown, RefreshCw, Mic, Plus, Play, Volume2 } from 'lucide-react'
import VoiceSelector from './VoiceSelector'
import { VoiceOption, getAllAvailableVoices } from '@/lib/voice-utils'

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

interface VoiceSettingsModalProps {
  user: User
  playerPreferences: any
  isOpen: boolean
  onClose: () => void
  onPreferencesUpdate: (preferences: any) => void
}

// Preset voice configurations
const VOICE_PRESETS = [
  {
    id: 'friendly_teacher',
    name: '👩‍🏫 Friendly Teacher',
    description: 'Warm and encouraging, perfect for learning',
    settings: {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.3,
      use_speaker_boost: true
    }
  },
  {
    id: 'child_friendly',
    name: '🧒 Child-Friendly',
    description: 'Playful and energetic, great for young learners',
    settings: {
      stability: 0.8,
      similarity_boost: 0.7,
      style: 0.6,
      use_speaker_boost: true
    }
  },
  {
    id: 'professional',
    name: '👔 Professional',
    description: 'Clear and authoritative, ideal for serious topics',
    settings: {
      stability: 0.9,
      similarity_boost: 0.9,
      style: 0.2,
      use_speaker_boost: false
    }
  },
  {
    id: 'storyteller',
    name: '📚 Storyteller',
    description: 'Expressive and dramatic, perfect for narratives',
    settings: {
      stability: 0.5,
      similarity_boost: 0.6,
      style: 0.8,
      use_speaker_boost: true
    }
  }
]

export default function UnifiedVoiceSettingsModal({ 
  user, 
  playerPreferences, 
  isOpen, 
  onClose, 
  onPreferencesUpdate 
}: VoiceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'characters' | 'advanced'>('characters')
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null)
  const [voiceSettings, setVoiceSettings] = useState({
    preset: 'friendly_teacher',
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: true
  })
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
  const [loadingElevenLabsVoices, setLoadingElevenLabsVoices] = useState(false)
  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      // Initialize settings from player preferences
      const savedVoiceSettings = playerPreferences?.voice_settings
      const savedAdvancedSettings = playerPreferences?.advanced_voice_settings
      
      if (savedVoiceSettings) {
        const voices = getAllAvailableVoices(playerPreferences)
        const currentVoice = voices.find(v => v.voice_id === savedVoiceSettings.voice_id)
        if (currentVoice) {
          setSelectedVoice(currentVoice)
        }
      }
      
      if (savedAdvancedSettings) {
        setVoiceSettings(savedAdvancedSettings)
      }
      
      setAvailableVoices(getAllAvailableVoices(playerPreferences))
      fetchElevenLabsVoices()
    } else {
      // Reset state when modal closes
      setActiveTab('characters')
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

  const fetchElevenLabsVoices = async () => {
    setLoadingElevenLabsVoices(true)
    try {
      const response = await fetch('/api/elevenlabs-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '', get_voices_only: true })
      })

      if (response.ok) {
        const data = await response.json()
        setElevenLabsVoices(data.all_voices || [])
      }
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error)
    } finally {
      setLoadingElevenLabsVoices(false)
    }
  }

  const refreshCustomVoices = async () => {
    setRefreshingVoices(true)
    try {
      const response = await fetch('/api/get-custom-voices')
      if (response.ok) {
        const data = await response.json()
        
        const updatedPreferences = {
          ...playerPreferences,
          available_custom_voices: data.custom_voices
        }

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

  const handleAdvancedSettingsChange = async (newSettings: any) => {
    setVoiceSettings(newSettings)
    
    try {
      const updatedPreferences = {
        ...playerPreferences,
        advanced_voice_settings: newSettings
      }

      const { error } = await supabase
        .from('players')
        .update({ player_preferences: updatedPreferences })
        .eq('id', user.id)

      if (error) throw error

      onPreferencesUpdate(updatedPreferences)
    } catch (error) {
      console.error('Error updating advanced voice settings:', error)
    }
  }

  const testVoice = async () => {
    const testText = selectedVoice 
      ? `Hello! I'm ${selectedVoice.name}. This is how I sound with your current settings.`
      : "Hello! This is a test of your current voice settings."

    try {
      const response = await fetch('/api/elevenlabs-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voice_id: selectedVoice?.voice_id || 'JBFqnCBsd6RMkjVDRZzb', // Default voice ID
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style,
            use_speaker_boost: voiceSettings.use_speaker_boost
          }
        })
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.play()
      }
    } catch (error) {
      console.error('Error testing voice:', error)
    }
  }

  // Recording functions (similar to OnboardingModal)
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
      
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)

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
        
        const updatedPreferences = {
          ...playerPreferences,
          custom_voice_data: data.voice_data
        }

        await supabase
          .from('players')
          .update({ player_preferences: updatedPreferences })
          .eq('id', user.id)

        onPreferencesUpdate(updatedPreferences)
        setAvailableVoices(getAllAvailableVoices(updatedPreferences))
        setSelectedVoice(data.voice_data)
        
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
      <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 rounded-3xl shadow-2xl max-w-4xl w-full h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] flex flex-col border-4 border-white">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">🎤 Voice Settings</h2>
                <p className="text-gray-600 text-lg">Customize how AiBubu sounds!</p>
              </div>
            </div>
            <KidButton variant="danger" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </KidButton>
          </div>

          {/* Current Voice Display */}
          {selectedVoice && (
            <KidCard className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">🎤</div>
                  <div>
                    <div className="font-black text-blue-800 text-xl flex items-center">
                      Current Voice: {selectedVoice.name}
                      {selectedVoice.is_custom && <Crown className="w-5 h-5 ml-2 text-purple-500" />}
                    </div>
                    <div className="text-blue-600 capitalize font-bold">
                      {selectedVoice.labels.gender}, {selectedVoice.labels.accent}
                      {selectedVoice.is_custom && (
                        <span className="ml-2">
                          <KidBadge color="purple">
                            <Crown className="w-3 h-3 mr-1" />
                            Custom Voice
                          </KidBadge>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <KidButton variant="success" onClick={testVoice}>
                  <Play className="w-4 h-4 mr-2" />
                  Test Voice
                </KidButton>
              </div>
            </KidCard>
          )}

          {/* Tab Navigation */}
          <div className="flex mb-8 gap-4">
            <KidButton
              variant={activeTab === 'characters' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('characters')}
              className="flex-1"
            >
              🎭 Voice Characters
            </KidButton>
            <KidButton
              variant={activeTab === 'advanced' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('advanced')}
              className="flex-1"
            >
              ⚙️ Advanced Settings
            </KidButton>
          </div>

          {/* Tab Content */}
          {activeTab === 'characters' ? (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <KidButton
                  variant="secondary"
                  onClick={refreshCustomVoices}
                  disabled={refreshingVoices}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshingVoices ? 'animate-spin' : ''}`} />
                  Refresh Custom Voices
                </KidButton>

                <KidButton
                  variant="warning"
                  onClick={() => setShowCreateVoice(!showCreateVoice)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Voice
                </KidButton>
              </div>

              {/* Voice Creation Section */}
              {showCreateVoice && (
                <KidCard className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
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

                      <div className="flex gap-4 justify-center">
                        <KidButton
                          variant="secondary"
                          onClick={() => {
                            setCustomVoiceBlob(null)
                            setCustomVoiceUrl('')
                          }}
                        >
                          Re-record
                        </KidButton>
                        
                        <KidButton
                          variant="warning"
                          onClick={createCustomVoice}
                          disabled={isCreatingCustomVoice}
                        >
                          {isCreatingCustomVoice ? 'Creating...' : '✨ Create Voice'}
                        </KidButton>
                      </div>
                    </div>
                  )}
                </KidCard>
              )}

              {/* Voice Selector */}
              <VoiceSelector
                selectedVoiceId={selectedVoice?.voice_id || ''}
                onVoiceSelect={handleVoiceChange}
                playerPreferences={playerPreferences}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Presets */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">🎛️ Voice Presets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {VOICE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleAdvancedSettingsChange({ ...preset.settings, preset: preset.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        voiceSettings.preset === preset.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <h4 className="font-semibold mb-1">{preset.name}</h4>
                      <p className="text-sm text-gray-600">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ElevenLabs Voice Selection */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">🎤 ElevenLabs Voices</h3>
                {loadingElevenLabsVoices ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-3" />
                    <span className="text-gray-600">Loading voices...</span>
                  </div>
                ) : elevenLabsVoices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {elevenLabsVoices.map((voice) => (
                      <button
                        key={voice.voice_id}
                        onClick={() => {
                          // Update selected voice for ElevenLabs voices
                          const voiceOption = {
                            voice_id: voice.voice_id,
                            name: voice.name,
                            labels: voice.labels || {},
                            is_custom: false
                          }
                          handleVoiceChange(voiceOption)
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedVoice?.voice_id === voice.voice_id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-800 text-sm">{voice.name}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {voice.labels?.gender || 'Unknown'} • {voice.labels?.age || 'Adult'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No ElevenLabs voices available</p>
                )}
              </div>

              {/* Advanced Controls */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">🔧 Fine-tune Settings</h3>
                <div className="space-y-6">
                  {/* Stability */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Stability</label>
                      <span className="text-base text-gray-500 font-mono">{voiceSettings.stability.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.stability}
                      onChange={(e) => handleAdvancedSettingsChange({ ...voiceSettings, stability: parseFloat(e.target.value) })}
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
                      onChange={(e) => handleAdvancedSettingsChange({ ...voiceSettings, style: parseFloat(e.target.value) })}
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
                      onChange={(e) => handleAdvancedSettingsChange({ ...voiceSettings, similarity_boost: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-sm text-gray-500 mt-2">How closely to match the original voice</div>
                  </div>

                  {/* Speaker Boost */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Speaker Boost</label>
                        <div className="text-sm text-gray-500">Enhance similarity to original voice</div>
                      </div>
                      <button
                        onClick={() => handleAdvancedSettingsChange({ ...voiceSettings, use_speaker_boost: !voiceSettings.use_speaker_boost })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          voiceSettings.use_speaker_boost ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            voiceSettings.use_speaker_boost ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center text-blue-600">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                <span>Updating voice settings...</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
            <KidButton variant="success" onClick={testVoice} size="lg">
              <Volume2 className="w-5 h-5 mr-2" />
              Test Current Settings
            </KidButton>
            
            <KidButton variant="secondary" onClick={onClose} size="lg">
              Done
            </KidButton>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}