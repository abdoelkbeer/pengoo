import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3002

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true)

            // Let Next.js handle API routes
            await handle(req, res, parsedUrl)

        } catch (err) {
            console.error('Error occurred handling', req.url, err)
            res.statusCode = 500
            res.end('internal server error')
        }
    })

    server.once('error', (err) => {
        console.error(err)
        process.exit(1)
    })

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`)
    })
})
