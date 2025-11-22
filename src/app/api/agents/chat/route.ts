import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { messages, agentId, systemPrompt } = await req.json()

    if (!agentId) {
      return new Response('Agent ID is required', { status: 400 })
    }

    // If systemPrompt is provided directly, use it. Otherwise fetch from database.
    let finalSystemPrompt = systemPrompt

    if (!finalSystemPrompt) {
      // Fetch agent from database to get the generated_prompt
      const { data: agent, error } = await supabase
        .from('user_agents')
        .select('generated_prompt, name')
        .eq('id', agentId)
        .single()

      if (error || !agent) {
        return new Response('Agent not found', { status: 404 })
      }

      finalSystemPrompt = agent.generated_prompt
    }

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...messages,
      ],
      temperature: 0.8,
      maxTokens: 1000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Error in agent chat:', error)
    return new Response('Internal server error', { status: 500 })
  }
}