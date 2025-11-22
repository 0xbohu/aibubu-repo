import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { language_code, count = 5 } = await req.json()

    if (!language_code) {
      return NextResponse.json(
        { error: 'Language code is required' },
        { status: 400 }
      )
    }

    // Get questions from database, ordered by difficulty and randomized within each level
    const { data: questions, error } = await supabase
      .from('onboarding_language_questions')
      .select('*')
      .eq('language_code', language_code)
      .eq('is_active', true)
      .order('difficulty_score')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to load questions from database' },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      // If no questions exist for this language, generate them dynamically using OpenAI
      return await generateQuestionsWithAI(language_code, count)
    }

    // Group questions by difficulty level
    const questionsByLevel: { [key: string]: any[] } = {}
    questions.forEach(q => {
      if (!questionsByLevel[q.difficulty_level]) {
        questionsByLevel[q.difficulty_level] = []
      }
      questionsByLevel[q.difficulty_level].push(q)
    })

    // Select questions across different difficulty levels for a good assessment
    const selectedQuestions: any[] = []
    const levels = Object.keys(questionsByLevel).sort()
    
    // Try to get questions from different difficulty levels
    let questionsPerLevel = Math.ceil(count / levels.length)
    
    for (const level of levels) {
      const levelQuestions = questionsByLevel[level]
      const shuffled = levelQuestions.sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(questionsPerLevel, levelQuestions.length))
      selectedQuestions.push(...selected)
      
      if (selectedQuestions.length >= count) break
    }

    // If we don't have enough questions, fill with random ones
    if (selectedQuestions.length < count) {
      const remaining = questions
        .filter(q => !selectedQuestions.find(sq => sq.id === q.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, count - selectedQuestions.length)
      
      selectedQuestions.push(...remaining)
    }

    // Shuffle the final selection
    const finalQuestions = selectedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, count)

    return NextResponse.json({ questions: finalQuestions })

  } catch (error) {
    console.error('Error loading assessment questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateQuestionsWithAI(languageCode: string, count: number) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    )
  }

  try {
    // Get language info to determine if it uses CEFR or custom levels
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

    const levelSystem = language.cefr_supported ? 'CEFR (A1, A2, B1, B2, C1, C2)' : 'Custom (new, beginner, intermediate, advanced, expert)'

    const prompt = `Generate ${count} pronunciation assessment questions for ${language.language_name} language learning.

Language Code: ${languageCode}
Level System: ${levelSystem}
Assessment Type: Speaking/Pronunciation

Requirements:
- Create questions that gradually increase in difficulty
- Each question should test pronunciation ability
- Include the exact text that students should speak aloud
- Questions should help determine the student's proficiency level
- Use appropriate vocabulary and grammar for each level
- Make questions culturally appropriate and practical

Format each question as:
{
  "difficulty_level": "[level]",
  "question_text": "Please say the following phrase:",
  "pronunciation_text": "[text to be spoken]",
  "difficulty_score": [1-10 numeric score]
}

Generate questions covering different difficulty levels to properly assess the student's proficiency.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a language assessment expert. Generate pronunciation questions that help evaluate a student\'s speaking level accurately. Return valid JSON array only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API request failed')
    }

    const data = await response.json()
    const generatedContent = data.choices[0].message.content

    try {
      // Try to parse the JSON response
      let questions = JSON.parse(generatedContent)
      
      // Ensure it's an array
      if (!Array.isArray(questions)) {
        questions = [questions]
      }

      // Add IDs and additional fields
      questions = questions.map((q: any, index: number) => ({
        id: `generated_${Date.now()}_${index}`,
        language_code: languageCode,
        question_type: 'pronunciation',
        ...q
      }))

      return NextResponse.json({ questions })

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json(
        { error: 'Failed to generate valid questions' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('AI question generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions with AI' },
      { status: 500 }
    )
  }
}