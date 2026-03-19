import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();

const FILES = {
    cards: resolve(root, "public/cards.json"),
    index: resolve(root, "public/index.html"),
    baseline: resolve(root, ".github/baselines/hub-structure.snapshot.json")
};

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function parseCardsBlock(cardsJson, sectionName) {
    const section = cardsJson?.[sectionName];
    assert(Array.isArray(section), `Seção '${sectionName}' ausente em cards.json.`);
    assert(section.length > 0, `Nenhum card encontrado na seção '${sectionName}'.`);
    return section;
}

function computeSignature(payload) {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function hasUpdateFlag() {
    return process.argv.includes("--update");
}

async function main() {
    const [cardsRaw, indexHtml, baselineRaw] = await Promise.all([
        readFile(FILES.cards, "utf-8"),
        readFile(FILES.index, "utf-8"),
        readFile(FILES.baseline, "utf-8")
    ]);

    const cardsJson = JSON.parse(cardsRaw);
    const baseline = JSON.parse(baselineRaw);

    const openCards = parseCardsBlock(cardsJson, "open");
    const restrictedCards = parseCardsBlock(cardsJson, "restricted");

    const structure = {
        open: openCards,
        restricted: restrictedCards,
        flags: {
            hasOpenRoot: indexHtml.includes('id="cards-open"'),
            hasRestrictedRoot: indexHtml.includes('id="cards-restricted"'),
            hasNoscriptFallback: indexHtml.includes("<noscript>"),
            hasSkipLink: indexHtml.includes("class=\"skip-link\"")
        }
    };

    assert(structure.flags.hasOpenRoot, "Container #cards-open ausente no index.html.");
    assert(structure.flags.hasRestrictedRoot, "Container #cards-restricted ausente no index.html.");
    assert(structure.flags.hasNoscriptFallback, "Fallback <noscript> ausente no index.html.");
    assert(structure.flags.hasSkipLink, "Skip-link ausente no index.html.");

    const signature = computeSignature(structure);

    if (hasUpdateFlag()) {
        const nextBaseline = {
            ...baseline,
            signature,
            updatedAt: new Date().toISOString(),
            cards: {
                open: openCards.length,
                restricted: restrictedCards.length
            }
        };

        await writeFile(FILES.baseline, `${JSON.stringify(nextBaseline, null, 2)}\n`, "utf-8");
        console.log("📝 Baseline estrutural atualizado com sucesso.");
        console.log(`📝 Nova assinatura: ${signature}`);
        return;
    }

    assert(
        signature === baseline.signature,
        `Snapshot estrutural divergente. Esperado=${baseline.signature} | Atual=${signature}. Se a mudança for intencional, rode: node .github/scripts/audit-structure-snapshot.mjs --update`
    );

    console.log("✅ Snapshot estrutural aprovado.");
    console.log(`✅ Assinatura: ${signature}`);
    console.log(`✅ Cards: open=${openCards.length}, restricted=${restrictedCards.length}`);
}

main().catch((error) => {
    console.error(`❌ Falha no snapshot estrutural: ${error.message}`);
    process.exit(1);
});
