const SAFE_PROTOCOLS = new Set(["https:"]);
const APP_VERSION = "v03.0.0";

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
 * @returns {Promise<Array<{name: string, description: string, url: string, icon: string, badge: string}>>}
 */
async function loadCards() {
    const response = await fetch("./cards.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Falha ao carregar cards.json: HTTP ${response.status}`);
    }

    const json = await response.json();
    const cards = Array.isArray(json?.cards) ? json.cards.filter(isValidCard) : [];

    return cards;
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
