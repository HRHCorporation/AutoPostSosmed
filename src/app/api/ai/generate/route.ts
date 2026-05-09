import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // Authentication disabled - no user check required

    const { prompt, type } = await req.json()

    let systemPrompt = 'You are a professional LinkedIn post creator.'
    if (type === 'rewrite') systemPrompt = 'You are a skilled editor.'
    if (type === 'hashtags') systemPrompt = 'Generate 5 highly relevant LinkedIn hashtags.'

    // Check if GEMINI_API_KEY is actually present
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing or empty. Please check your .env.local file.' }, { status: 400 })
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt
        }
      });
      
      // Safety fallback in case response.text is not a direct property or is undefined
      let finalResult = ''
      if (response.text) {
        finalResult = response.text
      } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        finalResult = response.candidates[0].content.parts[0].text
      } else {
        return NextResponse.json({ error: 'Unexpected response format from Gemini: ' + JSON.stringify(response) }, { status: 500 })
      }

      return NextResponse.json({ result: finalResult })
    } catch (apiError: any) {
      console.error('Gemini API Error:', apiError)
      // Extract specific google API error details if present
      const detailedMessage = apiError?.message || apiError?.error?.message || JSON.stringify(apiError)
      return NextResponse.json({ error: `Gemini API Error: ${detailedMessage}` }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Server Route Error:', error)
    return NextResponse.json({ error: error.message || 'Unknown server error' }, { status: 500 })
  }
}
