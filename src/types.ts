export type RawItem = {
  auctionId: string
  title: string
  image: string
  price: number
  timeRemaining: string
}

export type Item = {
  auctionId: string
  title: string
  image: string
  price: number
  timeRemaining: number
  createdAt: string
}
