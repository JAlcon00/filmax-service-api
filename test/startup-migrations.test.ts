import { afterEach, describe, expect, it } from 'vitest'
import { shouldRunStartupMigrations } from '../src/config/startup-migrations'

const originalRender = process.env.RENDER
const originalRenderServiceId = process.env.RENDER_SERVICE_ID
const originalRenderExternalUrl = process.env.RENDER_EXTERNAL_URL
const originalRunMigrations = process.env.RUN_MIGRATIONS_ON_START
const originalNodeEnv = process.env.NODE_ENV

const restoreValue = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}

const restoreEnv = () => {
  restoreValue('RENDER', originalRender)
  restoreValue('RENDER_SERVICE_ID', originalRenderServiceId)
  restoreValue('RENDER_EXTERNAL_URL', originalRenderExternalUrl)
  restoreValue('RUN_MIGRATIONS_ON_START', originalRunMigrations)
  restoreValue('NODE_ENV', originalNodeEnv)
}

describe('startup migrations', () => {
  afterEach(() => {
    restoreEnv()
  })

  it('runs migrations by default outside test', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.RUN_MIGRATIONS_ON_START

    expect(shouldRunStartupMigrations()).toBe(true)
  })

  it('does not run migrations in test by default', () => {
    process.env.NODE_ENV = 'test'
    delete process.env.RUN_MIGRATIONS_ON_START

    expect(shouldRunStartupMigrations()).toBe(false)
  })

  it('lets the explicit disabled flag override the default', () => {
    process.env.NODE_ENV = 'production'
    process.env.RUN_MIGRATIONS_ON_START = 'false'

    expect(shouldRunStartupMigrations()).toBe(false)
  })

  it('runs migrations when explicitly enabled outside production', () => {
    process.env.NODE_ENV = 'development'
    process.env.RUN_MIGRATIONS_ON_START = 'true'

    expect(shouldRunStartupMigrations()).toBe(true)
  })
})
