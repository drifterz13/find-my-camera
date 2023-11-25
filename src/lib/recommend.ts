import { Item } from '../types'

const MAX_PRICE = 3000

export function getRecommendItems(items: Item[]): Item[] {
  const sortedItems = items.sort((a, b) => {
    return a.price - b.price
  })

  const recommendItems = sortedItems.filter((item) => item.price < MAX_PRICE)

  return recommendItems
}
