import { mockVoicesData } from '@/data/mock-voices'

export interface VoiceOption {
  voice_id: string
  name: string
  labels: {
    gender: string
    age: string
    accent: string
    custom?: string
    created_by?: string
  }
  is_custom?: boolean
  category?: string
}

export function getAllAvailableVoices(playerPreferences: any = {}): VoiceOption[] {
  const standardVoices: VoiceOption[] = mockVoicesData.voices.map(voice => ({
    ...voice,
    is_custom: false
  }))

  const customVoices: VoiceOption[] = []

  // Check if player has custom voice data from onboarding
  if (playerPreferences.custom_voice_data) {
    customVoices.push({
      ...playerPreferences.custom_voice_data,
      is_custom: true
    })
  }

  // Check if player has additional custom voices from ElevenLabs
  if (playerPreferences.available_custom_voices && Array.isArray(playerPreferences.available_custom_voices)) {
    playerPreferences.available_custom_voices.forEach((voice: any) => {
      // Avoid duplicates
      if (!customVoices.find(cv => cv.voice_id === voice.voice_id)) {
        customVoices.push({
          ...voice,
          is_custom: true
        })
      }
    })
  }

  return [...standardVoices, ...customVoices]
}

export function getVoiceById(voiceId: string, playerPreferences: any = {}): VoiceOption | null {
  const allVoices = getAllAvailableVoices(playerPreferences)
  return allVoices.find(voice => voice.voice_id === voiceId) || null
}

export function formatCustomVoiceForStorage(voiceData: any): any {
  return {
    voice_id: voiceData.voice_id,
    name: voiceData.name,
    labels: {
      gender: voiceData.labels?.gender || "custom",
      age: voiceData.labels?.age || "custom", 
      accent: voiceData.labels?.accent || "custom",
      custom: "true",
      created_by: "aibubu_app"
    },
    is_custom: true,
    category: voiceData.category || "cloned"
  }
}