import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    )
  }

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!audioFile || !name) {
      return NextResponse.json(
        { error: 'Audio file and name are required' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload WAV, MP3, or OGG files.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

    // Create FormData for ElevenLabs API
    const elevenLabsFormData = new FormData()
    elevenLabsFormData.append('name', name)
    elevenLabsFormData.append('description', description || `Custom voice for ${name}`)
    
    // Create a new File object from the buffer
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })
    elevenLabsFormData.append('files', audioBlob, audioFile.name)

    // Add voice settings
    elevenLabsFormData.append('remove_background_noise', 'true')
    elevenLabsFormData.append('labels', JSON.stringify({
      custom: 'true',
      created_by: 'aibubu_app'
    }))

    // Call ElevenLabs voice cloning API
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: elevenLabsFormData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      
      // Handle specific ElevenLabs errors
      if (response.status === 422) {
        return NextResponse.json(
          { error: 'Audio quality insufficient for voice cloning. Please record in a quiet environment with clear speech.' },
          { status: 400 }
        )
      } else if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key for ElevenLabs' },
          { status: 500 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to create custom voice. Please try again.' },
          { status: 500 }
        )
      }
    }

    const voiceData = await response.json()

    // After creating the voice, fetch its details to get the complete information
    const voiceDetailsResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceData.voice_id}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      }
    })

    let voiceDetails = voiceData
    if (voiceDetailsResponse.ok) {
      voiceDetails = await voiceDetailsResponse.json()
    }

    // Format the voice data to match the expected format
    const formattedVoice = {
      voice_id: voiceDetails.voice_id,
      name: voiceDetails.name,
      labels: {
        gender: voiceDetails.labels?.gender || "custom",
        age: voiceDetails.labels?.age || "custom", 
        accent: voiceDetails.labels?.accent || "custom",
        custom: "true",
        created_by: "aibubu_app"
      },
      is_custom: true,
      category: voiceDetails.category || "cloned"
    }

    return NextResponse.json({
      voice_id: voiceDetails.voice_id,
      name: voiceDetails.name,
      status: 'created',
      message: 'Custom voice created successfully!',
      voice_data: formattedVoice // Return the formatted voice data
    })

  } catch (error) {
    console.error('Voice cloning error:', error)
    return NextResponse.json(
      { error: 'Internal server error during voice cloning' },
      { status: 500 }
    )
  }
}