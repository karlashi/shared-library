import { describe, it, expect } from 'vitest'
import { validateImageFile } from './storage'
import es from '../i18n/locales/es.json'

function makeFile(type: string, sizeInBytes: number): File {
  return new File([new Uint8Array(sizeInBytes)], 'cover.jpg', { type })
}

describe('validateImageFile', () => {
  it('accepts a normal image file', () => {
    const file = makeFile('image/jpeg', 1024)
    expect(validateImageFile(file)).toBeNull()
  })

  it('rejects a non-image file', () => {
    const file = makeFile('application/pdf', 1024)
    expect(validateImageFile(file)).toBe(es.errors.notAnImage)
  })

  it('rejects a file over 5MB', () => {
    const file = makeFile('image/png', 6 * 1024 * 1024)
    expect(validateImageFile(file)).toBe(es.errors.imageTooLarge)
  })
})
