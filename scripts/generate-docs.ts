import Groq from 'groq-sdk'
import fs from 'fs/promises'
import path from 'path'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const OUTPUT_DIR = path.join(process.cwd(), 'docs/rls-patterns')

const patterns = [
  {
    filename: '01-basic-row-ownership.md',
    topic: 'Basic row ownership in Supabase RLS — where a user_id column links rows to auth.users. Cover when to use it, the SQL for SELECT, INSERT, UPDATE, DELETE, and common mistakes.',
  },
  {
    filename: '02-multi-tenant-isolation.md',
    topic: 'Multi-tenant RLS in Supabase — where rows belong to an organization or team, not just a single user. Cover tenant_id patterns, how to store tenant membership, and policies for all operations.',
  },
  {
    filename: '03-public-read-private-write.md',
    topic: 'Public read with private write RLS pattern in Supabase — for tables like blog posts or articles where anyone can read but only owners can write. Cover all four operations.',
  },
  {
    filename: '04-admin-bypass.md',
    topic: 'Admin bypass RLS pattern in Supabase — where admin users can access all rows regardless of ownership. Cover role-based detection using a profiles table or custom claims in JWT metadata.',
  },
  {
    filename: '05-join-based-policies.md',
    topic: 'Join-based RLS policies in Supabase — where ownership is determined through a related table, not a direct column. For example: a comments table that joins to posts to check ownership.',
  },
  {
    filename: '06-insert-only-tables.md',
    topic: 'Insert-only RLS pattern in Supabase — for tables like audit logs or event tracking where users can insert but never read or modify their own rows.',
  },
  {
    filename: '07-profiles-table-pattern.md',
    topic: 'Profiles table RLS pattern in Supabase — where the table id column directly references auth.users(id). Cover why auth.uid() = id is the correct pattern and how to handle public profile visibility.',
  },
  {
    filename: '08-authenticated-only-access.md',
    topic: 'Authenticated-only access RLS pattern in Supabase — for tables with no ownership column where any logged-in user can access all rows. Cover when this is appropriate and security considerations.',
  },
]

async function generateDocument(topic: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `You are a Supabase RLS expert. Write a detailed technical document about the following topic:

${topic}

Structure the document with these sections:
# [Pattern Name]
## Overview
## When to Use
## SQL Example
## Variations
## Edge Cases and Common Mistakes

Write in clear technical English. Include real SQL code blocks. Be specific to Supabase syntax.`,
      },
    ],
  })

  return completion.choices[0]?.message?.content?.trim() ?? ''
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  for (const pattern of patterns) {
    console.log(`Generating: ${pattern.filename}...`)

    const content = await generateDocument(pattern.topic)
    const filePath = path.join(OUTPUT_DIR, pattern.filename)
    await fs.writeFile(filePath, content, 'utf-8')

    console.log(`✓ Saved: ${pattern.filename}`)

    // Small delay to avoid Groq rate limiting
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log('\n✅ All documents generated in docs/rls-patterns/')
}

main().catch(console.error)