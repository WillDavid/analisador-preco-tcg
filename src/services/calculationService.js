const DEFAULT_PRICE_FIELD = 'buyMin'

export function getCollectionTotal(historyRecords, priceField = DEFAULT_PRICE_FIELD) {
  return historyRecords.reduce((sum, h) => {
    const price = h.prices[priceField]
    if (price == null || isNaN(price)) return sum
    return sum + price * (h.quantity || 1)
  }, 0)
}

export function getTotalCards(historyRecords) {
  return historyRecords.length
}

export function getTotalUnits(historyRecords) {
  return historyRecords.reduce((sum, h) => sum + (h.quantity || 1), 0)
}

export function calcVariation(current, previous, quantity = 1) {
  const value = (current - previous) * quantity
  const percent = previous > 0 ? ((current - previous) / previous) * 100 : 0
  return { value, percent }
}

export function computeComparison(currentHistory, previousHistory, priceField = DEFAULT_PRICE_FIELD) {
  const prevMap = new Map()
  for (const h of previousHistory) {
    prevMap.set(h.uniqueKey, h)
  }

  const results = []
  for (const h of currentHistory) {
    const prev = prevMap.get(h.uniqueKey)
    const currentPrice = h.prices[priceField] ?? 0
    const previousPrice = prev?.prices[priceField] ?? null
    const variation = calcVariation(currentPrice, previousPrice ?? currentPrice, h.quantity || 1)

    results.push({
      ...h,
      previousPrice: previousPrice,
      currentPrice: currentPrice,
      variationValue: variation.value,
      variationPercent: variation.percent,
      isNew: prev === undefined,
      quantityChanged: prev && prev.quantity !== h.quantity
    })
  }

  for (const h of previousHistory) {
    if (!currentHistory.find(c => c.uniqueKey === h.uniqueKey)) {
      results.push({
        ...h,
        previousPrice: h.prices[priceField] ?? 0,
        currentPrice: null,
        variationValue: -(h.prices[priceField] ?? 0) * (h.quantity || 1),
        variationPercent: -100,
        isRemoved: true
      })
    }
  }

  return results
}

export function getTopGainers(comparison, limit = 5) {
  return [...comparison]
    .filter(c => !c.isRemoved && c.variationPercent > 0)
    .sort((a, b) => b.variationPercent - a.variationPercent)
    .slice(0, limit)
}

export function getTopLosers(comparison, limit = 5) {
  return [...comparison]
    .filter(c => !c.isNew && !c.isRemoved && c.variationPercent < 0)
    .sort((a, b) => a.variationPercent - b.variationPercent)
    .slice(0, limit)
}
