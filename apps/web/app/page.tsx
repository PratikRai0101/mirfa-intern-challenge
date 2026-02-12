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
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_50%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.06),_transparent_45%)]" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-14">
          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Mirfa Secure Layer</div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Secure Transactions</h1>
            <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
              Encrypt, store, and decrypt payloads with AES-256-GCM envelope encryption.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-[0_0_40px_rgba(239,68,68,0.08)]">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="flex flex-col gap-5 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Party ID</label>
                <input
                  className="rounded-lg border border-slate-800 bg-slate-950/90 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                  value={partyId}
                  onChange={(event) => setPartyId(event.target.value)}
                  placeholder="party_123"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Payload (JSON)</label>
                <textarea
                  className="min-h-[180px] rounded-lg border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-600"
                  value={payload}
                  onChange={(event) => setPayload(event.target.value)}
                />
              </div>

              <button
                onClick={handleEncrypt}
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.3)] transition hover:bg-blue-500"
              >
                Encrypt & Save
              </button>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Encrypted Record</span>
                  <span className="text-sm text-slate-200">GCM payload + wrapped DEK</span>
                </div>
                {encryptedRecord && (
                  <button
                    onClick={handleDecrypt}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.3)] transition hover:bg-emerald-500"
                  >
                    Decrypt
                  </button>
                )}
              </div>

              <pre className="max-h-[320px] overflow-auto rounded-lg border border-slate-800 bg-slate-950/90 p-4 text-xs text-slate-200">
{encryptedRecord ? JSON.stringify(encryptedRecord, null, 2) : "No record yet."}
              </pre>

              {decryptedPayload && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-emerald-300">Decrypted Payload</h3>
                  <pre className="max-h-[240px] overflow-auto rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-200">
{JSON.stringify(decryptedPayload, null, 2)}
                  </pre>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
