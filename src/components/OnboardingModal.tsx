'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { X, Mic, Play, Pause, Upload, Check } from 'lucide-react'
import { mockVoicesData } from '@/data/mock-voices'
import VoiceSelector from './VoiceSelector'
import { VoiceOption } from '@/lib/voice-utils'

interface OnboardingModalProps {
  user: User
  isOpen: boolean
  onComplete: () => void
}

const animalNames = ['Dragon', 'Phoenix', 'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Bear', 'Shark', 'Raven']
const superheroes = ['Captain', 'Shadow', 'Thunder', 'Lightning', 'Storm', 'Blaze', 'Frost', 'Nova', 'Viper', 'Hawk']

const generateRandomNickname = () => {
  const prefix = Math.random() > 0.5 ? animalNames : superheroes
  const name = prefix[Math.floor(Math.random() * prefix.length)]
  const number = Math.floor(Math.random() * 99999) + 100
  return `${name}${number}`
}

export default function OnboardingModal({ user, isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(mockVoicesData.voices[0] as VoiceOption)
  const [currentPlayerPreferences, setCurrentPlayerPreferences] = useState<any>({})
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [customVoiceBlob, setCustomVoiceBlob] = useState<Blob | null>(null)
  const [customVoiceUrl, setCustomVoiceUrl] = useState<string>('')
  const [isCreatingCustomVoice, setIsCreatingCustomVoice] = useState(false)
  const [customVoice, setCustomVoice] = useState<{id: string, name: string, voice_data: any} | null>(null)
  const [saving, setSaving] = useState(false)
  const [highlightNewVoice, setHighlightNewVoice] = useState<string | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNickname(generateRandomNickname())
    } else {
      // Clean up when modal closes
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }
      setRecordingTime(0)
    }
  }, [isOpen, recordingTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
    }
  }, [recordingTimer])

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

  const playRecording = () => {
    if (customVoiceUrl) {
      const audio = new Audio(customVoiceUrl)
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.play()
    }
  }

  const createCustomVoice = async () => {
    if (!customVoiceBlob) return

    setIsCreatingCustomVoice(true)
    try {
      const formData = new FormData()
      formData.append('audio', customVoiceBlob, 'voice_sample.wav')
      formData.append('name', `${nickname}_voice`)
      formData.append('description', `Custom voice for ${nickname}`)

      const response = await fetch('/api/elevenlabs-voice-clone', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const customVoiceInfo = { 
          id: data.voice_id, 
          name: data.name, 
          voice_data: data.voice_data 
        }
        
        setCustomVoice(customVoiceInfo)
        
        // Update player preferences to include the new custom voice
        const updatedPreferences = {
          ...currentPlayerPreferences,
          custom_voice_data: data.voice_data
        }
        setCurrentPlayerPreferences(updatedPreferences)
        
        // Auto-select the newly created custom voice
        setSelectedVoice(data.voice_data)
        
        // Highlight the new voice for a few seconds
        setHighlightNewVoice(data.voice_data.voice_id)
        setTimeout(() => {
          setHighlightNewVoice(null)
        }, 5000) // Remove highlight after 5 seconds
      } else {
        throw new Error('Failed to create custom voice')
      }
    } catch (error) {
      console.error('Error creating custom voice:', error)
    } finally {
      setIsCreatingCustomVoice(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const voiceSettings = customVoice ? {
        voice_id: customVoice.id,
        voice_name: customVoice.name,
        is_custom: true
      } : {
        voice_id: selectedVoice.voice_id,
        voice_name: selectedVoice.name,
        is_custom: false
      }

      const preferences = {
        nickname: nickname,
        voice_settings: voiceSettings,
        onboarding_completed: true,
        // Store the complete custom voice data if available
        ...(customVoice && { custom_voice_data: customVoice.voice_data })
      }

      const { error } = await supabase
        .from('players')
        .update({ player_preferences: preferences })
        .eq('id', user.id)

      if (error) throw error

      onComplete()
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome to AiBubu!</h2>
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Choose Your Nickname</h3>
                <p className="text-gray-600 text-sm">Pick a fun name for your learning journey!</p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-semibold"
                  placeholder="Enter your nickname"
                />
                <button
                  onClick={() => setNickname(generateRandomNickname())}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                >
                  🎲 Generate Random Name
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!nickname.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
              >
                Next: Choose Voice
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🎤</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Choose Your Voice</h3>
                <p className="text-gray-600 text-sm">Select a voice character or create your own!</p>
              </div>

              <div className="space-y-6">
                <div className="max-h-64 overflow-y-auto">
                  <VoiceSelector
                    selectedVoiceId={selectedVoice.voice_id}
                    onVoiceSelect={setSelectedVoice}
                    playerPreferences={currentPlayerPreferences}
                    highlightVoiceId={highlightNewVoice || undefined}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-700">✨ Premium: Custom Voice</h4>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Premium</span>
                    </div>
                    
                    {!customVoiceBlob && !customVoice && (
                      <div className="space-y-6">
                        <p className="text-sm text-purple-600 text-center">Record 15-20 seconds of your voice to create a personalized AI voice!</p>
                        
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
                                {/* Animated rings */}
                                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-75"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>
                                <div className="absolute inset-0 rounded-full border-4 border-red-100 animate-ping opacity-25" style={{ animationDelay: '0.4s' }}></div>
                              </>
                            )}
                          </div>
                          
                          <div className="text-center">
                            {isRecording ? (
                              <div className="space-y-3">
                                <p className="text-red-600 font-semibold">🎙️ Recording in progress...</p>
                                <div className="text-2xl font-mono font-bold text-red-600">
                                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                </div>
                                <p className="text-sm text-gray-600">Speak clearly and naturally</p>
                                <div className="flex justify-center">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-purple-600 font-semibold">Tap to start recording</p>
                                <p className="text-xs text-gray-500">Record 15-20 seconds</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Sample text to read */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-700 font-medium mb-2">💡 Try reading this sample text:</p>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-gray-800 text-center italic">
                              "Hello! My name is {nickname} and I'm excited to learn with AiBubu. 
                              This is my voice and I can't wait to start my learning journey with personalized AI assistance."
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {customVoiceBlob && !customVoice && (
                      <div className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-300 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-600" />
                          </div>
                          
                          <div className="text-center">
                            <p className="text-green-600 font-semibold">✅ Recording Complete!</p>
                            <p className="text-sm text-gray-600">Preview your recording below</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={playRecording}
                            disabled={isPlaying}
                            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                              isPlaying 
                                ? 'bg-blue-400 text-white' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-5 h-5" />
                                <span>Playing...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5" />
                                <span>Preview Recording</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              setCustomVoiceBlob(null)
                              setCustomVoiceUrl('')
                            }}
                            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                          >
                            <Mic className="w-5 h-5" />
                            <span>Re-record</span>
                          </button>
                        </div>

                        <button
                          onClick={createCustomVoice}
                          disabled={isCreatingCustomVoice}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          {isCreatingCustomVoice ? (
                            <span className="flex items-center justify-center space-x-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Creating Your AI Voice...</span>
                            </span>
                          ) : (
                            '✨ Create My Custom Voice'
                          )}
                        </button>
                      </div>
                    )}

                    {customVoice && (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border-4 border-purple-300 flex items-center justify-center relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                              ✨
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-purple-600 font-bold text-lg">🎉 Success!</p>
                            <p className="text-sm text-gray-600">Custom voice "{customVoice.name}" is ready</p>
                            <div className="mt-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
                              <span className="text-xs text-purple-700 font-medium">✨ Auto-selected as your voice!</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">You can see it in the voice selection above</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
                >
                  {saving ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}