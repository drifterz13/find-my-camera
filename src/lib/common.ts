import fs from 'fs'
import path from 'path'
import { Item, RawItem } from '../types'
import { convertTimeStringToNumber } from './time'

export function deleteScrapedFiles() {
  console.log('Deleing old scraped files... 🗑')

  const directoryPath = path.resolve(process.cwd(), 'scraped')
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      throw err
    }

    for (const file of files) {
      fs.unlink(path.join(directoryPath, file), (err) => {
        if (err) throw err
      })
    }
  })
}

export function saveResult(result: Item[]) {
  const key = new Date().toISOString()
  const filePath = path.resolve(process.cwd(), 'scraped', `${key}.json`)

  fs.writeFileSync(filePath, JSON.stringify(result))
}

export function logMemoryUsage() {
  const memoryUsage = process.memoryUsage()
  console.log(
    `Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
  )
}

export function toItem(rawItem: RawItem): Item {
  return {
    ...rawItem,
    url: `https://buyee.jp/item/yahoo/auction/${rawItem.auctionId}`,
    timeRemaining: convertTimeStringToNumber(rawItem.timeRemaining),
    createdAt: new Date().toISOString(),
  }
}
