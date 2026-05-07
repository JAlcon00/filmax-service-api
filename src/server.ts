import { createServer } from './app.js'
import { env } from './config/env.js'
import { runPendingMigrations } from './config/startup-migrations.js'

try {
  await runPendingMigrations()

  const app = createServer()

  app.listen(env.PORT, () => {
    console.log(`FILMAX API listening on port ${env.PORT}`)
  })
} catch (error) {
  console.error('Unable to start FILMAX API', error)
  process.exit(1)
}
