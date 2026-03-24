/**
 * GET /api/config
 * Lê cards do módulo apphub diretamente da tabela apphub_cards no BIGDATA_DB.
 * Sem dependência do admin-app para leitura pública.
 */

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

/**
 * @param {import('@cloudflare/workers-types').PagesFunction<{ BIGDATA_DB?: D1Database }>} context
 */
export async function onRequestGet(context) {
  const db = context.env.BIGDATA_DB

  if (!db) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'BIGDATA_DB não configurado para apphub.',
    }), {
      status: 503,
      headers: JSON_HEADERS,
    })
  }

  try {
    const result = await db.prepare(`
      SELECT name, description, url, icon, badge
      FROM apphub_cards
      ORDER BY display_order ASC, id ASC
    `).all()

    const cards = Array.isArray(result?.results) ? result.results : []

    return new Response(JSON.stringify({
      ok: true,
      source: 'bigdata_db',
      total: cards.length,
      cards,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: JSON_HEADERS,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao consultar apphub_cards'
    return new Response(JSON.stringify({
      ok: false,
      error: message,
    }), {
      status: 500,
      headers: JSON_HEADERS,
    })
  }
}
