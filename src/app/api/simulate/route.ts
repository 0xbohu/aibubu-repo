import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { code, input } = await req.json()
    
    // Basic simulation - in a real app, this would run the code in a sandboxed environment
    let result = ''
    let error = null
    
    try {
      // Create a safe execution context for the user's code
      const safeCode = `
        // User's code wrapped for simulation
        ${code}
        
        // Try to execute the main function
        let output = '';
        if (typeof createGreetingAgent === 'function') {
          output = createGreetingAgent();
        } else if (typeof createCalculatorAgent === 'function') {
          output = createCalculatorAgent("${input || '2+2'}");
        } else if (typeof createStoryAgent === 'function') {
          output = createStoryAgent("${input || 'adventure'}");
        } else {
          output = 'No valid agent function found. Make sure your function is named correctly!';
        }
        
        output;
      `
      
      // Simple simulation - just return what would happen
      if (code.includes('createGreetingAgent')) {
        if (code.includes('Hello') || code.includes('hello')) {
          result = 'Hello, I am your AI assistant!'
        } else {
          result = 'Your greeting agent is working, but try adding a greeting message!'
        }
      } else if (code.includes('createCalculatorAgent')) {
        result = 'Your calculator agent processed: ' + (input || '2+2') + ' = ' + eval(input || '2+2')
      } else if (code.includes('createStoryAgent')) {
        result = `Once upon a time, there was an adventure about ${input || 'coding'}...`
      } else {
        result = 'Agent created! Try running it with some input.'
      }
    } catch (err: any) {
      error = err.message
    }
    
    return NextResponse.json({ 
      success: !error,
      result: error || result,
      error: error ? true : false
    })
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      result: 'Simulation error occurred',
      error: true
    }, { status: 500 })
  }
}