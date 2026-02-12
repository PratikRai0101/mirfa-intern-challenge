# Mirfa Secure Transaction Challenge

Secure transaction mini-app using a TurboRepo monorepo with Fastify, Next.js, and a shared AES-256-GCM envelope encryption library.

## Architecture

- `apps/web` — Next.js frontend
- `apps/api` — Fastify backend with Supabase persistence
- `packages/crypto` — shared envelope encryption logic (AES-256-GCM)

## Encryption Strategy (Envelope Encryption)

Each transaction uses a fresh data encryption key (DEK) to protect the payload, and the DEK is wrapped by a master key (MK).

1. Generate a random 32-byte DEK per transaction.
2. Encrypt the JSON payload using AES-256-GCM with the DEK and a unique 12-byte nonce.
3. Wrap the DEK using AES-256-GCM with the master key and a separate 12-byte nonce.
4. Store ciphertext, nonces, and 16-byte GCM auth tags as hex strings.

GCM auth tags provide integrity: tampering with ciphertext or tags causes decryption to fail. All record fields use camelCase to match Supabase schema.

## How to Run Locally

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
pnpm install
pnpm build
```

### Environment Variables

API (`apps/api/.env` or shell):

```
MASTER_KEY_HEX=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

Web (`apps/web/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Start

```bash
pnpm dev
```

The API runs on `http://localhost:8080` and the web app is served by Next.js.

### Database Schema

Run the Supabase schema in `docs/schema.sql` to create the `transactions` table.

## API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/tx/encrypt` | Encrypts and stores a payload, returns `TxSecureRecord`. |
| GET | `/tx/:id` | Returns the stored encrypted record (no decrypt). |
| POST | `/tx/:id/decrypt` | Decrypts the stored record and returns the original payload. |

## Tests

The crypto package includes 8 security-focused tests (tamper checks, invalid hex, wrong tag length, empty payload) and runs in non-watch mode via `pnpm test`.
