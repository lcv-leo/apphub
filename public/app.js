const SAFE_PROTOCOLS = new Set(["https:"]);

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
 * @returns {Promise<{open: Array<{name: string, description: string, url: string, icon: string, badge: string}>, restricted: Array<{name: string, description: string, url: string, icon: string, badge: string}>}>}
 */
async function loadCards() {
    const response = await fetch("./cards.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Falha ao carregar cards.json: HTTP ${response.status}`);
    }

    const json = await response.json();
    const open = Array.isArray(json?.open) ? json.open.filter(isValidCard) : [];
    const restricted = Array.isArray(json?.restricted) ? json.restricted.filter(isValidCard) : [];

    return { open, restricted };
}

/**
 * @param {{name: string, description: string, url: string, icon: string, badge: string}} app
 * @param {"open" | "restricted"} level
 * @returns {HTMLAnchorElement}
 */
function createCard(app, level) {
    const card = document.createElement("a");
    card.className = "card md3-surface glass";
    card.dataset.level = level;
    card.href = app.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `${app.name} (${level === "open" ? "acesso liberado" : "acesso restrito"})`);

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
 * @param {{open: Array<{name: string, description: string, url: string, icon: string, badge: string}>, restricted: Array<{name: string, description: string, url: string, icon: string, badge: string}>}} sections
 */
function mountCards(sections) {
    const openRoot = document.getElementById("cards-open");
    const restrictedRoot = document.getElementById("cards-restricted");

    if (!openRoot || !restrictedRoot) {
        return;
    }

    const openFragment = document.createDocumentFragment();
    const restrictedFragment = document.createDocumentFragment();

    for (const app of sections.open) {
        if (!isSafeUrl(app.url)) {
            console.warn("URL insegura bloqueada:", app.url);
            continue;
        }

        openFragment.appendChild(createCard(app, "open"));
    }

    for (const app of sections.restricted) {
        if (!isSafeUrl(app.url)) {
            console.warn("URL insegura bloqueada:", app.url);
            continue;
        }

        restrictedFragment.appendChild(createCard(app, "restricted"));
    }

    if (openFragment.childNodes.length === 0 && restrictedFragment.childNodes.length === 0) {
        openRoot.textContent = "Nenhum card válido encontrado em cards.json.";
        return;
    }

    openRoot.appendChild(openFragment);
    restrictedRoot.appendChild(restrictedFragment);
}

function setYear() {
    const yearNode = document.getElementById("year");
    if (yearNode) {
        yearNode.textContent = String(new Date().getFullYear());
    }
}

async function init() {
    setYear();

    try {
        const sections = await loadCards();
        mountCards(sections);
    } catch (error) {
        console.error("Erro ao inicializar catálogo de cards:", error);

        const openRoot = document.getElementById("cards-open");
        if (openRoot) {
            openRoot.textContent = "Falha ao carregar o catálogo de apps.";
        }
    }
}

init();
