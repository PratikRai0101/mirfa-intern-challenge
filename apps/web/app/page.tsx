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
      <div className="border-b border-black/5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 text-xs uppercase tracking-[0.2em] text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full border border-neutral-400" />
            <span className="font-semibold text-neutral-700">Mirfa Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span>System Online</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Secure Transactions</h1>
          <p className="text-sm text-neutral-500">Encrypt, store, and decrypt payloads with AES-256-GCM.</p>
        </div>

        <div className="h-px w-full bg-black/10" />

        {error && (
          <div className="border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <section className="flex flex-col gap-5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Input</div>
            <div className="h-px w-full bg-black/10" />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-600">Party ID</label>
              <input
                className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
                value={partyId}
                onChange={(event) => setPartyId(event.target.value)}
                placeholder="party_123"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
                <span>Payload (JSON)</span>
                <span className="rounded border border-black/10 px-2 py-0.5 text-[10px] font-mono text-neutral-500">application/json</span>
              </div>
              <textarea
                className="min-h-[180px] rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-mono text-neutral-800"
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
              />
            </div>

            <button
              onClick={handleEncrypt}
              className="mt-2 flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white"
            >
              <span className="inline-block h-3 w-3 rounded-sm border border-white" />
              Encrypt &amp; Save
            </button>
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Encrypted Record</div>
              {encryptedRecord && (
                <button
                  onClick={handleDecrypt}
                  className="rounded-md border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black"
                >
                  Decrypt
                </button>
              )}
            </div>
            <div className="h-px w-full bg-black/10" />

            <pre className="max-h-[320px] overflow-auto rounded-md border border-black/10 bg-neutral-50 p-4 text-xs font-mono text-neutral-700">
{encryptedRecord ? JSON.stringify(encryptedRecord, null, 2) : "No record yet."}
            </pre>

            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Decrypted Payload</div>
              <div className="h-px w-full bg-black/10" />
              <pre className="max-h-[200px] overflow-auto rounded-md border border-black/10 bg-neutral-50 p-4 text-xs font-mono text-neutral-700">
{decryptedPayload ? JSON.stringify(decryptedPayload, null, 2) : "No decrypted payload yet."}
              </pre>
            </div>
          </section>
        </div>

        <div className="h-px w-full bg-black/10" />

        <footer className="flex flex-col gap-2 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span>v2.5.0-beta</span>
            <span>Documentation</span>
            <span>API Reference</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="inline-block h-2 w-2 rounded-full bg-neutral-300" />
            End-to-end Encrypted Environment
          </div>
        </footer>
      </div>
    </main>
  )
}
