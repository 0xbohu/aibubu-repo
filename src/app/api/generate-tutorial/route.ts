import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { createSupabaseAdmin } from '@/lib/supabase'

type TutorialType = 'maths' | 'thinking' | 'reading' | 'writing' | 'science' | 'agent'

interface GenerateTutorialRequest {
  baseTutorialId: string
  playerId: string
  difficultyAdjustment?: number // -1 to 1 to adjust difficulty
}

interface GeneratedTutorial {
  id: string
  title: string
  content_screens: any
  questions: any
  estimated_points: number
}

export async function POST(req: NextRequest) {
  try {
    const { baseTutorialId, playerId, difficultyAdjustment = 0 }: GenerateTutorialRequest = await req.json()

    if (!baseTutorialId || !playerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use admin client for server-side operations
    const supabase = createSupabaseAdmin()

    // Get base tutorial
    const { data: baseTutorial, error: tutorialError } = await supabase
      .from('tutorials')
      .select('*')
      .eq('id', baseTutorialId)
      .single()

    if (tutorialError) {
      console.error('Error fetching base tutorial:', tutorialError)
      return NextResponse.json(
        { error: 'Failed to fetch base tutorial' },
        { status: 500 }
      )
    }

    if (!baseTutorial) {
      console.error('Base tutorial not found:', baseTutorialId)
      return NextResponse.json(
        { error: 'Base tutorial not found' },
        { status: 404 }
      )
    }

    // Get player progress to determine appropriate difficulty
    const { data: playerProgress } = await supabase
      .from('player_progress')
      .select('*')
      .eq('player_id', playerId)

    const { data: playerData } = await supabase
      .from('players')
      .select('total_points, current_level')
      .eq('id', playerId)
      .single()

    // Calculate appropriate difficulty based on player progress
    const adjustedDifficulty = calculateDifficultyLevel(
      baseTutorial,
      playerProgress || [],
      playerData,
      difficultyAdjustment
    )

    // Generate new tutorial content
    const generatedContent = await generateTutorialContent(
      baseTutorial,
      adjustedDifficulty,
      playerData
    )

    // Check if points would exceed daily cap
    const pointsCap = await checkDailyPointsCap(supabase, playerId, generatedContent.estimated_points)
    if (!pointsCap.canEarn) {
      return NextResponse.json(
        { error: 'Daily points limit reached', dailyLimit: pointsCap.dailyLimit },
        { status: 429 }
      )
    }

    // Save generated tutorial
    const { data: savedTutorial, error: insertError } = await supabase
      .from('generated_tutorials')
      .insert({
        base_tutorial_id: baseTutorialId,
        player_id: playerId,
        generated_content: generatedContent.content_screens,
        generated_questions: generatedContent.questions,
        points_awarded: Math.min(generatedContent.estimated_points, pointsCap.availablePoints)
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting generated tutorial:', insertError)
      return NextResponse.json(
        { error: 'Failed to save generated tutorial' },
        { status: 500 }
      )
    }

    if (!savedTutorial) {
      console.error('No tutorial data returned after insert')
      return NextResponse.json(
        { error: 'Failed to save generated tutorial' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tutorial: {
        id: savedTutorial.id,
        title: generatedContent.title,
        content_screens: generatedContent.content_screens,
        questions: generatedContent.questions,
        max_points: Math.min(generatedContent.estimated_points, pointsCap.availablePoints),
        difficulty_level: adjustedDifficulty,
        tutorial_type: baseTutorial.tutorial_type,
        age_min: baseTutorial.age_min,
        age_max: baseTutorial.age_max
      }
    })

  } catch (error) {
    console.error('Error generating tutorial:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateDifficultyLevel(
  baseTutorial: any,
  playerProgress: any[],
  playerData: any,
  adjustment: number
): number {
  let difficulty = baseTutorial.difficulty_level

  // Adjust based on player performance
  if (playerData) {
    const completedTutorials = playerProgress.filter(p => p.status === 'completed').length
    const averageScore = playerProgress.length > 0 
      ? playerProgress.reduce((sum, p) => sum + (p.points_earned || 0), 0) / playerProgress.length 
      : 0

    // Increase difficulty for experienced players
    if (completedTutorials > 10 && averageScore > 80) {
      difficulty += 0.5
    } else if (completedTutorials < 3 || averageScore < 50) {
      difficulty -= 0.5
    }
  }

  // Apply manual adjustment
  difficulty += adjustment

  // Keep within bounds
  return Math.max(1, Math.min(6, Math.round(difficulty)))
}

async function generateTutorialContent(
  baseTutorial: any,
  difficulty: number,
  playerData: any
): Promise<GeneratedTutorial> {
  const prompt = createTutorialGenerationPrompt(baseTutorial, difficulty, playerData)

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt,
    temperature: 0.7,
    maxTokens: 2000
  })

  return parseTutorialResponse(text, baseTutorial, difficulty)
}

function createTutorialGenerationPrompt(
  baseTutorial: any,
  difficulty: number,
  playerData: any
): string {
  return `
You are an AI tutor creating educational content for children. Generate a new tutorial based on the provided template.

CRITICAL SAFETY REQUIREMENTS:
- Content MUST be completely appropriate for children aged ${baseTutorial.age_min}-${baseTutorial.age_max}
- NEVER include anything sexual, violent, inappropriate, or age-restricted
- NO references to drugs, alcohol, gambling, or adult themes
- Keep all content educational, positive, and encouraging
- Use only child-friendly examples and scenarios
- Focus on learning, growth, and positive values

Base Tutorial: ${baseTutorial.title}
Subject: ${baseTutorial.tutorial_type}
Target Difficulty: ${difficulty}/6 (1=very easy, 6=challenging)
Age Range: ${baseTutorial.age_min}-${baseTutorial.age_max} years

Learning Objectives: ${baseTutorial.learning_objectives.join(', ')}

Create a NEW tutorial with similar learning goals but different content. Include:

1. A creative title related to the subject
2. 2-3 content screens with engaging explanations
3. 2-4 questions appropriate for the difficulty level
4. Age-appropriate language and examples

Respond in JSON format:
{
  "title": "Creative title for new tutorial",
  "content_screens": {
    "screens": [
      {
        "type": "content",
        "title": "Screen title",
        "content": "Educational content with examples (100-200 words)",
        "image": "descriptive_image_name.png"
      }
    ]
  },
  "questions": {
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice|input|textarea",
        "question": "Age-appropriate question",
        "options": ["option1", "option2", "option3"] (if multiple choice),
        "correct": "correct answer",
        "min_words": number (if textarea)
      }
    ]
  },
  "estimated_points": number (10-50 based on difficulty and question count)
}

Difficulty Guidelines:
- Level 1-2: Very simple concepts, basic vocabulary, generous point rewards
- Level 3-4: Moderate complexity, some reasoning required
- Level 5-6: Complex thinking, analysis, and application skills

Make content engaging with:
- Relatable examples from daily life
- Fun analogies and comparisons  
- Encouraging, positive tone
- Clear explanations with examples
- Questions that build on content

REMEMBER: All content must be 100% appropriate for children. Focus on education, creativity, and positive learning experiences.
`
}

function parseTutorialResponse(
  response: string,
  baseTutorial: any,
  difficulty: number
): GeneratedTutorial {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        id: '', // Will be set after database insert
        title: parsed.title || `New ${baseTutorial.tutorial_type} Challenge`,
        content_screens: parsed.content_screens || { screens: [] },
        questions: parsed.questions || { questions: [] },
        estimated_points: Math.max(10, Math.min(100, parsed.estimated_points || 20))
      }
    }
  } catch (error) {
    console.error('Error parsing tutorial response:', error)
  }

  // Fallback if parsing fails
  return {
    id: '',
    title: `Custom ${baseTutorial.tutorial_type} Practice`,
    content_screens: {
      screens: [{
        type: 'content',
        title: 'Practice Time!',
        content: 'Let\'s practice what you\'ve learned with some new challenges!',
        image: 'practice_time.png'
      }]
    },
    questions: {
      questions: [{
        id: 'q1',
        type: 'textarea',
        question: 'What did you learn from the previous tutorial? Explain in your own words.',
        min_words: 15
      }]
    },
    estimated_points: 15
  }
}

async function checkDailyPointsCap(supabase: any, playerId: string, requestedPoints: number) {
  const today = new Date().toISOString().split('T')[0]
  
  // Get today's generated tutorial points
  const { data: todaysTutorials } = await supabase
    .from('generated_tutorials')
    .select('points_awarded')
    .eq('player_id', playerId)
    .gte('created_at', today)
    .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  const dailyPointsEarned = todaysTutorials?.reduce((sum: number, t: any) => sum + t.points_awarded, 0) || 0
  const dailyLimit = 100 // Maximum points per day from generated content
  
  return {
    canEarn: dailyPointsEarned < dailyLimit,
    dailyLimit,
    earnedToday: dailyPointsEarned,
    availablePoints: Math.max(0, dailyLimit - dailyPointsEarned)
  }
}