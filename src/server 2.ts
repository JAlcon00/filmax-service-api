import { createServer } from './app.js'
import { env } from './config/env.js'

const app = createServer()

app.listen(env.PORT, () => {
  console.log(`FILMAX API listening on port ${env.PORT}`)
})