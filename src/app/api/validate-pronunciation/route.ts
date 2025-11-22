import { NextRequest, NextResponse } from 'next/server'
import { generateObject, generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

type PronunciationRequest = {
  audio_data?: string // Base64 encoded audio
  transcript: string // What the user attempted to say
  target_word: string // The word/phrase they should have said
  language: string
  phonetic_target?: string // IPA transcription of target
  difficulty_level?: 'easy' | 'medium' | 'hard' // Controls scoring strictness
  temperature?: number // AI response creativity (0.1-1.0)
}

// Zod schema for structured LLM response
const pronunciationAnalysisSchema = z.object({
  transcript: z.string().describe('Exact phonetic transcription of what you heard'),
  target_word: z.string().describe('The target word being practiced'),
  score: z.number().min(0).max(100).describe('Pronunciation accuracy score 0-100'),
  feedback: z.string().describe('Encouraging but honest feedback about pronunciation'),
  issues: z.array(z.string()).describe('Specific pronunciation errors identified'),
  tips: z.array(z.string()).describe('Specific tips for improvement'),
  correct_language: z.boolean().describe('Whether user spoke in the correct language'),
  detected_language: z.string().describe('Language code detected in the audio')
})

// Zod schema for text-based feedback analysis
const feedbackAnalysisSchema = z.object({
  feedback: z.string().describe('Encouraging feedback about the pronunciation attempt'),
  issues: z.array(z.string()).describe('Specific pronunciation issues identified'),
  tips: z.array(z.string()).describe('Practical tips for improvement'),
  correct_language: z.boolean().describe('Whether user spoke in the correct language'),
  detected_language: z.string().describe('Language code detected in the text')
})

type ValidationResult = {
  score: number // 0-100
  feedback: string
  specific_issues: string[]
  pronunciation_tips: string[]
  is_correct: boolean
  phonetic_analysis?: string
  language_mismatch?: boolean
  detected_language?: string
}

export async function POST(req: NextRequest) {
  try {
    const { 
      audio_data, 
      transcript, 
      target_word, 
      language, 
      phonetic_target,
      difficulty_level = 'medium',
      temperature = 0.5
    }: PronunciationRequest = await req.json()

    if (!target_word || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: target_word, language' },
        { status: 400 }
      )
    }

    let validation: ValidationResult

    // If audio data is provided, use multimodal LLM analysis
    if (audio_data) {
      validation = await validatePronunciationWithAudio(
        audio_data,
        target_word,
        language,
        phonetic_target,
        difficulty_level,
        temperature
      )
    } else {
      // Fallback to text-based analysis
      if (!transcript) {
        return NextResponse.json(
          { error: 'Either audio_data or transcript is required' },
          { status: 400 }
        )
      }
      
      validation = await validatePronunciation(
        transcript, 
        target_word, 
        language, 
        phonetic_target,
        temperature
      )
    }

    return NextResponse.json({
      success: true,
      validation,
      suggestions: generateImprovementSuggestions(validation, language)
    })

  } catch (error) {
    console.error('Error in pronunciation validation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getScoringGuidelines(difficultyLevel: 'easy' | 'medium' | 'hard', target: string): string {
  const guidelines = {
    easy: `
- 85-100: Any recognizable attempt at "${target}" (be very encouraging!)
- 70-84: Close pronunciation with minor issues
- 50-69: Understandable as "${target}" with some errors
- 30-49: Attempting "${target}" but needs improvement
- 15-29: Barely recognizable as "${target}"
- 0-14: Not "${target}" or wrong language

NOTE: Be generous with scoring for beginners. Focus on encouragement.`,
    
    medium: `
- 90-100: Perfect pronunciation of "${target}"
- 80-89: Very good, minor issues with "${target}"
- 60-79: Recognizable as "${target}" but needs work
- 40-59: Attempting "${target}" but significant errors
- 20-39: Barely recognizable as "${target}"
- 0-19: Not "${target}" or wrong language`,
    
    hard: `
- 95-100: Native-level pronunciation of "${target}"
- 85-94: Excellent pronunciation with tiny imperfections
- 70-84: Good pronunciation but noticeable accent/errors
- 50-69: Understandable but clear pronunciation issues
- 30-49: Attempting "${target}" but many errors
- 0-29: Poor pronunciation or wrong word

NOTE: Be strict and precise in evaluation. Expect near-native quality.`
  }
  
  return guidelines[difficultyLevel]
}

async function validatePronunciationWithAudio(
  audioBase64: string,
  target: string,
  language: string,
  phoneticTarget?: string,
  difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium',
  temperature: number = 0.5
): Promise<ValidationResult> {
  try {
    // Convert base64 to buffer for Google AI
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    
    // Use Google's multimodal model to analyze the audio
    const { object: analysisResult } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: pronunciationAnalysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert pronunciation coach with perfect hearing. I need you to analyze this audio recording where a student is attempting to pronounce a specific word.

**CRITICAL TASK**: Compare the student's pronunciation in the audio against this exact target:

🎯 TARGET WORD: "${target}"
🌍 TARGET LANGUAGE: ${language}
${phoneticTarget ? `🔊 CORRECT PRONUNCIATION: ${phoneticTarget}` : ''}

**YOUR ANALYSIS MUST INCLUDE**:

1. **TRANSCRIPTION**: What did you actually hear the student say? (exact phonetic transcription)
2. **PRONUNCIATION ACCURACY**: Compare their pronunciation to "${target}" specifically
   - Score: 0-100 (how close to the target word "${target}")
   - Consider: vowel sounds, consonants, stress patterns, intonation
3. **LANGUAGE VERIFICATION**: Are they speaking in ${language}?
4. **SPECIFIC ISSUES**: What sounds are wrong compared to "${target}"?
5. **IMPROVEMENT TIPS**: How to pronounce "${target}" correctly

**SCORING GUIDELINES** (${difficultyLevel.toUpperCase()} mode):
${getScoringGuidelines(difficultyLevel, target)}

Please analyze the audio and provide structured feedback following the schema.`
            },
            {
              type: 'file',
              data: audioBuffer,
              mimeType: 'audio/webm'
            }
          ]
        }
      ],
      temperature: temperature  // User-configurable temperature for response creativity
    })

    // analysisResult is already structured from generateObject
    // console.log('Successfully received structured LLM response:', analysisResult)

    // Type assertion to ensure TypeScript knows the structure
    const typedResult = analysisResult as z.infer<typeof pronunciationAnalysisSchema>

    return {
      score: Math.max(0, Math.min(100, typedResult.score)), // Ensure score is 0-100
      feedback: typedResult.feedback,
      specific_issues: typedResult.issues || [],
      pronunciation_tips: typedResult.tips || [],
      is_correct: typedResult.correct_language && typedResult.score >= 80,
      phonetic_analysis: phoneticTarget,
      language_mismatch: !typedResult.correct_language,
      detected_language: typedResult.detected_language || language
    }

  } catch (error) {
    console.error('Error in audio pronunciation validation:', error)
    
    // Fallback response on error
    return {
      score: 25,
      feedback: 'Sorry, I had trouble analyzing your audio. Please check your microphone and try again.',
      specific_issues: ['Audio processing error'],
      pronunciation_tips: ['Ensure your microphone is working', 'Try recording in a quieter environment', 'Speak clearly and at normal volume'],
      is_correct: false,
      phonetic_analysis: phoneticTarget,
      language_mismatch: false,
      detected_language: language
    }
  }
}

async function validatePronunciation(
  transcript: string,
  target: string,
  language: string,
  phoneticTarget?: string,
  temperature: number = 0.5
): Promise<ValidationResult> {
  
  // Handle unclear audio or empty transcript
  if (transcript.trim() === '[unclear audio]' || transcript.trim() === '') {
    let score = Math.floor(Math.random() * 30) + 10 // Random score between 10-40
    const feedback = await generateFeedback(transcript, target, language, score, phoneticTarget)
    
    return {
      score,
      feedback: feedback.feedback || "I couldn't clearly hear your pronunciation. Please try speaking more clearly and closer to the microphone.",
      specific_issues: feedback.issues || ["Audio was unclear", "Try speaking louder and clearer"],
      pronunciation_tips: feedback.tips || ["Speak directly into the microphone", "Ensure you're in a quiet environment", "Pronounce each syllable clearly"],
      is_correct: false,
      phonetic_analysis: phoneticTarget,
      language_mismatch: false,
      detected_language: language
    }
  }
  
  // Simple text similarity check (in production, you'd use audio analysis)
  const normalizedTranscript = normalizeText(transcript, language)
  const normalizedTarget = normalizeText(target, language)
  
  const similarity = calculateSimilarity(normalizedTranscript, normalizedTarget)
  let score = Math.round(similarity * 100)
  
  // Add some randomness to make it more realistic (remove this in production)
  if (similarity > 0.8) {
    score = Math.max(60, score - Math.floor(Math.random() * 20)) // Reduce perfect scores
  }
  
      // Use AI to provide detailed feedback
    const feedback = await generateFeedback(transcript, target, language, score, phoneticTarget, temperature)
  
  // If wrong language detected, significantly reduce score
  if (!feedback.correct_language) {
    score = Math.min(score, 20) // Cap score at 20% for wrong language
  }
  
  return {
    score,
    feedback: feedback.feedback,
    specific_issues: feedback.issues,
    pronunciation_tips: feedback.tips,
    is_correct: feedback.correct_language && score >= 80,
    phonetic_analysis: phoneticTarget,
    language_mismatch: !feedback.correct_language,
    detected_language: feedback.detected_language
  }
}

async function generateFeedback(
  transcript: string, 
  target: string, 
  language: string, 
  score: number,
  phonetic?: string,
  temperature: number = 0.5
) {
  try {
    const { object: feedbackResult } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: feedbackAnalysisSchema,
      prompt: `
You are a pronunciation coach helping a language learner. Analyze this pronunciation attempt:

Target word/phrase: "${target}" in ${language}
User's attempt: "${transcript}"
Phonetic target: ${phonetic || 'Not provided'}
Similarity score: ${score}/100

IMPORTANT: First check if the user is speaking in the correct language. The user should be practicing ${language}.

Please provide:
1. Language validation: Is the user speaking in ${language} or a different language?
2. If wrong language: Clearly explain they need to speak in ${language}
3. If correct language: Encouraging feedback (2-3 sentences)
4. Specific pronunciation issues (if any)
5. 2-3 practical tips for improvement

Language codes:
- en = English
- es = Spanish  
- ja = Japanese
- ru = Russian
- zh = Chinese/Mandarin
- ar = Arabic
- ko = Korean

Be encouraging and constructive. Focus on specific sounds or patterns they can practice.
`,
      temperature: temperature
    })

    console.log('Successfully received structured feedback response:', feedbackResult)
    return feedbackResult

  } catch (error) {
    console.error('Error generating AI feedback:', error)
    // Even the fallback should be structured, but this is now much less likely to happen
    return {
      feedback: `I had trouble analyzing your pronunciation of "${target}". Your effort shows dedication to learning!`,
      issues: ['Analysis system temporarily unavailable'],
      tips: [`Keep practicing "${target}"`, 'Try recording in a quieter environment', 'Speak clearly and at normal volume'],
      correct_language: true,
      detected_language: language
    }
  }
}

function normalizeText(text: string, language: string): string {
  // Remove extra spaces, punctuation, and normalize case
  let normalized = text.toLowerCase().trim()
  
  // Language-specific normalization
  switch (language) {
    case 'zh':
      // For Chinese, we might want to handle tones differently
      normalized = normalized.replace(/[āáǎàēéěèīíǐìōóǒòūúǔù]/g, (match) => {
        // Convert toned vowels to base form for comparison
        const toneMap: Record<string, string> = {
          'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
          'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
          'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
          'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
          'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u'
        }
        return toneMap[match] || match
      })
      break
    case 'ja':
      // For Japanese, handle romaji variations
      normalized = normalized.replace(/[っ]/g, '') // Remove small tsu for comparison
      break
    case 'ar':
      // For Arabic, handle diacritics
      normalized = normalized.replace(/[\u064B-\u065F]/g, '') // Remove diacritics
      break
  }
  
  // Remove punctuation and extra spaces
  normalized = normalized.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
  
  return normalized
}

function calculateSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein distance-based similarity
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  const maxLen = Math.max(str1.length, str2.length)
  return maxLen === 0 ? 1 : (maxLen - matrix[str2.length][str1.length]) / maxLen
}

function generateImprovementSuggestions(validation: ValidationResult, language: string) {
  const suggestions = []
  
  if (validation.score < 60) {
    suggestions.push({
      type: 'practice',
      title: 'Focus on Basics',
      description: 'Practice the individual sounds slowly before attempting the full word'
    })
  } else if (validation.score < 80) {
    suggestions.push({
      type: 'refinement',
      title: 'Fine-tuning',
      description: 'You\'re close! Pay attention to stress patterns and intonation'
    })
  } else {
    suggestions.push({
      type: 'mastery',
      title: 'Excellent!',
      description: 'Try more challenging words or practice speaking faster'
    })
  }
  
  // Language-specific suggestions
  const languageTips: Record<string, any> = {
    'zh': {
      type: 'tones',
      title: 'Tone Practice',
      description: 'Practice each tone separately using the four tone patterns'
    },
    'ja': {
      type: 'rhythm',
      title: 'Rhythm Practice', 
      description: 'Focus on equal timing for each syllable'
    },
    'ru': {
      type: 'softness',
      title: 'Soft/Hard Sounds',
      description: 'Practice distinguishing between palatalized and non-palatalized consonants'
    }
  }
  
  if (languageTips[language]) {
    suggestions.push(languageTips[language])
  }
  
  return suggestions
} 