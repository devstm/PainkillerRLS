import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DOCS_DIR = path.join(process.cwd(), 'docs/rls-patterns')
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY!
const EMBEDDING_MODEL = 'BAAI/bge-base-en-v1.5'

// ─── Chunker ─────────────────────────────────────────────────────────────────

function chunkByHeading(content: string, filename: string): { text: string; filename: string }[] {
  const sections = content.split(/\n(?=## )/)
  return sections
    .map((s) => s.trim())
    .filter((s) => s.length > 50)
    .map((text) => ({ text, filename }))
}

// ─── Embedder ─────────────────────────────────────────────────────────────────

async function getEmbedding(text: string, retries = 5): Promise<number[]> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(
      `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}/pipeline/feature-extraction`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    )

    if (res.status === 503 || res.status === 504) {
      const waitTime = (i + 1) * 5000
      console.log(`Model loading, waiting ${waitTime / 1000}s before retry ${i + 1}/${retries}...`)
      await new Promise((r) => setTimeout(r, waitTime))
      continue
    }

    const data = await res.json()
    if (Array.isArray(data[0])) return data[0]
    return data
  }

  throw new Error('HuggingFace model failed to respond after retries')
}
// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const files = (await fs.readdir(DOCS_DIR)).filter((f) => f.endsWith('.md'))
  console.log(`Found ${files.length} documents\n`)

  for (const file of files) {
    const content = await fs.readFile(path.join(DOCS_DIR, file), 'utf-8')
    const chunks = chunkByHeading(content, file)

    console.log(`Processing ${file} — ${chunks.length} chunks`)

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.text)

      const { error } = await supabase.from('rls_docs').insert({
        filename: chunk.filename,
        content: chunk.text,
        embedding,
      })

      if (error) {
        console.error(`✗ Failed to insert chunk from ${file}:`, error.message)
      } else {
        console.log(`  ✓ Inserted chunk`)
      }

      // Small delay to avoid HF rate limiting
      await new Promise((r) => setTimeout(r, 500))
    }

    console.log(`✓ Done: ${file}\n`)
  }

  console.log('✅ Knowledge base ready in Supabase pgvector!')
}

main().catch(console.error)