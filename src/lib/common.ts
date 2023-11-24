import fs from 'fs'
import path from 'path'
import { Item } from '../types'

export function convertTimeStringToNumber(timeString: string) {
  const units = timeString.split(' ')
  const value = parseInt(units[0])
  const type = units[1]

  switch (type) {
    case 'day(s)':
      return value * 24 * 60 * 60
    case 'hour(s)':
      return value * 60 * 60
    case 'min(s)':
      return value * 60
    default:
      return value
  }
}

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
