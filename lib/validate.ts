interface ValidationResult {
  valid: boolean
  message?: string
}

export function validateSchema(sql: string): ValidationResult {
  if (!sql || sql.trim().length === 0) {
    return {
      valid: false,
      message: 'Schema is empty. Please paste a valid SQL schema.',
    }
  }

  const normalized = sql.trim().toUpperCase()

  if (!normalized.includes('CREATE TABLE')) {
    return {
      valid: false,
      message: 'No CREATE TABLE statement found. Please paste a valid SQL schema.',
    }
  }

  const tableMatch = sql.match(/CREATE\s+TABLE\s+\S+\s*\(([^)]+)\)/gis)
  if (!tableMatch) {
    return {
      valid: false,
      message: 'Tables appear to have no columns defined. Please check your schema.',
    }
  }

  const hasColumns = tableMatch.some((table) => {
    const body = table.match(/\(([^)]+)\)/s)?.[1] ?? ''
    const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    return lines.length >= 1
  })

  if (!hasColumns) {
    return {
      valid: false,
      message: 'Tables appear to have no columns defined. Please check your schema.',
    }
  }

  return { valid: true }
}