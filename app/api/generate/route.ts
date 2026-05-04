import { NextRequest, NextResponse } from 'next/server'
import { runPipelineGenerator } from '@/lib/pipeline'
import { validateSchema } from '@/lib/validate'
// import { createClient } from '@supabase/supabase-js'

async function fetchSchemaFromSupabase(projectRef: string, serviceKey: string): Promise<string> {
  const response = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch schema. Check your Project ID and Service Role Key.')
  }

  const spec = await response.json()

  const definitions = spec.definitions ?? {}

  if (Object.keys(definitions).length === 0) {
    throw new Error('No public tables found in this Supabase project.')
  }

  const tables: string[] = []

  for (const [tableName, tableDef] of Object.entries(definitions)) {
    const def = tableDef as {
      properties?: Record<string, { type?: string; format?: string }>
    }
    const columns = Object.entries(def.properties ?? {}).map(
      ([colName, colDef]) => `${colName} (${colDef.format ?? colDef.type ?? 'unknown'})`
    )
    tables.push(`TABLE ${tableName}:\n  ${columns.join('\n  ')}`)
  }

  return tables.join('\n\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode } = body

    let schema: string

    if (mode === 'paste') {
      const validation = validateSchema(body.sql)
      if (!validation.valid) {
        console.log('validation: ', validation);
        return NextResponse.json({ error: validation.message }, { status: 400 })
      }
      schema = body.sql
    } else if (mode === 'connect') {
      if (!body.projectRef || !body.serviceKey) {
        return NextResponse.json({ error: 'Supabase URL and Service Key are required.' }, { status: 400 })
      }
      schema = await fetchSchemaFromSupabase(body.projectRef, body.serviceKey)
    } else {
      return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of runPipelineGenerator(schema)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unexpected pipeline error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}