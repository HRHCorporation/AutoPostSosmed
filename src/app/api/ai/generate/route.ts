import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

async function generateWithGemini(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey?.trim()) throw new Error('GEMINI_API_KEY is missing. Check your .env file.')

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  const parts: any[] = response.candidates?.[0]?.content?.parts ?? []
  const textPart = parts.find((p: any) => !p.thought && typeof p.text === 'string' && p.text.length > 0)
  const result = textPart?.text ?? response.text ?? ''
  if (!result) throw new Error('Empty response from Gemini')
  return result
}

async function generateWithDeepSeek(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey?.trim()) throw new Error('DEEPSEEK_API_KEY is missing. Check your .env file.')

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
  })

  const result = response.choices[0]?.message?.content ?? ''
  if (!result) throw new Error('Empty response from DeepSeek')
  return result
}

export async function POST(req: Request) {
  try {
    const { prompt, type, model = 'gemini' } = await req.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt cannot be empty' }, { status: 400 })
    }

    let systemPrompt = 'You are a professional LinkedIn post creator. Write engaging, professional posts.'
    if (type === 'rewrite') systemPrompt = 'You are a skilled editor. Rewrite the following content to be more engaging and professional.'
    if (type === 'hashtags') systemPrompt = 'Generate 5 highly relevant hashtags for the following content. Return only the hashtags separated by spaces.'

    let result: string
    if (model === 'deepseek') {
      result = await generateWithDeepSeek(prompt, systemPrompt)
    } else {
      result = await generateWithGemini(prompt, systemPrompt)
    }

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('AI Generate Error:', error)
    const message = error?.message ?? 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
