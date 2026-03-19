import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

const FILES = {
    index: resolve(root, "public/index.html"),
    app: resolve(root, "public/app.js"),
    cards: resolve(root, "public/cards.json"),
    styles: resolve(root, "public/styles.css"),
    headers: resolve(root, "public/_headers")
};

const REQUIRED_HEADERS = [
    "Content-Security-Policy:",
    "X-Content-Type-Options:",
    "X-Frame-Options:",
    "Referrer-Policy:",
    "Permissions-Policy:",
    "Cross-Origin-Opener-Policy:",
    "Cross-Origin-Resource-Policy:"
];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function normalizeVersion(versionText) {
    return versionText.trim().replace(/\s+/g, " ");
}

function getCards(catalog) {
    const open = Array.isArray(catalog?.open) ? catalog.open : [];
    const restricted = Array.isArray(catalog?.restricted) ? catalog.restricted : [];
    return [...open, ...restricted];
}

async function main() {
    const [indexHtml, appJs, cardsRaw, stylesCss, headersFile] = await Promise.all([
        readFile(FILES.index, "utf-8"),
        readFile(FILES.app, "utf-8"),
        readFile(FILES.cards, "utf-8"),
        readFile(FILES.styles, "utf-8"),
        readFile(FILES.headers, "utf-8")
    ]);

    const catalog = JSON.parse(cardsRaw);
    const cards = getCards(catalog);

    assert(indexHtml.includes("<noscript>"), "index.html deve conter fallback <noscript>.");
    assert(indexHtml.includes("class=\"skip-link\""), "index.html deve conter skip-link para acessibilidade.");
    assert(indexHtml.includes("href=\"./styles.css\""), "index.html deve importar styles.css.");
    assert(indexHtml.includes("src=\"./app.js\""), "index.html deve importar app.js.");
    assert(appJs.includes("fetch(\"./cards.json\""), "app.js deve carregar cards.json via fetch.");

    const versionMatch = indexHtml.match(/HUB\s+v\d+\.\d+\.\d+/);
    assert(Boolean(versionMatch), "Versão semântica do HUB não encontrada no rodapé.");

    assert(cards.length >= 7, "Quantidade de cards esperada em cards.json não encontrada.");

    const appUrls = cards.map((card) => card?.url).filter((url) => typeof url === "string");
    const uniqueUrls = new Set(appUrls);
    assert(uniqueUrls.size === appUrls.length, "Há URLs duplicadas em cards.json (possível item órfão/repetido).");

    for (const card of cards) {
        assert(typeof card?.name === "string" && card.name.length > 0, "Card sem 'name' válido em cards.json.");
        assert(typeof card?.description === "string" && card.description.length > 0, "Card sem 'description' válido em cards.json.");
        assert(typeof card?.icon === "string" && card.icon.length > 0, "Card sem 'icon' válido em cards.json.");
        assert(typeof card?.badge === "string" && card.badge.length > 0, "Card sem 'badge' válido em cards.json.");
    }

    for (const urlText of appUrls) {
        const url = new URL(urlText);
        assert(url.protocol === "https:", `URL não segura detectada: ${urlText}`);
    }

    for (const header of REQUIRED_HEADERS) {
        assert(headersFile.includes(header), `_headers sem diretiva obrigatória: ${header}`);
    }

    assert(stylesCss.includes("@media (prefers-reduced-motion: reduce)"), "styles.css deve suportar reduced motion.");
    assert(stylesCss.includes(".glass"), "styles.css deve manter classe base de glassmorphism.");
    assert(stylesCss.includes("--md-sys-color-primary"), "styles.css deve manter tokens base do Material Design 3.");

    const version = normalizeVersion(versionMatch[0]);
    console.log(`✅ Auditoria estática aprovada (${version}).`);
    console.log(`✅ URLs validadas: ${appUrls.length}.`);
    console.log(`✅ Cards validados: ${cards.length}.`);
}

main().catch((error) => {
    console.error(`❌ Falha na auditoria estática: ${error.message}`);
    process.exit(1);
});
