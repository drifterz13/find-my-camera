import { Item } from '../types'

const MAX_ITEMS = 30
const MAX_PRICE = 3000

export function getRecommendItems(items: Item[]): Item[] {
  const sortedItems = items.sort((a, b) => {
    return b.price - a.price
  })

  const recommendItems = sortedItems
    .filter((item) => item.price < MAX_PRICE)
    .slice(0, MAX_ITEMS)

  return recommendItems
}
