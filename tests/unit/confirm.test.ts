import { describe, expect, it } from 'vitest'
import { isConfirmTranscript } from '../../src/lib/naradji/confirm'

describe('confirm regex', () => {
  it('accepts haan pakka and english confirm', () => {
    expect(isConfirmTranscript('haan pakka')).toBe(true)
    expect(isConfirmTranscript('Haan Pakka!')).toBe(true)
    expect(isConfirmTranscript('confirm')).toBe(true)
    expect(isConfirmTranscript('do kilo atta')).toBe(false)
  })
})
