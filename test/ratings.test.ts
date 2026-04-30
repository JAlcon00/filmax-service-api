import { describe, it, expect } from 'vitest'
import { ratingsCreateRequestSchema } from '../src/contracts/api.contracts'

describe('Ratings validation', () => {
  it('acepta score válido (1 y 5)', () => {
    expect(() =>
      ratingsCreateRequestSchema.parse({
        externalId: 'ext-1',
        title: 'Title',
        type: 'movie',
        score: 1
      })
    ).not.toThrow()

    expect(() =>
      ratingsCreateRequestSchema.parse({
        externalId: 'ext-2',
        title: 'Title',
        type: 'movie',
        score: 5
      })
    ).not.toThrow()
  })

  it('rechaza score fuera de rango', () => {
    expect(() =>
      ratingsCreateRequestSchema.parse({
        externalId: 'ext-1',
        title: 'Title',
        type: 'movie',
        score: 0
      })
    ).toThrow()

    expect(() =>
      ratingsCreateRequestSchema.parse({
        externalId: 'ext-2',
        title: 'Title',
        type: 'movie',
        score: 6
      })
    ).toThrow()
  })

  it('requiere title y type cuando se envía externalId', () => {
    expect(() =>
      ratingsCreateRequestSchema.parse({
        externalId: 'ext-1',
        score: 3
      })
    ).toThrow()
  })
})
