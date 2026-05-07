import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { env } from './env.js'

const execFileAsync = promisify(execFile)
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off'])
const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on'])

const shouldRunMigrations = () => {
  const flag = process.env.RUN_MIGRATIONS_ON_START?.trim().toLowerCase()

  if (flag && DISABLED_VALUES.has(flag)) {
    return false
  }

  if (flag && ENABLED_VALUES.has(flag)) {
    return true
  }

  return env.NODE_ENV === 'production'
}

const resolvePrismaBinary = async () => {
  const binaryName = process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
  const binaryPath = join(process.cwd(), 'node_modules', '.bin', binaryName)

  await access(binaryPath)

  return binaryPath
}

export const runPendingMigrations = async () => {
  if (!shouldRunMigrations()) {
    return
  }

  const prismaBinary = await resolvePrismaBinary()

  console.log('Applying Prisma migrations before server startup...')
  const { stdout, stderr } = await execFileAsync(prismaBinary, ['migrate', 'deploy'], {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 1024 * 1024
  })

  if (stdout.trim()) {
    console.log(stdout.trim())
  }

  if (stderr.trim()) {
    console.warn(stderr.trim())
  }
}
