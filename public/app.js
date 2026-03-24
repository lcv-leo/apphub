// Módulo: apphub/public/app.js
// Versão: v03.03.00
// Descrição: Catálogo público de apps — carrega cards via API local (/api/config) com leitura direta no bigdata_db e fallback local.

const SAFE_PROTOCOLS = new Set(["https:"]);
const APP_VERSION = 'APP v03.03.00';
const CONFIG_ENDPOINT = '/api/config';

/**
 * @param {string} url
 * @returns {boolean}
 */
function isSafeUrl(url) {
    try {
        const parsed = new URL(url);
        return SAFE_PROTOCOLS.has(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * @param {unknown} value
 * @returns {value is { name: string, description: string, url: string, icon: string, badge: string }}
 */
function isValidCard(value) {
    if (!value || typeof value !== "object") {
        return false;
    }

    const card = /** @type {{name?: unknown, description?: unknown, url?: unknown, icon?: unknown, badge?: unknown}} */ (value);

    return (
        typeof card.name === "string"
        && typeof card.description === "string"
        && typeof card.url === "string"
        && typeof card.icon === "string"
        && typeof card.badge === "string"
    );
}

/**
 * Tenta carregar cards do endpoint local (Pages Function + D1)
 * @returns {Promise<Array<{name: string, description: string, url: string, icon: string, badge: string}>>}
 */
async function loadCardsFromApi() {
    const response = await fetch(CONFIG_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Falha ao carregar config local: HTTP ${response.status}`);
    }

    const payload = await response.json();
    const cards = Array.isArray(payload?.cards) ? payload.cards.filter(isValidCard) : [];

    if (cards.length === 0) {
        throw new Error('API local retornou array de cards vazio.');
    }

    console.log(`Cards carregados da API local (${cards.length} cards)`);
    return cards;
}

/**
 * Fallback: carrega cards do arquivo local
 * @returns {Promise<Array<{name: string, description: string, url: string, icon: string, badge: string}>>}
 */
async function loadCardsFromLocal() {
    const response = await fetch("./cards.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Falha ao carregar cards.json local: HTTP ${response.status}`);
    }

    const json = await response.json();
    const cards = Array.isArray(json?.cards) ? json.cards.filter(isValidCard) : [];

    if (cards.length === 0) {
        throw new Error('Local cards.json vazio ou inválido.');
    }

    console.warn('Aviso: usando cards.json local (API local indisponível)');
    return cards;
}

/**
 * Carrega cards com fallback: API local → local
 * @returns {Promise<Array<{name: string, description: string, url: string, icon: string, badge: string}>>}
 */
async function loadCards() {
    try {
        return await loadCardsFromApi();
    } catch (apiError) {
        console.warn('Fallback para cards.json local:', apiError.message);
        try {
            return await loadCardsFromLocal();
        } catch (localError) {
            throw new Error(`Ambas fontes falharam: API (${apiError.message}), Local (${localError.message})`);
        }
    }
}

/**
 * @param {{name: string, description: string, url: string, icon: string, badge: string}} app
 * @returns {HTMLAnchorElement}
 */
function createCard(app) {
    const card = document.createElement("a");
    card.className = "card md3-surface glass";
    card.dataset.level = "open";
    card.href = app.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `${app.name} (acesso liberado)`);

    const icon = document.createElement("div");
    icon.className = "card-icon";
    icon.textContent = app.icon;

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = app.name;

    const description = document.createElement("p");
    description.className = "card-desc";
    description.textContent = app.description;

    const badge = document.createElement("span");
    badge.className = "card-badge";
    badge.textContent = app.badge;

    card.append(icon, title, description, badge);
    return card;
}

/**
 * @param {Array<{name: string, description: string, url: string, icon: string, badge: string}>} cards
 */
function mountCards(cards) {
    const root = document.getElementById("cards-open");

    if (!root) {
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const app of cards) {
        if (!isSafeUrl(app.url)) {
            console.warn("URL insegura bloqueada:", app.url);
            continue;
        }

        fragment.appendChild(createCard(app));
    }

    if (fragment.childNodes.length === 0) {
        root.textContent = "Nenhum card válido encontrado em cards.json.";
        return;
    }

    root.appendChild(fragment);
}

function setYear() {
    const yearNode = document.getElementById("year");
    if (yearNode) {
        yearNode.textContent = String(new Date().getFullYear());
    }
}

function setAppVersion() {
    const versionNode = document.getElementById("hub-version-text");
    if (versionNode) {
        versionNode.textContent = APP_VERSION;
    }
}

async function init() {
    setYear();
    setAppVersion();

    try {
        const cards = await loadCards();
        mountCards(cards);
    } catch (error) {
        console.error("Erro ao inicializar catálogo de cards:", error);

        const root = document.getElementById("cards-open");
        if (root) {
            root.textContent = "Falha ao carregar o catálogo de apps.";
        }
    }
}

init();
