import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'
import {
  getRecentMessages,
  countMessages,
  getSemanticMessages,
  saveMessages,
} from '@/lib/chat-memory'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

function buildSystemPrompt(schema: string, migration: string): string {
  return `You are an RLS (Row Level Security) expert assistant for Supabase projects.

The user has just generated RLS policies for their database. You have full context of their schema and the generated migration file.

Your job is to:
- Explain any policy in plain English when asked
- Debug migration errors the user pastes
- Suggest improvements or alternative approaches
- Answer any RLS-related question specific to their project
- If the user asks to modify a policy, provide the corrected SQL only for that specific policy

Always be specific to THEIR schema and migration — never give generic answers.
Keep responses concise and technical. Use code blocks for any SQL.

--- THEIR SCHEMA ---
${schema.slice(0, 1500)}

--- GENERATED MIGRATION ---
${migration.slice(0, 3000)}`
}

export async function POST(req: NextRequest) {
  try {
    const { message, schema, migration, conversationId } = await req.json()

    if (!message || !schema || !migration || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Recency window
    const recentMessages = await getRecentMessages(conversationId)
    const recentIds = recentMessages.map((m) => m.id)

    // Semantic retrieval only kicks in after 10 stored messages
    const total = await countMessages(conversationId)
    const semanticMessages = total > 10
      ? await getSemanticMessages(message, conversationId, recentIds)
      : []

    const groqMessages = [
      ...semanticMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: `[retrieved memory]\n${m.content}`,
      })),
      ...recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt(schema, migration) },
        ...groqMessages,
      ],
    })

    let assistantContent = ''
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            assistantContent += text
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
        await saveMessages(conversationId, message, assistantContent)
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
