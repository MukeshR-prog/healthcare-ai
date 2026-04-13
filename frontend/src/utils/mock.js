import { normalizeFraudValue } from './format'

export function buildFallbackClaims(totalClaims, fraudCases, avgClaimAmount) {
  const safeTotal = Number(totalClaims || 12)
  const safeFraud = Number(fraudCases || Math.max(1, Math.round(safeTotal * 0.2)))
  const safeAverage = Number(avgClaimAmount || 1200)

  return Array.from({ length: Math.min(safeTotal, 20) }).map((_, idx) => {
    const isFraud = idx < safeFraud
    return {
      id: idx + 1,
      provider: `Provider-${(idx % 6) + 1}`,
      amount: Math.round(safeAverage * (0.6 + (idx % 5) * 0.15)),
      fraud: isFraud,
      date: `2026-04-${String((idx % 28) + 1).padStart(2, '0')}`,
    }
  })
}

export function toClaimRows(batchResults = []) {
  return batchResults.map((item, index) => {
    const prediction = item?.fraud_prediction ?? item?.prediction ?? 0
    const confidence = Number(item?.confidence ?? 0)

    return {
      id: index + 1,
      fraud: normalizeFraudValue(prediction),
      confidence,
      prediction,
    }
  })
}
