import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const CARDS_FILE = resolve(root, "public/cards.json");

function parseArgs() {
    const args = process.argv.slice(2);
    const strict = args.includes("--strict");

    const timeoutArg = args.find((arg) => arg.startsWith("--timeout="));
    const timeoutMs = timeoutArg ? Number(timeoutArg.split("=")[1]) : 5000;

    const concurrencyArg = args.find((arg) => arg.startsWith("--concurrency="));
    const concurrency = concurrencyArg ? Number(concurrencyArg.split("=")[1]) : 3;

    return {
        strict,
        timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000,
        concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 3
    };
}

function extractUrls(cardsJson) {
    const open = Array.isArray(cardsJson?.open) ? cardsJson.open : [];
    const restricted = Array.isArray(cardsJson?.restricted) ? cardsJson.restricted : [];
    const urls = [...open, ...restricted]
        .map((card) => card?.url)
        .filter((url) => typeof url === "string");

    return [...new Set(urls)];
}

async function requestWithTimeout(url, timeoutMs, method = "HEAD") {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
        const response = await fetch(url, {
            method,
            redirect: "follow",
            signal: controller.signal
        });

        return {
            ok: response.status >= 200 && response.status < 400,
            status: response.status,
            elapsedMs: Date.now() - startedAt,
            method,
            error: null
        };
    } catch (error) {
        return {
            ok: false,
            status: null,
            elapsedMs: Date.now() - startedAt,
            method,
            error: error instanceof Error ? error.message : String(error)
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function probeUrl(url, timeoutMs) {
    const headResult = await requestWithTimeout(url, timeoutMs, "HEAD");

    if (headResult.ok) {
        return { url, ...headResult };
    }

    if (headResult.status === 405 || headResult.status === 501) {
        const getResult = await requestWithTimeout(url, timeoutMs, "GET");
        return { url, ...getResult };
    }

    return { url, ...headResult };
}

async function runWithConcurrency(items, concurrency, worker) {
    const results = [];
    let index = 0;

    async function consume() {
        while (index < items.length) {
            const currentIndex = index;
            index += 1;
            results[currentIndex] = await worker(items[currentIndex]);
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => consume());
    await Promise.all(workers);
    return results;
}

async function main() {
    const { strict, timeoutMs, concurrency } = parseArgs();
    const cardsRaw = await readFile(CARDS_FILE, "utf-8");
    const cardsJson = JSON.parse(cardsRaw);
    const urls = extractUrls(cardsJson);

    if (urls.length === 0) {
        console.log("⚠️ Nenhuma URL externa encontrada para checagem.");
        return;
    }

    const results = await runWithConcurrency(urls, concurrency, (url) => probeUrl(url, timeoutMs));

    const failures = [];
    for (const result of results) {
        if (result.ok) {
            console.log(`✅ ${result.url} [${result.method}] status=${result.status} tempo=${result.elapsedMs}ms`);
            continue;
        }

        failures.push(result);
        const statusPart = result.status ? `status=${result.status}` : "status=sem resposta";
        const errorPart = result.error ? `erro=${result.error}` : "erro=n/a";
        console.log(`::warning::Link indisponível: ${result.url} (${statusPart}; ${errorPart}; tempo=${result.elapsedMs}ms)`);
    }

    console.log(`ℹ️ Checagem concluída: total=${results.length}, indisponíveis=${failures.length}, timeout=${timeoutMs}ms.`);

    if (strict && failures.length > 0) {
        console.error(`❌ Falha em modo estrito: ${failures.length} link(s) indisponível(is).`);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(`❌ Erro na auditoria de links externos: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
