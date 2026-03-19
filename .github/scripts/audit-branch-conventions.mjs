import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
const DEPLOY_WORKFLOW = resolve(ROOT, ".github/workflows/deploy.yml");
const QUALITY_WORKFLOW = resolve(ROOT, ".github/workflows/quality-gates.yml");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function extractListBlock(content, blockHeaderRegex) {
    const match = content.match(blockHeaderRegex);
    if (!match?.[1]) {
        return [];
    }

    return match[1]
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.replace(/^-\s*/, "").split("#")[0].trim())
        .filter(Boolean);
}

function containsCloudflareProduction(content) {
    return /branch:\s*production\b/.test(content);
}

async function main() {
    const [deployYml, qualityYml] = await Promise.all([
        readFile(DEPLOY_WORKFLOW, "utf-8"),
        readFile(QUALITY_WORKFLOW, "utf-8")
    ]);

    const deployPushBranches = extractListBlock(
        deployYml,
        /on:\s*\n\s*push:\s*\n\s*branches:\s*\n([\s\S]*?)(?:\n\S|$)/m
    );

    assert(
        deployPushBranches.length === 1 && deployPushBranches[0] === "main",
        `deploy.yml deve disparar somente em push para 'main'. Encontrado: [${deployPushBranches.join(", ")}].`
    );

    assert(
        containsCloudflareProduction(deployYml),
        "deploy.yml deve publicar em Cloudflare com 'branch: production'."
    );

    const qualityPrBranches = extractListBlock(
        qualityYml,
        /pull_request:\s*\n\s*branches:\s*\n([\s\S]*?)(?:\n\s*push:|\n\S|$)/m
    );

    const qualityPushBranches = extractListBlock(
        qualityYml,
        /push:\s*\n\s*branches:\s*\n([\s\S]*?)(?:\n\S|$)/m
    );

    assert(
        qualityPrBranches.length === 1 && qualityPrBranches[0] === "main",
        `quality-gates.yml (pull_request) deve usar somente 'main'. Encontrado: [${qualityPrBranches.join(", ")}].`
    );

    assert(
        qualityPushBranches.length === 1 && qualityPushBranches[0] === "main",
        `quality-gates.yml (push) deve usar somente 'main'. Encontrado: [${qualityPushBranches.join(", ")}].`
    );

    console.log("✅ Convenções de branch validadas.");
    console.log("✅ GitHub workflows: main.");
    console.log("✅ Cloudflare deploy target: production.");
}

main().catch((error) => {
    console.error(`❌ Falha na convenção de branch: ${error.message}`);
    process.exit(1);
});
