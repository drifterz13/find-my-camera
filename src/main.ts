import * as cheerio from 'cheerio'
import { Item } from './types'
import {
  convertTimeStringToNumber,
  deleteScrapedFiles,
  saveResult,
} from './lib/common'
import chunk from 'lodash.chunk'

function getItems(html: string) {
  const results = [] as Item[]
  const $ = cheerio.load(html)

  const items = $('.itemCard')

  items.each((_, item) => {
    const title = ($(item).find('.itemCard__itemName')?.text() || '')
      .trimStart()
      .trimEnd()
    const image = $(item).find('img')?.prop('src') || ''
    const price = +(
      $(item).find('.g-priceDetails__item .g-priceFx')?.text() ?? ''
    ).replace(/[^\d.]/g, '')

    const timeRemaining =
      $(item)
        .find('.itemCard__infoList')
        .children()
        .first()
        .children()
        .last()
        .text()
        .trim() || ''

    results.push({
      title,
      image,
      price: isNaN(price) ? 0 : price,
      timeRemaining: convertTimeStringToNumber(timeRemaining),
    } as Item)
  })

  return results
}

async function scrape() {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'

  const category = '2084261642' // Compact Digital Cameras
  const keyword = encodeURIComponent('canon ixy')
  const maxPrice = 25000 // 25,000 yen ~ 6000THB

  const MAX_PAGE = 30
  const BATCH_SIZE = 3
  const ONE_DAY = 24 * 60 * 60

  // Items are sort by time ending soonest.
  const url = `https://buyee.jp/item/search/query/${keyword}/category/${category}?aucmaxprice=${maxPrice}&sort=end&order=a`
  const scrapeUrls = [...Array(MAX_PAGE).keys()].map(
    (i) => `${url}&page=${i + 1}`
  )
  const results = [] as Item[]

  const chunks = chunk(scrapeUrls, BATCH_SIZE)

  for (const chunk of chunks) {
    const promises = chunk.map((url) =>
      fetch(url, {
        headers: { 'User-Agent': ua },
      })
        .then((resp) => resp.text())
        .then((html) => getItems(html))
    )

    const items = await Promise.all(promises)
    results.push(...items.flat())

    // Check reasonable time range
    const atleastOneItemIsForTomorrow = results.some(
      (item) => item.timeRemaining >= ONE_DAY
    )

    if (atleastOneItemIsForTomorrow) {
      console.log('Found at least one item for tomorrow. Stop scraping... 🛑')

      break
    }
  }

  // Today items.
  const todayItems = results.filter((item) => item.timeRemaining < ONE_DAY)
  saveResult(todayItems)
}

;(async () => {
  try {
    deleteScrapedFiles()
    console.time('scraping time')
    // deleteScrapedFiles()
    await scrape()
    console.timeEnd('scraping time')
  } catch (error) {
    console.error(error)
  }
})()
