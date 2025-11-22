'use client'

import { useState, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { VoiceOption, getAllAvailableVoices } from '@/lib/voice-utils'

interface VoiceSelectorProps {
  selectedVoiceId: string
  onVoiceSelect: (voice: VoiceOption) => void
  playerPreferences?: any
  className?: string
  highlightVoiceId?: string // ID of voice to highlight (for newly created voices)
}

export default function VoiceSelector({ 
  selectedVoiceId, 
  onVoiceSelect, 
  playerPreferences = {},
  className = "",
  highlightVoiceId
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

  useEffect(() => {
    const availableVoices = getAllAvailableVoices(playerPreferences)
    setVoices(availableVoices)
  }, [playerPreferences])

  // Scroll to highlighted voice when it becomes available
  useEffect(() => {
    if (highlightVoiceId && voices.length > 0) {
      const highlightedVoice = voices.find(v => v.voice_id === highlightVoiceId)
      if (highlightedVoice) {
        setTimeout(() => {
          const element = document.querySelector(`[data-voice-id="${highlightVoiceId}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
        }, 100) // Small delay to ensure DOM is updated
      }
    }
  }, [highlightVoiceId, voices])

  const handleVoicePreview = async (voice: VoiceOption) => {
    if (playingVoiceId === voice.voice_id) {
      setPlayingVoiceId(null)
      return
    }

    setPlayingVoiceId(voice.voice_id)
    
    try {
      // Use the existing elevenlabs-speech API for preview
      const response = await fetch('/api/elevenlabs-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hello, I'm ${voice.name}. This is how I sound.`,
          voice_id: voice.voice_id
        })
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setPlayingVoiceId(null)
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.onerror = () => {
          setPlayingVoiceId(null)
          URL.revokeObjectURL(audioUrl)
        }
        
        await audio.play()
      } else {
        setPlayingVoiceId(null)
      }
    } catch (error) {
      console.error('Error playing voice preview:', error)
      setPlayingVoiceId(null)
    }
  }

  // Filter to only show standard voices
  const standardVoices = voices.filter(voice => !voice.is_custom)

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
          Standard Voices
        </h4>
        
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {standardVoices.map((voice) => (
            <button
              key={voice.voice_id}
              data-voice-id={voice.voice_id}
              onClick={() => onVoiceSelect(voice)}
              className={`p-3 rounded-lg border text-sm transition-all relative group ${
                selectedVoiceId === voice.voice_id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : highlightVoiceId === voice.voice_id
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-800 animate-pulse shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left flex-1">
                  <div className="font-medium flex items-center">
                    {voice.name}
                    {highlightVoiceId === voice.voice_id && (
                      <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold animate-bounce">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {voice.labels.gender}, {voice.labels.accent}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVoicePreview(voice)
                  }}
                  disabled={playingVoiceId === voice.voice_id}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  {playingVoiceId === voice.voice_id ? (
                    <Pause className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Play className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}