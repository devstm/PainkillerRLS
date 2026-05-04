export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    'https://router.huggingface.co/hf-inference/models/BAAI/bge-base-en-v1.5/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  )
  const data = await res.json()
  if (Array.isArray(data[0])) return data[0]
  return data
}
