// Minimal Fastify server scaffold (not fully featured yet)
import 'dotenv/config';
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { createClient } from '@supabase/supabase-js'
import { encryptPayload, decryptRecord, type TxSecureRecord } from '@mirfa/crypto'

const server = Fastify({ logger: true })
server.register(cors, { origin: true })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
const tableName = 'transactions'

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
    if (!supabase) return reply.status(500).send({ error: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured on server' })

    const record = encryptPayload(body.payload, body.partyId, masterKey)
    const { data, error } = await supabase.from(tableName).insert(record).select().single()
    if (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'failed to store record' })
    }
    return data
  } catch (err) {
    request.log.error(err)
    return reply.status(400).send({ error: (err as Error).message })
  }
})

server.get('/tx/:id', async (request, reply) => {
  const id = (request.params as any).id
  if (!supabase) return reply.status(500).send({ error: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured on server' })

  const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle()
  if (error) return reply.status(500).send({ error: 'failed to fetch record' })
  if (!data) return reply.status(404).send({ error: 'not found' })
  return data
})

server.post('/tx/:id/decrypt', async (request, reply) => {
  const id = (request.params as any).id
  if (!supabase) return reply.status(500).send({ error: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured on server' })

  const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle()
  if (error) return reply.status(500).send({ error: 'failed to fetch record' })
  if (!data) return reply.status(404).send({ error: 'not found' })

  const masterKey = process.env.MASTER_KEY_HEX
  if (!masterKey) return reply.status(500).send({ error: 'MASTER_KEY_HEX not configured on server' })

  try {
    const payload = decryptRecord(data as TxSecureRecord, masterKey)
    return { payload }
  } catch (err) {
    const message = (err as Error).message
    if (message.includes('authentication failed') || message.includes('failed to decrypt payload') || message.includes('failed to unwrap DEK')) {
      return reply.status(422).send({ error: 'Integrity check failed: Data may have been tampered with' })
    }
    request.log.warn(err)
    return reply.status(400).send({ error: message })
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
      await server.listen({ port: PORT, host: '0.0.0.0' })
      console.log('Server running locally at http://localhost:8080')
    } catch (err) {
      server.log.error(err)
      process.exit(1)
    }
  }

  start()
}
