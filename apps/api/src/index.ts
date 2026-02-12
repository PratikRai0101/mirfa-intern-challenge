// Minimal Fastify server scaffold (not fully featured yet)
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { encryptPayload, decryptRecord, type TxSecureRecord } from '@mirfa/crypto'

const server = Fastify({ logger: true })

const db = new Map<string, TxSecureRecord>()

const PORT = Number(process.env.PORT || 8080)

// Schemas
const encryptBodySchema = {
  type: 'object',
  required: ['partyId', 'payload'],
  properties: {
    partyId: { type: 'string' },
    payload: { type: 'object' }
  }
} as const

server.post('/tx/encrypt', { schema: { body: encryptBodySchema } }, async (request, reply) => {
  const body = request.body as any
  const masterKey = process.env.MASTER_KEY_HEX
  if (!masterKey) return reply.status(500).send({ error: 'MASTER_KEY_HEX not configured on server' })

  try {
    const record = encryptPayload(body.payload, body.partyId, masterKey)
    db.set(record.id, record)
    return record
  } catch (err) {
    request.log.error(err)
    return reply.status(400).send({ error: (err as Error).message })
  }
})

server.get('/tx/:id', async (request, reply) => {
  const id = (request.params as any).id
  const record = db.get(id)
  if (!record) return reply.status(404).send({ error: 'not found' })
  return record
})

server.post('/tx/:id/decrypt', async (request, reply) => {
  const id = (request.params as any).id
  const record = db.get(id)
  if (!record) return reply.status(404).send({ error: 'not found' })

  const masterKey = process.env.MASTER_KEY_HEX
  if (!masterKey) return reply.status(500).send({ error: 'MASTER_KEY_HEX not configured on server' })

  try {
    const payload = decryptRecord(record, masterKey)
    return { payload }
  } catch (err) {
    request.log.warn(err)
    return reply.status(400).send({ error: (err as Error).message })
  }
})

// Vercel Serverless Handler
export default async function handler(req: any, res: any) {
  await server.ready()
  server.server.emit('request', req, res)
}

// Local Development Fallback
// Only start the server if this file is run directly (not imported by Vercel)
// @ts-ignore
if (require.main === module) {
  const start = async () => {
    try {
      await server.register(cors, { origin: true })
      await server.listen({ port: PORT, host: '0.0.0.0' })
      console.log('Server running locally at http://localhost:8080')
    } catch (err) {
      server.log.error(err)
      process.exit(1)
    }
  }

  start()
}
