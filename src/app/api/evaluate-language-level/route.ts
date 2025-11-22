import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

// Zod schema for structured assessment response
const assessmentSchema = z.object({
  overall_level: z.string().describe('Exact level name from available levels'),
  overall_assessment: z.string().describe('2-3 sentence summary of student proficiency'),
  question_feedback: z.array(z.object({
    question_number: z.number().describe('Question number (1-based)'),
    question_id: z.string().describe('Question ID'),
    target_phrase: z.string().describe('Target phrase student should pronounce'),
    student_response: z.string().describe('What student actually said'),
    score: z.number().min(0).max(100).describe('Score out of 100 for this question'),
    feedback: z.string().describe('Specific feedback about this pronunciation attempt'),
    strengths: z.array(z.string()).describe('What they did well in this question'),
    areas_for_improvement: z.array(z.string()).describe('What needs work in this question'),
    difficulty_assessment: z.string().describe('How well they handled this difficulty level')
  })).describe('Detailed feedback for each question'),
  strengths: z.array(z.string()).describe('Overall strengths across all questions'),
  areas_for_improvement: z.array(z.string()).describe('Overall areas needing improvement'),
  recommendation_reason: z.string().describe('Why this level was recommended based on performance patterns')
})

export async function POST(req: NextRequest) {

  try {
    const formData = await req.formData()
    const languageCode = formData.get('language_code') as string
    const questionsStr = formData.get('questions') as string

    if (!languageCode || !questionsStr) {
      return NextResponse.json(
        { error: 'Language code and questions are required' },
        { status: 400 }
      )
    }

    const questions = JSON.parse(questionsStr)

    // Get language information to determine level system
    const { data: languageData } = await supabase
      .from('speaking_languages')
      .select('*')
      .eq('language_code', languageCode)
      .single()

    const language = languageData || { 
      language_name: 'Unknown Language',
      cefr_supported: false,
      difficulty_levels: ['new', 'beginner', 'intermediate', 'advanced', 'expert']
    }

    // Process all recordings and transcribe them
    const transcriptions: { [key: number]: string } = {}
    const recordings: { [key: number]: File } = {}

    // Collect all recordings
    for (let i = 0; i < questions.length; i++) {
      const recording = formData.get(`recording_${i}`) as File
      if (recording) {
        recordings[i] = recording
      }
    }

    // Transcribe each recording using OpenAI Whisper
    for (const [index, recording] of Object.entries(recordings)) {
      try {
        const transcription = await transcribeAudio(recording)
        transcriptions[parseInt(index)] = transcription
      } catch (error) {
        console.error(`Error transcribing recording ${index}:`, error)
        transcriptions[parseInt(index)] = '[Unable to transcribe]'
      }
    }

    // Evaluate the transcriptions to determine language level
    const evaluationResult = await evaluateLanguageLevel(
      language,
      questions,
      transcriptions
    )

    return NextResponse.json({
      level: evaluationResult.level,
      assessment: evaluationResult.assessment,
      transcriptions,
      message: 'Language level evaluated successfully'
    })

  } catch (error) {
    console.error('Error evaluating language level:', error)
    return NextResponse.json(
      { error: 'Internal server error during evaluation' },
      { status: 500 }
    )
  }
}

async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    // Convert audio file to buffer for Gemini
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    
    // Use Gemini to transcribe the audio
    const { object: transcriptionResult } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        transcription: z.string().describe('Exact transcription of what was spoken in the audio'),
        confidence: z.number().min(0).max(1).describe('Confidence level of transcription (0-1)')
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please transcribe exactly what is spoken in this audio file. Return only the spoken words, no additional commentary.'
            },
            {
              type: 'file',
              data: audioBuffer,
              mimeType: 'audio/webm'
            }
          ]
        }
      ],
      temperature: 0.1 // Low temperature for accurate transcription
    })

    return transcriptionResult.transcription || '[Unable to transcribe]'
  } catch (error) {
    console.error('Error transcribing audio with Gemini:', error)
    return '[Unable to transcribe]'
  }
}

