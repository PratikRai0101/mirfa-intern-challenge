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
    const tampered: TxSecureRecord = { ...record, payloadCt: record.payloadCt.slice(0, -1) + (record.payloadCt.slice(-1) === '0' ? '1' : '0') }
    expect(() => decryptRecord(tampered, masterKey)).toThrow()
  })

  it('throws when payload_tag is tampered', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const tampered: TxSecureRecord = { ...record, payloadTag: record.payloadTag.slice(0, -1) + (record.payloadTag.slice(-1) === '0' ? '1' : '0') }
    expect(() => decryptRecord(tampered, masterKey)).toThrow()
  })

  it('throws when nonce length is invalid', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const bad: TxSecureRecord = { ...record, payloadNonce: record.payloadNonce.slice(0, -2) }
    expect(() => decryptRecord(bad, masterKey)).toThrow()
  })

  it('encrypts and decrypts an empty JSON payload', () => {
    const record = encryptPayload({}, partyId, masterKey)
    const out = decryptRecord(record, masterKey)
    expect(out).toEqual({})
  })

  it('throws when payload_ct is invalid hex', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const bad: TxSecureRecord = { ...record, payloadCt: 'zz' + record.payloadCt.slice(2) }
    expect(() => decryptRecord(bad, masterKey)).toThrow(/validation failed/i)
  })

  it('throws when GCM tag length is invalid', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const bad: TxSecureRecord = { ...record, payloadTag: record.payloadTag.slice(0, -2) }
    expect(() => decryptRecord(bad, masterKey)).toThrow(/validation failed/i)
  })

  it('throws when DEK wrap is tampered', () => {
    const record = encryptPayload(payload, partyId, masterKey)
    const tampered: TxSecureRecord = { ...record, dekWrapped: record.dekWrapped.slice(0, -1) + (record.dekWrapped.slice(-1) === '0' ? '1' : '0') }
    expect(() => decryptRecord(tampered, masterKey)).toThrow()
  })
})
