import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { supabase } from '@/lib/supabase'

type TutorialType = 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent'

interface ValidationRequest {
  tutorialId: string
  questionId: string
  answer: string
  tutorialType: TutorialType
}

interface ValidationResponse {
  isCorrect: boolean
  feedback: string
  points: number
  explanation?: string
}

export async function POST(req: NextRequest) {
  try {
    const { tutorialId, questionId, answer, tutorialType }: ValidationRequest = await req.json()

    if (!tutorialId || !questionId || !answer || !tutorialType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get tutorial and question data
    const { data: tutorial } = await supabase
      .from('tutorials')
      .select('*')
      .eq('id', tutorialId)
      .single()

    if (!tutorial) {
      return NextResponse.json(
        { error: 'Tutorial not found' },
        { status: 404 }
      )
    }

    // Find the specific question
    const questions = tutorial.questions?.questions || []
    const question = questions.find((q: any) => q.id === questionId)

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Generate validation prompt based on tutorial type
    const validationPrompt = generateValidationPrompt(tutorialType, question, answer, tutorial)

    // Use Google Gemini to validate the answer
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: validationPrompt,
      temperature: 0.3,
    })

    // Parse the LLM response
    const validation = parseLLMResponse(text, question, tutorialType)

    return NextResponse.json(validation)

  } catch (error) {
    console.error('Error validating answer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateValidationPrompt(
  tutorialType: TutorialType, 
  question: any, 
  answer: string, 
  tutorial: any
): string {
  const basePrompt = `
You are an AI tutor helping children learn. Please evaluate this student's answer with kindness and constructive feedback.

IMPORTANT SAFETY GUIDELINES:
- This is content for children aged ${tutorial.age_min}-${tutorial.age_max}
- Keep all content completely appropriate, safe, and educational
- Never include anything sexual, violent, inappropriate, or age-restricted
- If student's answer contains inappropriate content, gently redirect to the learning topic
- Focus purely on educational content and positive encouragement

Tutorial: ${tutorial.title}
Subject: ${tutorialType}
Age Group: ${tutorial.age_min}-${tutorial.age_max} years
Difficulty Level: ${tutorial.difficulty_level}/6

Question: ${question.question}
Student's Answer: ${answer}

Please respond in JSON format with:
{
  "isCorrect": boolean,
  "feedback": "encouraging feedback message (50-100 words)",
  "points": number (0-10 based on answer quality and age-appropriate expectations),
  "explanation": "brief explanation if answer needs improvement"
}

Age-Appropriate Guidelines:
- Ages 5-7: Very simple language, lots of encouragement, focus on effort over perfection
- Ages 8-10: Encouraging but more detailed feedback, introduce reasoning concepts  
- Ages 11-12: Challenge critical thinking while remaining supportive and constructive

Difficulty-Based Expectations:
- Level 1-2: Award points generously for any reasonable attempt
- Level 3-4: Expect more detailed reasoning but still encourage effort
- Level 5-6: Higher standards but provide constructive guidance for improvement

Guidelines:
- Be encouraging and supportive
- Award partial credit for good effort  
- Provide helpful hints for improvement
- Use age-appropriate language
- Focus on learning, not just correctness
- Never reference inappropriate content even if student mentions it
`

  // Add subject-specific evaluation criteria
  switch (tutorialType) {
    case 'maths':
      return basePrompt + `
Math-specific criteria:
- Check calculation accuracy
- Award points for correct method even if final answer is wrong
- Look for logical reasoning steps
- Consider alternative valid approaches
${question.correct ? `Expected answer: ${question.correct}` : ''}
`

    case 'thinking':
      return basePrompt + `
Critical thinking criteria:
- Evaluate reasoning quality over "right" answers
- Look for evidence-based conclusions
- Consider multiple perspectives shown
- Reward creative problem-solving approaches
`

    case 'reading':
      return basePrompt + `
Reading comprehension criteria:
- Check understanding of main ideas
- Look for evidence from the text
- Evaluate inference and analysis skills
- Consider vocabulary understanding
${question.correct ? `Key points to look for: ${question.correct}` : ''}
`

    case 'writing':
      return basePrompt + `
Creative writing criteria:
- Evaluate creativity and imagination
- Check for coherent narrative structure
- Consider age-appropriate vocabulary use
- Look for character and plot development
- Grammar is less important than creativity
`

    case 'science':
      return basePrompt + `
Science criteria:
- Check for scientific accuracy
- Evaluate understanding of concepts
- Look for evidence-based reasoning
- Consider observation and hypothesis skills
${question.correct ? `Scientific concept: ${question.correct}` : ''}
`

    default:
      return basePrompt
  }
}

function parseLLMResponse(
  llmResponse: string, 
  question: any, 
  tutorialType: TutorialType
): ValidationResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        isCorrect: Boolean(parsed.isCorrect),
        feedback: parsed.feedback || 'Great effort! Keep learning!',
        points: Math.max(0, Math.min(10, parseInt(parsed.points) || 0)),
        explanation: parsed.explanation
      }
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error)
  }

  // Fallback parsing for non-JSON responses
  const isCorrect = llmResponse.toLowerCase().includes('correct') || 
                   llmResponse.toLowerCase().includes('right') ||
                   llmResponse.toLowerCase().includes('good')

  return {
    isCorrect,
    feedback: isCorrect 
      ? 'Well done! Your answer shows good understanding.' 
      : 'Good try! There\'s room for improvement - keep practicing!',
    points: isCorrect ? 8 : 3,
    explanation: isCorrect ? undefined : 'Consider reviewing the material and trying again.'
  }
}