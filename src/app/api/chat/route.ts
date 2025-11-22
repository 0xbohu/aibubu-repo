import { google } from '@ai-sdk/google'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, mode = 'chat' } = await req.json()

  const systemPrompt = mode === 'coding' 
    ? `You are a friendly AI coding tutor for kids learning AI development. 
       Help them write TypeScript code to create AI agents. 
       Keep explanations simple, use examples, and be encouraging.
       When showing code, explain what each part does in kid-friendly language.
       Always respond with working TypeScript code that they can copy and use.
       Focus on creating simple, understandable functions that demonstrate AI concepts.`
    : `You are a helpful AI assistant teaching kids about AI and coding.
       Explain concepts in simple terms with fun examples.
       Be encouraging and make learning fun!
       Use analogies and metaphors that kids can understand.`

  const result = await streamText({
    model: google('gemini-2.5-flash'),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    maxTokens: 1000,
  })

  return result.toDataStreamResponse()
}