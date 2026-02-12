import { randomBytes, createCipheriv, createDecipheriv, randomUUID } from 'crypto'

export interface TxSecureRecord {
  id: string
  partyId: string
  createdAt: string
  payloadNonce: string
  payloadCt: string
  payloadTag: string
  dekWrapNonce: string
  dekWrapped: string
  dekWrapTag: string
  alg: 'AES-256-GCM'
  mk_version: 1
}

const HEX_RE = /^[0-9a-fA-F]+$/

function ensureHex(input: string, expectedLen?: number, name?: string) {
  if (!HEX_RE.test(input)) throw new Error(`${name ?? 'hex'} contains non-hex characters`)
  if (expectedLen && input.length !== expectedLen) throw new Error(`${name ?? 'hex'} has invalid length`)
}

export function encryptPayload(payload: any, partyId: string, masterKeyHex: string): TxSecureRecord {
  if (typeof masterKeyHex !== 'string') throw new Error('masterKeyHex must be a hex string')
  if (!HEX_RE.test(masterKeyHex) || masterKeyHex.length !== 64) throw new Error('masterKeyHex must be 32 bytes (64 hex chars)')

  const id = randomUUID()
  const createdAt = new Date().toISOString()

  // DEK
  const dek = randomBytes(32)

  // Payload encryption
  const payloadNonce = randomBytes(12)
  const payloadCipher = createCipheriv('aes-256-gcm', dek, payloadNonce)
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8')
  const payloadCt = Buffer.concat([payloadCipher.update(plaintext), payloadCipher.final()])
  const payloadTag = payloadCipher.getAuthTag()

  // Wrap DEK with master key
  const mk = Buffer.from(masterKeyHex, 'hex')
  const dekWrapNonce = randomBytes(12)
  const dekCipher = createCipheriv('aes-256-gcm', mk, dekWrapNonce)
  const dekWrapped = Buffer.concat([dekCipher.update(dek), dekCipher.final()])
  const dekWrapTag = dekCipher.getAuthTag()

  const record: TxSecureRecord = {
    id,
    partyId,
    createdAt,
    payloadNonce: payloadNonce.toString('hex'),
    payloadCt: payloadCt.toString('hex'),
    payloadTag: payloadTag.toString('hex'),
    dekWrapNonce: dekWrapNonce.toString('hex'),
    dekWrapped: dekWrapped.toString('hex'),
    dekWrapTag: dekWrapTag.toString('hex'),
    alg: 'AES-256-GCM',
    mk_version: 1
  }

  return record
}

export function decryptRecord(record: TxSecureRecord, masterKeyHex: string): any {
  if (!record || typeof record !== 'object') throw new Error('record is required')
  // validate hex lengths
  try {
    ensureHex(record.payloadNonce, 24, 'payloadNonce')
    ensureHex(record.payloadTag, 32, 'payloadTag')
    ensureHex(record.dekWrapNonce, 24, 'dekWrapNonce')
    ensureHex(record.dekWrapTag, 32, 'dekWrapTag')
    ensureHex(record.payloadCt, undefined, 'payloadCt')
    ensureHex(record.dekWrapped, undefined, 'dekWrapped')
  } catch (err) {
    throw new Error(`validation failed: ${(err as Error).message}`)
  }

  if (!HEX_RE.test(masterKeyHex) || masterKeyHex.length !== 64) throw new Error('masterKeyHex must be 32 bytes (64 hex chars)')

  const mk = Buffer.from(masterKeyHex, 'hex')

  // Unwrap DEK
  const dekWrapNonce = Buffer.from(record.dekWrapNonce, 'hex')
  const dekWrapped = Buffer.from(record.dekWrapped, 'hex')
  const dekWrapTag = Buffer.from(record.dekWrapTag, 'hex')

  const dekDec = createDecipheriv('aes-256-gcm', mk, dekWrapNonce)
  dekDec.setAuthTag(dekWrapTag)
  let dek: Buffer
  try {
    dek = Buffer.concat([dekDec.update(dekWrapped), dekDec.final()])
  } catch (err) {
    throw new Error('failed to unwrap DEK: authentication failed or corrupted data')
  }

  if (dek.length !== 32) throw new Error('invalid DEK length after unwrap')

  // Decrypt payload
  const payloadNonce = Buffer.from(record.payloadNonce, 'hex')
  const payloadCt = Buffer.from(record.payloadCt, 'hex')
  const payloadTag = Buffer.from(record.payloadTag, 'hex')

  const payloadDec = createDecipheriv('aes-256-gcm', dek, payloadNonce)
  payloadDec.setAuthTag(payloadTag)
  let plaintext: Buffer
  try {
    plaintext = Buffer.concat([payloadDec.update(payloadCt), payloadDec.final()])
  } catch (err) {
    throw new Error('failed to decrypt payload: authentication failed or corrupted data')
  }

  try {
    return JSON.parse(plaintext.toString('utf8'))
  } catch (err) {
    throw new Error('failed to parse decrypted payload as JSON')
  }
}
