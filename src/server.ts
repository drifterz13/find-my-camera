import http from 'node:http'
import { scrape } from './lib/scraper'
import { getRecommendItems } from './lib/recommend'
import { saveResult } from './lib/common'

const hostname = '127.0.0.1'
const port = 8000
const timeout = 1000 * 120 // 120 seconds

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/canon-ixy') {
    req.setTimeout(timeout, () => {
      console.log('Request timed out')
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Request timed out')
    })

    console.time('scraping time')
    try {
      const data = await scrape()
      const recommendItems = getRecommendItems(data)

      saveResult(recommendItems)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(recommendItems))
    } catch (error) {
      console.error(error)

      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Something went wrong')
    } finally {
      console.timeEnd('scraping time')
    }
  }
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})

function handleShutdown() {
  console.log('Received shutdown signal')

  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    if (server.connections > 0) {
      console.log('Waiting for remaining connections to close...')
      server.once('close', () => {
        console.log('Graceful shutdown complete')
        process.exit(0)
      })
    } else {
      console.log('Graceful shutdown complete')
      process.exit(0)
    }
  })
}

process.on('SIGINT', handleShutdown)
process.on('SIGTERM', handleShutdown)
