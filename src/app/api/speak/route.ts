import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

type SpeechRequest = {
  text: string
  language: string
  voice_style?: 'child' | 'friendly' | 'teacher' | 'narrator'
  speed?: 'slow' | 'normal' | 'fast'
  emotion?: 'neutral' | 'excited' | 'calm' | 'encouraging'
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json()
    const text = requestBody.text
    const language = requestBody.language
    const voice_style = requestBody.voice_style || 'child'
    const speed = requestBody.speed || 'normal'
    const emotion = requestBody.emotion || 'encouraging'

    if (!text || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: text and language' },
        { status: 400 }
      )
    }

    // Use Gemini-2.5-pro to generate speech synthesis instructions
    const { text: speechInstructions } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `You are an advanced AI speech synthesis system. Generate detailed speech synthesis instructions for text-to-speech conversion.

TEXT TO SPEAK: "${text}"
TARGET LANGUAGE: ${language}
VOICE STYLE: ${voice_style}
SPEED: ${speed}
EMOTION: ${emotion}

Generate a comprehensive speech synthesis configuration that includes:

1. **SSML (Speech Synthesis Markup Language) enhanced text** with proper pronunciation, emphasis, and pacing
2. **Phonetic breakdown** for difficult words
3. **Prosody instructions** (pitch, rate, volume variations)
4. **Child-friendly adaptations** if voice_style is 'child'
5. **Language-specific optimizations** for ${language}

Focus on making the speech sound natural, engaging, and appropriate for educational content aimed at children.

Return the response in this JSON format:
{
  "ssml_text": "SSML enhanced version of the text",
  "phonetic_guide": "phonetic breakdown of difficult words", 
  "prosody": {
    "base_pitch": "value for pitch (high/medium/low)",
    "speaking_rate": "rate value (0.5-2.0)",
    "volume": "volume level (0.1-1.0)"
  },
  "voice_characteristics": {
    "gender": "preferred gender",
    "age": "preferred age range", 
    "accent": "accent preference"
  },
  "emphasis_points": ["list of words/phrases to emphasize"],
  "pauses": ["locations where to add natural pauses"]
}`,
      temperature: 0.3 // Lower temperature for consistent speech synthesis
    })

    // Parse the LLM response
    let speechConfig
    try {
      // Extract JSON from the response
      const jsonMatch = speechInstructions.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        speechConfig = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError)
      // Fallback to basic configuration
      speechConfig = createFallbackConfig(text, language, voice_style, speed, emotion)
    }

    const response = {
      success: true,
      method: 'llm_enhanced',
      synthesis_config: speechConfig,
      // Include additional guidance
      phonetic_guide: getPhoneticGuide(text, language),
      pronunciation_tips: getPronunciationTips(language),
      // For Web Speech API fallback
      web_speech_fallback: {
        text,
        language: getWebSpeechLanguage(language),
        voice: getDefaultVoice(language),
        rate: getSpeedValue(speed),
        pitch: getVoiceStylePitch(voice_style)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in LLM speech synthesis:', error)
    
    return NextResponse.json(
      { error: 'Internal server error during speech synthesis' },
      { status: 500 }
    )
  }
}

function createFallbackConfig(text: string, language: string, voice_style: string, speed: string, emotion: string) {
  return {
    ssml_text: `<speak><prosody rate="${getSpeedValue(speed)}" pitch="${getVoiceStylePitch(voice_style)}">${text}</prosody></speak>`,
    phonetic_guide: getPhoneticGuide(text, language),
    prosody: {
      base_pitch: voice_style === 'child' ? 'high' : 'medium',
      speaking_rate: getSpeedValue(speed),
      volume: 0.8
    },
    voice_characteristics: {
      gender: voice_style === 'child' ? 'female' : 'neutral',
      age: voice_style === 'child' ? 'young' : 'adult',
      accent: 'native'
    },
    emphasis_points: [],
    pauses: []
  }
}

function getSpeedValue(speed: string): number {
  const speedMap = {
    'slow': 0.7,
    'normal': 0.9,
    'fast': 1.1
  }
  return speedMap[speed as keyof typeof speedMap] || 0.9
}

function getVoiceStylePitch(voice_style: string): number {
  const pitchMap = {
    'child': 1.4,
    'friendly': 1.2,
    'teacher': 1.1,
    'narrator': 1.0
  }
  return pitchMap[voice_style as keyof typeof pitchMap] || 1.3
}

function getWebSpeechLanguage(language: string): string {
  const langMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'ja': 'ja-JP',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ar': 'ar-SA',
    'ko': 'ko-KR'
  }
  return langMap[language] || 'en-US'
}

function getDefaultVoice(language: string): string {
  const voiceMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES', 
    'ja': 'ja-JP',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ar': 'ar-SA',
    'ko': 'ko-KR'
  }
  
  return voiceMap[language] || 'en-US'
}

function getPhoneticGuide(text: string, language: string): string {
  // This is a simplified implementation
  // In production, you'd use a proper phonetic transcription service
  const phoneticMaps: Record<string, Record<string, string>> = {
    'en': {
      'cat': '/kæt/',
      'dog': '/dɔːɡ/',
      'sun': '/sʌn/',
      'hello': '/həˈloʊ/'
    },
    'es': {
      'hola': '/ˈo.la/',
      'me llamo': '/me ˈʎa.mo/',
      'mucho gusto': '/ˈmu.tʃo ˈɡus.to/'
    },
    'ja': {
      'konnichiwa': '/koɴ.ni.tʃi.wa/',
      'arigatou': '/a.ɾi.ɡa.toː/',
      'hajimemashite': '/ha.ʑi.me.ma.ʃi.te/'
    },
    'ru': {
      'zdravstvuyte': '/ˈzdra.stvʊj.tʲe/',
      'borsch': '/borʂtʂ/',
      'ochen priyatno': '/ˈo.tʂenʲ pri.ˈjat.nə/'
    },
    'zh': {
      'mā': '/ma˥/',
      'má': '/ma˧˥/',
      'mǎ': '/ma˧˩˧/',
      'mà': '/ma˥˩/',
      'nǐ hǎo': '/ni˧˩˧ xaʊ˧˩˧/'
    }
  }

  return phoneticMaps[language]?.[text.toLowerCase()] || `/${text}/`
}

function getPronunciationTips(language: string): string[] {
  const tips: Record<string, string[]> = {
    'en': [
      'Speak clearly and at a moderate pace',
      'Pay attention to vowel sounds',
      'Practice consonant clusters slowly'
    ],
    'es': [
      'Roll your R sounds gently',
      'Spanish vowels are pure and short',
      'Each syllable gets equal stress unless marked'
    ],
    'ja': [
      'Each syllable takes equal time',
      'Consonants are softer than English',
      'Vowels: a-i-u-e-o (ah-ee-oo-eh-oh)'
    ],
    'ru': [
      'Pay attention to soft vs hard consonants',
      'Stress affects vowel pronunciation',
      'Practice consonant clusters slowly'
    ],
    'zh': [
      'Tones are crucial for meaning',
      'Practice each tone separately first',
      'Listen carefully to native speakers'
    ],
    'ar': [
      'Emphasis on throat sounds',
      'Practice guttural consonants',
      'Vowels are shorter than English'
    ],
    'ko': [
      'Distinguish between aspirated and non-aspirated consonants',
      'Practice vowel combinations',
      'Pay attention to final consonants'
    ]
  }

  return tips[language] || tips['en']
} 