import { Item } from '../types'

const MAX_ITEMS = 30

export function getRecommendItems(items: Item[]): Item[] {
  const sortedItems = items.sort((a, b) => {
    return b.price - a.price
  })

  const recommendItems = sortedItems.slice(0, MAX_ITEMS)

  return recommendItems
}
