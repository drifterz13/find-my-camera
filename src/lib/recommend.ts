import { Item } from '../types'

const MAX_PRICE = 3000

const recommendCanonModelTokens: string[][] = [
  ['canon', 'ixy', '10s'],
  ['canon', 'ixy', '25is'],
  ['canon', 'ixy', '30s'],
  ['canon', 'ixy', '31s'],
  ['canon', 'ixy', '50'],
  ['canon', 'ixy', '55'],
  ['canon', 'ixy', '105is'],
  ['canon', 'ixy', '200f'],
  ['canon', 'ixy', '420f'],
  ['canon', 'ixy', '510is'],
  ['canon', 'ixy', '900is'],
  ['canon', 'ixy', '930is'],
]

function isRecommendCanonModel(title: string): boolean {
  return recommendCanonModelTokens.some((tokens) => {
    return tokens.every((token) => title.toLowerCase().includes(token))
  })
}

function addModelTag(item: Item): Item {
  const recommendModel =
    recommendCanonModelTokens.find((tokens) => {
      return tokens.every((token) => item.title.toLowerCase().includes(token))
    }) || []

  if (recommendModel.length === 0) {
    return item
  }

  const [_, ...modelTokens] = recommendModel

  return { ...item, model: modelTokens.join('-') }
}

export function getRecommendItems(items: Item[]): Item[] {
  const sortedItems = items.sort((a, b) => {
    return a.price - b.price
  })

  const recommendItems = sortedItems
    .filter((item) => item.price < MAX_PRICE)
    .filter((item) => isRecommendCanonModel(item.title))
    .map(addModelTag)

  return recommendItems
}
