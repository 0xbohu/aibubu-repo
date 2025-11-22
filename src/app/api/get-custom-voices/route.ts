import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

export async function GET(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    )
  }

  try {
    // Get all voices from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch voices from ElevenLabs')
    }

    const data = await response.json()
    
    // Filter for custom voices created by our app
    const customVoices = data.voices.filter((voice: any) => 
      voice.labels?.created_by === 'aibubu_app' || 
      voice.category === 'cloned' ||
      voice.labels?.custom === 'true'
    ).map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      labels: {
        gender: voice.labels?.gender || "custom",
        age: voice.labels?.age || "custom", 
        accent: voice.labels?.accent || "custom",
        custom: "true",
        created_by: voice.labels?.created_by || "aibubu_app"
      },
      is_custom: true,
      category: voice.category || "cloned"
    }))

    return NextResponse.json({ 
      custom_voices: customVoices,
      total_count: customVoices.length
    })

  } catch (error) {
    console.error('Error fetching custom voices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom voices' },
      { status: 500 }
    )
  }
}