async function evaluateLanguageLevel(
  language: any,
  questions: any[],
  transcriptions: { [key: number]: string }
): Promise<{ level: string; assessment: any }> {
  const levelSystem = language.cefr_supported ? 'CEFR (A1, A2, B1, B2, C1, C2)' : 'new, beginner, intermediate, advanced, expert'
  
  // Prepare evaluation data
  const evaluationData = questions.map((question, index) => ({
    question_text: question.question_text,
    expected_text: question.pronunciation_text,
    user_pronunciation: transcriptions[index] || '[No response]',
    difficulty_level: question.difficulty_level,
    difficulty_score: question.difficulty_score,
    question_id: question.id
  }))

  const prompt = `You are an expert language assessment specialist with extensive experience in evaluating ${language.language_name} pronunciation and speaking proficiency. You must provide a comprehensive assessment with detailed feedback for each question AND an overall level recommendation.

**ASSESSMENT CONTEXT:**
- Language: ${language.language_name}
- Level System: ${levelSystem}
- Available Levels: ${language.difficulty_levels.join(', ')}
- Total Questions: ${questions.length}

**DETAILED ASSESSMENT DATA:**
${evaluationData.map((item, i) => `
=== QUESTION ${i + 1} ===
🎯 Task: ${item.question_text}
📝 Target Phrase: "${item.expected_text}"
🎤 Student Response: "${item.user_pronunciation}"
📊 Question Difficulty: ${item.difficulty_level} (Score: ${item.difficulty_score}/10)
🆔 Question ID: ${item.question_id}
---`).join('\n')}

**REQUIRED OUTPUT FORMAT:**
You must respond with a valid JSON object with this exact structure:

{
  "overall_level": "exact_level_name_from_available_levels",
  "overall_assessment": "2-3 sentence summary of student's overall proficiency",
  "question_feedback": [
    {
      "question_number": 1,
      "question_id": "question_id_here",
      "target_phrase": "exact_target_phrase",
      "student_response": "what_student_said",
      "score": 85,
      "feedback": "Specific feedback about this pronunciation attempt",
      "strengths": ["what they did well"],
      "areas_for_improvement": ["what needs work"],
      "difficulty_assessment": "how well they handled this difficulty level"
    },
    ... repeat for all questions
  ],
  "strengths": ["overall strengths across all questions"],
  "areas_for_improvement": ["overall areas needing improvement"],
  "recommendation_reason": "Why this level was recommended based on performance patterns"
}

**COMPREHENSIVE EVALUATION CRITERIA:**

1. **PRONUNCIATION ACCURACY (40% weight)**
   - How accurately did they pronounce each target phrase?
   - Are individual sounds (vowels, consonants) correct?
   - Do they maintain proper stress patterns and intonation?
   - Consider ${language.language_name}-specific pronunciation challenges

2. **LANGUAGE COMPREHENSION (20% weight)**
   - Did they understand what they were asked to say?
   - Are responses appropriate to the given tasks?
   - Do they demonstrate vocabulary recognition?

3. **DIFFICULTY PROGRESSION PERFORMANCE (25% weight)**
   - How did performance change across difficulty levels?
   - Can they handle simple phrases vs. complex ones?
   - Is there clear deterioration or consistency across levels?

4. **FLUENCY AND NATURALNESS (15% weight)**
   - How natural and fluid does their speech sound?
   - Are there hesitations, false starts, or unclear articulation?
   - Do they speak with appropriate rhythm and flow?

**DETAILED LEVEL CRITERIA FOR ${language.language_name.toUpperCase()}:**

🟢 **${language.difficulty_levels[0]?.toUpperCase() || 'A1'}** (Absolute Beginner):
- Significant pronunciation errors in basic phrases
- Many sounds are unclear or incorrect
- Heavy accent interference from native language
- Difficulty with simple vocabulary recognition
- Score range: 0-25% accuracy on simple phrases

🔵 **${language.difficulty_levels[1]?.toUpperCase() || 'A2'}** (Elementary):
- Can pronounce simple phrases with some clarity
- Basic sounds are recognizable but imperfect
- Struggles with more complex phrases (difficulty 6+)
- Shows understanding of basic vocabulary
- Score range: 25-45% accuracy overall

🟡 **${language.difficulty_levels[2] || 'B1'}** (Intermediate):
- Good pronunciation of simple to medium phrases
- Most basic sounds are correct
- Some difficulty with complex pronunciation patterns
- Clear comprehension of task requirements
- Score range: 45-65% accuracy overall

🟠 **${language.difficulty_levels[3] || 'B2'}** (Upper Intermediate):
- Clear pronunciation with minor accent
- Handles most difficulty levels adequately
- Good stress and intonation patterns
- Consistent performance across questions
- Score range: 65-80% accuracy overall

🔴 **${language.difficulty_levels[4] || 'C1'}** (Advanced):
- Very clear pronunciation with minimal accent
- Handles complex phrases well
- Natural rhythm and intonation
- Excellent consistency across all difficulty levels
- Score range: 80-95% accuracy overall

${language.difficulty_levels[5] ? `🟣 **${language.difficulty_levels[5].toUpperCase()}** (Near-Native):
- Native-like pronunciation quality
- Perfect handling of all complexity levels
- Natural fluency and rhythm
- Minimal to no detectable accent
- Score range: 95-100% accuracy overall` : ''}

**CRITICAL INSTRUCTIONS:**
1. Provide specific feedback for EACH individual question (1-${questions.length})
2. Give each question a score from 0-100 based on pronunciation accuracy
3. Base overall level on ALL responses collectively, weighted by difficulty
4. Ensure "overall_level" uses EXACT level name from: ${language.difficulty_levels.map((l: string) => `"${l}"`).join(', ')}
5. Be encouraging but honest in feedback
6. Consider ${language.language_name}-specific pronunciation patterns

**RESPONSE FORMAT: Valid JSON only - no additional text before or after the JSON object.**`

  console.log('Evaluation prompt being sent to LLM:', prompt)
  console.log('Evaluation data structure:', JSON.stringify(evaluationData, null, 2))

  // Use Gemini to evaluate the language level
  const { object: assessmentResult } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: assessmentSchema,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3
  })

  console.log('LLM evaluation response:', assessmentResult)
  
  try {
    // Validate that we have required fields
    if (!assessmentResult.overall_level || !assessmentResult.question_feedback) {
      throw new Error('Missing required fields in LLM response')
    }
    
    // Ensure the evaluated level is in our available levels
    const availableLevels = language.difficulty_levels.map((l: string) => l.toLowerCase())
    let evaluatedLevel = assessmentResult.overall_level.toLowerCase()
    
    if (!availableLevels.includes(evaluatedLevel)) {
      console.log('Invalid level returned by LLM:', evaluatedLevel, 'Available:', availableLevels)
      // Default to beginner if evaluation result is invalid
      evaluatedLevel = language.difficulty_levels[1] || 'beginner'
      assessmentResult.overall_level = evaluatedLevel
    }
    
    return {
      level: evaluatedLevel,
      assessment: assessmentResult
    }
    
  } catch (error) {
    console.error('Error processing LLM assessment response:', error)
    
    // Fallback assessment if structured response fails
    const availableLevels = language.difficulty_levels.map((l: string) => l.toLowerCase())
    let evaluatedLevel = language.difficulty_levels[1] || 'beginner'
    
    return {
      level: evaluatedLevel,
      assessment: {
        overall_level: evaluatedLevel,
        overall_assessment: 'Assessment completed but detailed feedback unavailable.',
        question_feedback: questions.map((q, i) => ({
          question_number: i + 1,
          question_id: q.id,
          target_phrase: q.pronunciation_text,
          student_response: transcriptions[i] || '[No response]',
          score: 50,
          feedback: 'Unable to provide detailed feedback for this question.',
          strengths: ['Attempted the pronunciation'],
          areas_for_improvement: ['Practice pronunciation clarity'],
          difficulty_assessment: 'Assessment unavailable'
        })),
        strengths: ['Completed the assessment'],
        areas_for_improvement: ['Continue practicing pronunciation'],
        recommendation_reason: 'Based on general assessment'
      }
    }
  }
}