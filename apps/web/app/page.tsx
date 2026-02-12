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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Secure Transactions</h1>
          <p className="text-slate-400">Encrypt, store, and decrypt payloads with AES-256-GCM.</p>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300">Party ID</label>
              <input
                className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={partyId}
                onChange={(event) => setPartyId(event.target.value)}
                placeholder="party_123"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300">Payload (JSON)</label>
              <textarea
                className="min-h-[160px] rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
              />
            </div>

            <button
              onClick={handleEncrypt}
              className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Encrypt & Save
            </button>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Encrypted Record</h2>
              {encryptedRecord && (
                <button
                  onClick={handleDecrypt}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Decrypt
                </button>
              )}
            </div>

            <pre className="max-h-[320px] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-200">
{encryptedRecord ? JSON.stringify(encryptedRecord, null, 2) : "No record yet."}
            </pre>

            {decryptedPayload && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-emerald-300">Decrypted Payload</h3>
                <pre className="max-h-[240px] overflow-auto rounded-md bg-emerald-500/10 p-4 text-xs text-emerald-200">
{JSON.stringify(decryptedPayload, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
