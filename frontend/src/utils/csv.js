export function parseCsv(text) {
  if (!text?.trim()) {
    return []
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = lines[0].split(',').map((h) => h.trim())

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    return headers.reduce((acc, header, index) => {
      const rawValue = values[index] ?? ''
      const asNumber = Number(rawValue)
      acc[header] = Number.isNaN(asNumber) || rawValue === '' ? rawValue : asNumber
      return acc
    }, {})
  })
}
