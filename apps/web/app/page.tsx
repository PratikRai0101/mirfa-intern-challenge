"use client"

import { useMemo, useState } from "react"
import type { TxSecureRecord } from "@mirfa/crypto"

export default function Page() {
  const [partyId, setPartyId] = useState("party_123")
  const [payload, setPayload] = useState('{"amount": 100, "currency": "USD"}')
  const [encryptedRecord, setEncryptedRecord] = useState<TxSecureRecord | null>(null)
  const [decryptedPayload, setDecryptedPayload] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  }, [])

  const handleEncrypt = async () => {
    setError(null)
    setDecryptedPayload(null)

    let parsed: any
    try {
      parsed = JSON.parse(payload)
    } catch {
      setError("Payload must be valid JSON")
      return
    }

    try {
      const res = await fetch(`${apiUrl}/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, payload: parsed })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to encrypt")
      }

      const record = (await res.json()) as TxSecureRecord
      setEncryptedRecord(record)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDecrypt = async () => {
    if (!encryptedRecord) return
    setError(null)

    try {
      const res = await fetch(`${apiUrl}/tx/${encryptedRecord.id}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to decrypt")
      }

      const body = await res.json()
      setDecryptedPayload(body?.payload ?? body)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-10 px-6 py-16">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Secure Transactions</h1>
          <p className="text-sm text-neutral-600">Encrypt, store, and decrypt payloads with AES-256-GCM.</p>
        </div>

        {error && (
          <div className="border border-black px-4 py-3 text-sm text-black">
            {error}
          </div>
        )}

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Input</h2>
          </div>
          <div className="h-px w-full bg-black/10" />

          <div className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">Party ID</label>
            <input
              className="border border-black bg-white px-3 py-2 text-sm"
              value={partyId}
              onChange={(event) => setPartyId(event.target.value)}
              placeholder="party_123"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">Payload (JSON)</label>
            <textarea
              className="min-h-[160px] border border-black bg-white px-3 py-2 text-sm font-mono"
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
            />
          </div>

          <button
            onClick={handleEncrypt}
            className="mt-2 border border-black bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Encrypt
          </button>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Encrypted Record</h2>
            {encryptedRecord && (
              <button
                onClick={handleDecrypt}
                className="border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black"
              >
                Decrypt
              </button>
            )}
          </div>
          <div className="h-px w-full bg-black/10" />

          <pre className="max-h-[320px] overflow-auto border border-black bg-white p-4 text-xs font-mono text-black">
{encryptedRecord ? JSON.stringify(encryptedRecord, null, 2) : "No record yet."}
          </pre>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Decrypted Result</h2>
          </div>
          <div className="h-px w-full bg-black/10" />

          <pre className="max-h-[240px] overflow-auto border border-black bg-white p-4 text-xs font-mono text-black">
{decryptedPayload ? JSON.stringify(decryptedPayload, null, 2) : "No decrypted payload yet."}
          </pre>
        </section>
      </div>
    </main>
  )
}
