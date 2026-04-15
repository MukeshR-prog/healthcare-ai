export function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value) {
  const numeric = Number(value || 0)
  return `${Math.round(numeric * 100)}%`
}

export function normalizeFraudValue(value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim()
    return normalized === '1' || normalized === 'true' || normalized === 'fraud'
  }

  return false
}
