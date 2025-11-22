import { NextRequest, NextResponse } from 'next/server'

type ElevenLabsRequest = {
  text: string
  voice_id?: string
  model_id?: string
  voice_settings?: {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }
  output_format?: string
}

export async function POST(req: NextRequest) {
  try {
    const { 
      text, 
      voice_id = 'JBFqnCBsd6RMkjVDRZzb', // Default voice ID (female, young-sounding)
      model_id = 'eleven_flash_v2_5', // Fast model for low latency
      voice_settings = {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: false
      },
      output_format = 'mp3_44100_128'
    }: ElevenLabsRequest = await req.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      )
    }

    // Check if ElevenLabs API key is available
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Call ElevenLabs Text-to-Speech API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=${output_format}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id,
          voice_settings
        })
      }
    )

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.text()
      console.error('ElevenLabs API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate speech with ElevenLabs' },
        { status: elevenLabsResponse.status }
      )
    }

    // Get the audio data as array buffer
    const audioBuffer = await elevenLabsResponse.arrayBuffer()
    
    // Convert to base64 for sending to client
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      method: 'elevenlabs',
      audio_data: base64Audio,
      content_type: `audio/${output_format.split('_')[0]}`,
      voice_info: {
        voice_id,
        model_id,
        voice_settings
      },
      text_length: text.length,
      // Estimated duration (rough calculation: ~150 words per minute, 5 chars per word)
      estimated_duration_ms: Math.round((text.length / 5) * (60000 / 150))
    })

  } catch (error) {
    console.error('Error in ElevenLabs speech synthesis:', error)
    return NextResponse.json(
      { error: 'Internal server error during speech synthesis' },
      { status: 500 }
    )
  }
}

// GET endpoint to list available voices (optional)
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    
    // Try ElevenLabs API first if API key is available
    if (apiKey) {
      try {
        const voicesResponse = await fetch('https://api.elevenlabs.io/v2/voices', {
          headers: {
            'xi-api-key': apiKey,
          }
        })

        if (voicesResponse.ok) {
          const voicesData = await voicesResponse.json()
          
          // Filter for child-friendly voices (female, young-sounding)
          const childFriendlyVoices = voicesData.voices?.filter((voice: any) => 
            voice.labels?.gender === 'female' || 
            voice.labels?.age === 'young' ||
            voice.name.toLowerCase().includes('child') ||
            voice.name.toLowerCase().includes('kid')
          ) || []

          return NextResponse.json({
            success: true,
            source: 'elevenlabs_api',
            all_voices: voicesData.voices || [],
            child_friendly_voices: childFriendlyVoices,
            recommended_voice: childFriendlyVoices[0] || voicesData.voices?.[0] || {
              voice_id: 'JBFqnCBsd6RMkjVDRZzb',
              name: 'Default Female Voice'
            }
          })
        }
      } catch (elevenLabsError) {
        console.log('ElevenLabs API failed, falling back to mock data:', elevenLabsError)
      }
    }

    // Fallback to mock data
    try {
      const { mockVoicesData: mockData } = await import('../../../data/mock-voices')
      
      // Filter for child-friendly voices from mock data
      const childFriendlyVoices = mockData.voices?.filter((voice: any) => 
        voice.labels?.gender === 'female' || 
        voice.labels?.age === 'young' ||
        voice.name.toLowerCase().includes('child') ||
        voice.name.toLowerCase().includes('kid')
      ) || []

      return NextResponse.json({
        success: true,
        source: 'mock_data',
        all_voices: mockData.voices || [],
        child_friendly_voices: childFriendlyVoices,
        recommended_voice: childFriendlyVoices[0] || mockData.voices?.[0] || {
          voice_id: 'JBFqnCBsd6RMkjVDRZzb',
          name: 'Default Female Voice'
        },
        note: 'Using mock data - ElevenLabs API not available'
      })
    } catch (mockError) {
      console.error('Error reading mock data:', mockError)
      
      // Ultimate fallback - hardcoded voices
      const fallbackVoices = [
        {
          voice_id: 'JBFqnCBsd6RMkjVDRZzb',
          name: 'Default Female Voice',
          labels: { gender: 'female', age: 'young adult' }
        },
        {
          voice_id: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel',
          labels: { gender: 'female', age: 'young adult' }
        },
        {
          voice_id: 'CYw3kZ02Hs0563khs1Fj',
          name: 'Ian',
          labels: { gender: 'male', age: 'middle aged' }
        }
      ]
      
      return NextResponse.json({
        success: true,
        source: 'hardcoded_fallback',
        all_voices: fallbackVoices,
        child_friendly_voices: fallbackVoices,
        recommended_voice: fallbackVoices[0],
        note: 'Using hardcoded fallback voices'
      })
    }

  } catch (error) {
    console.error('Error in voices endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 