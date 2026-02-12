<img width="1896" height="1030" alt="image" src="https://github.com/user-attachments/assets/847e5958-e064-43f7-8b1d-39f399eb72d1" /># Mirfa Secure Transaction Challenge

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

## Live Deployment

- **Frontend (Web)**: https://mirfa-intern-challenge-web-pratik.vercel.app/
- **Backend (API)**: https://mirfa-intern-challenge-api-pratik.vercel.app/
- **Documentation**: [Link to your Loom Video]

UI Screenshot: <img width="1896" height="1030" alt="image" src="https://github.com/user-attachments/assets/97725ae4-e8f3-4283-bc4c-1f4301c6d5a5" />

Test Suite Screenshot: <img width="1896" height="1030" alt="image" src="https://github.com/user-attachments/assets/7d08fac5-c260-4d41-8ebd-3ad00423dddc" />

Database Screenshot: <img width="1896" height="908" alt="image" src="https://github.com/user-attachments/assets/beaa0a98-5b43-4be5-9450-39e6c92a7a32" />

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

1.  **Standard Flow**: Ensures valid JSON encrypts/decrypts successfully.
2.  **Ciphertext Tampering**: Rejects decryption if the `payload_ct` is modified by even one bit.
3.  **Auth Tag Tampering**: Rejects decryption if the GCM tag is altered.
4.  **DEK Wrap Integrity**: Ensures the system detects tampering in the wrapped key layer.
5.  **Invalid Nonce Length**: Enforces the 12-byte nonce standard.
6.  **Invalid Tag Length**: Enforces the 16-byte authentication tag standard.
7.  **Hex Encoding Validation**: Rejects malformed hex strings to prevent decoding crashes.
8.  **Empty Payload Safety**: Ensures zero-length strings don't lead to cryptographic instability.
