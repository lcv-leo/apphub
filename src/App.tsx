/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   AppHub — App Component (React 19 + TypeScript)
   Migrado de public/app.js vanilla → componente React tipado
   ==================================================================== */

import { useState, useEffect } from 'react'
import type { CardData } from './types.ts'
import { ComplianceBanner } from './components/ComplianceBanner'
import { LicencasModule } from './modules/compliance/LicencasModule'

const APP_VERSION = 'APP v04.00.08'
const CONFIG_ENDPOINT = '/api/config'
const SAFE_PROTOCOLS = new Set(['https:'])

/** Valida se a URL usa protocolo seguro */
function isSafeUrl(url: string): boolean {
  try {
    return SAFE_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

/** Type guard para validar estrutura de um card */
function isValidCard(value: unknown): value is CardData {
  if (!value || typeof value !== 'object') return false
  const c = value as Record<string, unknown>
  return (
    typeof c.name === 'string' &&
    typeof c.description === 'string' &&
    typeof c.url === 'string' &&
    typeof c.icon === 'string' &&
    typeof c.badge === 'string'
  )
}

/** Carrega cards da API local (Pages Function + D1) */
async function loadCardsFromApi(): Promise<CardData[]> {
  const res = await fetch(CONFIG_ENDPOINT, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const payload = await res.json()
  const cards = Array.isArray(payload?.cards) ? payload.cards.filter(isValidCard) : []
  if (cards.length === 0) throw new Error('API retornou array vazio')

  console.log(`Cards carregados da API local (${cards.length} cards)`)
  return cards
}

/** Fallback: carrega cards do arquivo local */
async function loadCardsFromLocal(): Promise<CardData[]> {
  const res = await fetch('./cards.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const cards = Array.isArray(json?.cards) ? json.cards.filter(isValidCard) : []
  if (cards.length === 0) throw new Error('cards.json vazio ou inválido')

  console.warn('Aviso: usando cards.json local (API local indisponível)')
  return cards
}

/** Carrega cards com fallback: API → local */
async function loadCards(): Promise<CardData[]> {
  try {
    return await loadCardsFromApi()
  } catch (apiErr) {
    const msg = apiErr instanceof Error ? apiErr.message : 'Erro desconhecido'
    console.warn('Fallback para cards.json local:', msg)
    try {
      return await loadCardsFromLocal()
    } catch (localErr) {
      const lMsg = localErr instanceof Error ? localErr.message : 'Erro desconhecido'
      throw new Error(`Ambas fontes falharam: API (${msg}), Local (${lMsg})`)
    }
  }
}

/* ── Componentes ── */

function Card({ card }: { card: CardData }) {
  const handleClick = () => window.open(card.url, '_blank', 'noopener,noreferrer')
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
  }
  return (
    <div
      className="card md3-surface"
      data-level="open"
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${card.name} (acesso liberado)`}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-icon">{card.icon}</div>
      <h3 className="card-title">{card.name}</h3>
      <p className="card-desc">{card.description}</p>
      <span className="card-badge">{card.badge}</span>
    </div>
  )
}

export default function App() {
  const [cards, setCards] = useState<CardData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showLicenses, setShowLicenses] = useState(false)

  useEffect(() => {
    loadCards()
      .then(setCards)
      .catch((err: unknown) => {
        console.error('Erro ao inicializar catálogo de cards:', err)
        setError('Falha ao carregar o catálogo de apps.')
      })
  }, [])

  return (
    <>
      {/* Background orbs */}
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />

      {!showLicenses ? (
      <main className="layout" id="app" aria-live="polite">
        <header className="hero md3-surface">
          <h1>Portal de Apps</h1>
        </header>

        <section className="catalog" aria-labelledby="section-open-title">
          <h2 id="section-open-title">
            <span className="status-dot open" />
            Acesso Liberado
          </h2>
          <div className="card-grid" id="cards-open">
            {error
              ? <p>{error}</p>
              : cards
                  .filter((c) => isSafeUrl(c.url))
                  .map((c) => <Card key={c.url} card={c} />)
            }
          </div>
        </section>

        <noscript>
          <section className="catalog md3-surface noscript-fallback" aria-labelledby="noscript-title">
            <h2 id="noscript-title">Modo sem JavaScript</h2>
            <p>JavaScript está desativado. Ative-o para carregar automaticamente o catálogo dinâmico de apps.</p>
          </section>
        </noscript>
      </main>
      ) : (
        <main className="layout" id="app" aria-live="polite" style={{ marginTop: '30px' }}>
          <LicencasModule />
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <button onClick={() => setShowLicenses(false)} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Voltar ao Início
            </button>
          </div>
        </main>
      )}

      <footer className="app-footer md3-surface">
        <p>&copy; {new Date().getFullYear()} Portal de Apps | Leonardo Cardozo Vargas</p>
        <p className="app-version" title="Versionamento Semântico">{APP_VERSION}</p>
      </footer>
      <ComplianceBanner onViewLicenses={() => setShowLicenses(true)} />
    </>
  )
}
