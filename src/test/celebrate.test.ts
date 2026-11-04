import { describe, it, expect, vi } from 'vitest'

const fire = vi.fn()
const create = vi.fn(() => fire)
vi.mock('canvas-confetti', () => ({ default: { create } }))

describe('celebrate', () => {
  it('fires confetti on the main thread (no blob: worker, CSP-safe) and reuses one instance', async () => {
    const { celebrate } = await import('../utils/celebrate')
    celebrate({ particleCount: 10 })
    celebrate({ particleCount: 20 })

    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(undefined, { resize: true, useWorker: false })
    expect(fire).toHaveBeenNthCalledWith(1, { particleCount: 10 })
    expect(fire).toHaveBeenNthCalledWith(2, { particleCount: 20 })
  })
})
