---
inclusion: manual
---

# ElevenLabs API Integration Guide

## API Configuration

### Environment Variables
```
ELEVENLABS_API_KEY=your_api_key_here
```

### Base URL
```
https://api.elevenlabs.io/v1
```

## Common Endpoints

### Text-to-Speech
```typescript
POST /text-to-speech/{voice_id}
Headers:
  xi-api-key: ${ELEVENLABS_API_KEY}
  Content-Type: application/json

Body:
{
  "text": "Text to convert to speech",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": true
  }
}
```

### Get Available Voices
```typescript
GET /voices
Headers:
  xi-api-key: ${ELEVENLABS_API_KEY}
```

### Get Voice Details
```typescript
GET /voices/{voice_id}
Headers:
  xi-api-key: ${ELEVENLABS_API_KEY}
```

## Recommended Models

- `eleven_multilingual_v2`: Best for multiple languages (supports 29+ languages)
- `eleven_turbo_v2`: Fastest, lower latency
- `eleven_monolingual_v1`: English only, high quality

## Voice Settings Guidelines

- **stability** (0.0-1.0): Higher = more consistent, lower = more expressive
- **similarity_boost** (0.0-1.0): Higher = closer to original voice
- **style** (0.0-1.0): Exaggeration of speaking style
- **use_speaker_boost**: true for better clarity

## Best Practices

1. **Error Handling**: Always handle rate limits (429) and quota exceeded errors
2. **Caching**: Cache generated audio to reduce API calls
3. **Streaming**: Use streaming endpoint for real-time playback
4. **Language Detection**: Match voice language with content language
5. **Rate Limits**: Free tier has character limits per month

## Example Implementation

```typescript
async function generateSpeech(text: string, voiceId: string) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  return response.blob();
}
```

## Language Support

ElevenLabs multilingual model supports:
- English, Spanish, French, German, Italian, Portuguese
- Polish, Dutch, Hindi, Arabic, Chinese, Japanese, Korean
- And 15+ more languages

Match voice selection with `speaking_languages` table for consistency.
