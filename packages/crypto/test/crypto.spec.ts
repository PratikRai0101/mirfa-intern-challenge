import { describe, it, expect } from 'vitest'
import { encryptPayload, decryptRecord, type TxSecureRecord } from '../src/index'
import { randomBytes } from 'crypto'

describe('crypto envelope', () => {
  const masterKey = randomBytes(32).toString('hex')
  const partyId = 'party_123'
  const payload = { amount: 100, currency: 'AED' }

  it('encrypts and decrypts successfully', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const out = decryptRecord(record, masterKey)
    expect(out).toEqual(payload)
  })

  it('throws when payload_ct is tampered', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    // flip a char in ciphertext
    const tampered: TxSecureRecord = { ...record, payload_ct: record.payload_ct.slice(0, -1) + (record.payload_ct.slice(-1) === '0' ? '1' : '0') }
    expect(() => decryptRecord(tampered, masterKey)).toThrow()
  })

  it('throws when payload_tag is tampered', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const tampered: TxSecureRecord = { ...record, payload_tag: record.payload_tag.slice(0, -1) + (record.payload_tag.slice(-1) === '0' ? '1' : '0') }
    expect(() => decryptRecord(tampered, masterKey)).toThrow()
  })

  it('throws when nonce length is invalid', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const bad: TxSecureRecord = { ...record, payload_nonce: record.payload_nonce.slice(0, -2) }
    expect(() => decryptRecord(bad, masterKey)).toThrow()
  })

  it('encrypts and decrypts an empty JSON payload', () => {
    const record = encryptPayload({}, partyId, masterKey)
    const out = decryptRecord(record, masterKey)
    expect(out).toEqual({})
  })

  it('throws when payload_ct is invalid hex', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const bad: TxSecureRecord = { ...record, payload_ct: 'zz' + record.payload_ct.slice(2) }
    expect(() => decryptRecord(bad, masterKey)).toThrow(/validation failed/i)
  })

  it('throws when GCM tag length is invalid', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const bad: TxSecureRecord = { ...record, payload_tag: record.payload_tag.slice(0, -2) }
    expect(() => decryptRecord(bad, masterKey)).toThrow(/validation failed/i)
  })

  it('throws when DEK wrap is tampered', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const tampered: TxSecureRecord = { ...record, dek_wrapped: record.dek_wrapped.slice(0, -1) + (record.dek_wrapped.slice(-1) === '0' ? '1' : '0') }
    expect(() => decryptRecord(tampered, masterKey)).toThrow()
  })
})
