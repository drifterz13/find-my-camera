import puppeteer, { Page } from 'puppeteer'
import { Item } from './types'
import { deleteScrapedFiles, logMemoryUsage, saveResult } from './lib/common'

async function getNextPageEl(page: Page) {
  const nextPageEl = await page.$eval(
    '.page_navi .current',
    (node) => node.nextSibling
  )

  return nextPageEl
}

async function goToNextPage(page: Page): Promise<void> {
  const currentButton = await page.$('.page_navi .current')
  if (!currentButton) {
    throw new Error('Not found current navigation button')
  }

  await currentButton.evaluate(async (node) => {
    const nextButton = node.nextSibling as HTMLElement | null
    if (!nextButton) {
      return
    }

    nextButton.click()
  })
}

async function getItems(page: Page): Promise<Item[]> {
  return page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.itemCard'))

    return items.map((item) => {
      const title = (
        item.querySelector('.itemCard__itemName')?.textContent || ''
      )
        .trimStart()
        .trimEnd()
      const image = item.querySelector('img')?.getAttribute('src') || ''
      const price = +(
        item.querySelector('.g-priceDetails__item .g-priceFx')?.textContent ??
        ''
      ).replace(/[^\d.]/g, '')

      const timeRemaining =
        item
          .querySelector('.itemCard__infoList')
          ?.firstElementChild?.lastElementChild?.textContent?.trim() || ''

      const formatTime = (() => {
        const units = timeRemaining.split(' ')
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
      })()

      return {
        title,
        image,
        price: isNaN(price) ? 0 : price,
        timeRemaining: formatTime,
      }
    })
  })
}

async function scrape() {
  const browser = await puppeteer.launch({ headless: 'new' })
  const [page] = await browser.pages()

  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  await page.setUserAgent(ua)

  const category = '2084261642' // Compact Digital Cameras
  const keyword = encodeURIComponent('canon ixy')
  const maxPrice = 25000 // 25,000 yen ~ 6000THB

  // Items are sort by time ending soonest.
  const url = `https://buyee.jp/item/search/query/${keyword}/category/${category}?aucmaxprice=${maxPrice}&sort=end&order=a`

  await page.goto(url)
  await page.waitForSelector('.auctionSearchResult')

  const matchedItems = []

  // Get items of 1st page.
  const items = await getItems(page)
  matchedItems.push(...items)

  let nextPage = await getNextPageEl(page)
  let pageCount = 1

  // Check if there is next page.
  while (nextPage) {
    logMemoryUsage()

    pageCount++
    console.log(`Going to next page (${pageCount})"... 🚀`)

    // Go to next page.
    goToNextPage(page)
    await page.waitForNavigation()
    await page.waitForSelector('.auctionSearchResult')

    // Get items.
    const items = await getItems(page)
    matchedItems.push(...items)

    // Check reasonable time range
    const atleastOneItemIsForTomorrow = items.some(
      (item) => item.timeRemaining > 24 * 60 * 60
    )

    if (atleastOneItemIsForTomorrow) {
      console.log('Found at least one item for tomorrow. Stop scraping... 🛑')

      break
    }

    nextPage = await getNextPageEl(page)
  }

  saveResult(matchedItems)

  await browser.close()
}

;(async () => {
  try {
    console.time('scraping time')
    // deleteScrapedFiles()
    await scrape()
    console.timeEnd('scraping time')
  } catch (error) {
    console.error(error)
  }
})()
