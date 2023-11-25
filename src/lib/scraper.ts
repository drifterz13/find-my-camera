import puppeteer, { Page } from 'puppeteer'
import { Item, RawItem } from '../types'
import { logMemoryUsage, toItem } from './common'
import { convertTimeStringToNumber } from './time'

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

async function getItems(page: Page): Promise<RawItem[]> {
  return page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.itemCard'))

    return items.map((item) => {
      const auctionId =
        item
          .querySelector('.itemCard__item')
          ?.lastElementChild?.getAttribute('data-auction-id') || ''
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

      return {
        auctionId,
        title,
        image,
        price: isNaN(price) ? 0 : price,
        timeRemaining,
      }
    })
  })
}

export async function scrape() {
  const browser = await puppeteer.launch({ headless: 'new' })
  const [page] = await browser.pages()

  try {
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

    const results = [] as Item[]

    // Get items of 1st page.
    const items = await getItems(page).then((items) => items.flatMap(toItem))
    results.push(...items)

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
      const items = await getItems(page).then((items) => items.flatMap(toItem))
      results.push(...items)

      nextPage = await getNextPageEl(page)
    }

    await browser.close()

    return results
  } catch (error) {
    browser.close()

    throw error
  }
}
