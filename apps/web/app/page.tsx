"use client"

import { useMemo, useState } from "react"
import type { TxSecureRecord } from "@mirfa/crypto"

export default function Page() {
  const [partyId, setPartyId] = useState("party_123")
  const [payload, setPayload] = useState(`{
  "amount": 100,
  "currency": "USD",
  "metadata": {
    "source": "api_v2",
    "timestamp": 1698223901
  }
}`)
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

  const renderJson = (value: any) => {
    if (!value) return ""
    const json = JSON.stringify(value, null, 2)
    const tokens: Array<{ type: "text" | "key" | "string" | "number" | "literal"; value: string }> = []
    const regex = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\b\d+(?:\.\d+)?\b)|\btrue\b|\bfalse\b|\bnull\b/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(json)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: "text", value: json.slice(lastIndex, match.index) })
      }

      const [full, keyMatch, stringMatch, numberMatch] = match
      if (keyMatch) {
        tokens.push({ type: "key", value: full })
      } else if (stringMatch) {
        tokens.push({ type: "string", value: full })
      } else if (numberMatch) {
        tokens.push({ type: "number", value: full })
      } else {
        tokens.push({ type: "literal", value: full })
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < json.length) {
      tokens.push({ type: "text", value: json.slice(lastIndex) })
    }

    return tokens.map((token, index) => {
      if (token.type === "key") {
        return (
          <span key={index} className="text-purple-600 dark:text-purple-400">
            {token.value}
          </span>
        )
      }
      if (token.type === "string") {
        return (
          <span key={index} className="text-green-600 dark:text-green-400">
            {token.value}
          </span>
        )
      }
      if (token.type === "number") {
        return (
          <span key={index} className="text-blue-600 dark:text-blue-400">
            {token.value}
          </span>
        )
      }
      if (token.type === "literal") {
        return (
          <span key={index} className="text-blue-600 dark:text-blue-400">
            {token.value}
          </span>
        )
      }
      return <span key={index}>{token.value}</span>
    })
  }

  return (
    <main className="bg-background-light text-text-main-light font-sans antialiased transition-colors duration-200">
      <nav className="sticky top-0 z-50 border-b border-border-light bg-white py-4 px-6 md:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-primary text-xl">shield</span>
            <span className="text-lg font-semibold tracking-tight">Mirfa Secure</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-text-muted-light">System Online</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12">
        <header className="mb-12 border-b border-border-light pb-8">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-primary md:text-5xl">Secure Transactions</h1>
          <p className="mt-4 max-w-2xl text-lg font-light text-text-muted-light">
            Encrypt, store, and decrypt payloads with AES-256-GCM.
          </p>
        </header>

        {error && (
          <div className="mb-8 border border-border-light bg-surface-light px-4 py-3 text-sm text-text-main-light">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <section className="space-y-8">
            <div>
              <label className="mb-2 block text-sm font-semibold text-text-main-light">Party ID</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons-outlined text-lg text-gray-400">badge</span>
                </div>
                <input
                  className="w-full rounded border border-border-light bg-surface-light p-3 pl-10 font-mono text-sm text-text-main-light placeholder-gray-400 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  id="party-id"
                  name="party-id"
                  placeholder="Enter Party ID"
                  type="text"
                  value={partyId}
                  onChange={(event) => setPartyId(event.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-text-main-light" htmlFor="payload">
                  Payload (JSON)
                </label>
                <span className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-mono text-text-muted-light">
                  application/json
                </span>
              </div>
              <div className="relative">
                <textarea
                  className="w-full resize-none rounded border border-border-light bg-surface-light p-4 font-mono text-sm leading-relaxed text-text-main-light outline-none transition-all focus:border-primary"
                  id="payload"
                  name="payload"
                  rows={8}
                  spellCheck={false}
                  value={payload}
                  onChange={(event) => setPayload(event.target.value)}
                />
                <div className="pointer-events-none absolute right-4 top-4 select-none text-xs text-text-muted-light opacity-50">
                  JSON
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleEncrypt}
                className="flex w-full items-center justify-center gap-2 rounded bg-primary px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-800"
              >
                <span className="material-icons-outlined text-lg">lock</span>
                Encrypt &amp; Save
              </button>
            </div>
          </section>

          <section className="space-y-10">
            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-text-main-light">Encrypted Record</h2>
                {encryptedRecord && (
                  <button
                    onClick={handleDecrypt}
                    className="flex items-center gap-1 rounded border border-border-light px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100"
                  >
                    <span className="material-icons-outlined text-sm">vpn_key</span>
                    Decrypt
                  </button>
                )}
              </div>
              <div className="rounded-md border border-border-light bg-code-bg-light p-5 shadow-sm">
                <pre className="text-xs leading-6 text-text-main-light md:text-sm">
                  <code className="font-mono">
                    {encryptedRecord ? renderJson(encryptedRecord) : "No record yet."}
                  </code>
                </pre>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-text-main-light">Decrypted Payload</h2>
              </div>
              <div className="rounded-md border border-border-light bg-code-bg-light p-5 shadow-sm">
                <pre className="text-xs leading-6 text-text-main-light md:text-sm">
                  <code className="font-mono">
                    {decryptedPayload ? renderJson(decryptedPayload) : "No decrypted payload yet."}
                  </code>
                </pre>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 flex flex-col items-start justify-between border-t border-border-light pt-8 text-sm text-text-muted-light md:flex-row md:items-center">
          <div className="mb-4 flex items-center gap-4 md:mb-0">
            <span className="font-mono text-xs opacity-75">v2.5.0-beta</span>
            <span className="h-3 w-px bg-gray-300" />
            <a className="transition-colors hover:text-primary" href="#">
              Documentation
            </a>
            <a className="transition-colors hover:text-primary" href="#">
              API Reference
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-base">lock</span>
            <span className="text-xs">End-to-end Encrypted Environment</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
