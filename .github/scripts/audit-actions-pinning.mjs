import { appendFile, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const WORKFLOWS_DIR = resolve(process.cwd(), ".github/workflows");
const SHA_REF = /^[a-f0-9]{40}$/i;

function isAllowedUseTarget(target) {
    return target.startsWith("./") || target.startsWith("docker://");
}

function parseUseRef(value) {
    const atIndex = value.lastIndexOf("@");
    if (atIndex <= 0) {
        return { action: value, ref: "" };
    }

    return {
        action: value.slice(0, atIndex),
        ref: value.slice(atIndex + 1)
    };
}

async function listWorkflowFiles() {
    const entries = await readdir(WORKFLOWS_DIR, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")))
        .map((entry) => resolve(WORKFLOWS_DIR, entry.name));
}

function collectUsesViolations(filePath, content) {
    const violations = [];
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const match = line.match(/^\s*uses:\s*([^\s#]+).*$/);
        if (!match) {
            continue;
        }

        const rawUse = match[1].trim();
        if (isAllowedUseTarget(rawUse)) {
            continue;
        }

        const { action, ref } = parseUseRef(rawUse);

        if (!ref || !SHA_REF.test(ref)) {
            violations.push({
                filePath,
                line: index + 1,
                action,
                ref: ref || "(sem ref)",
                rawUse
            });
        }
    }

    return violations;
}

function collectUsesReferences(filePath, content) {
    const refs = [];
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const match = line.match(/^\s*uses:\s*([^\s#]+).*$/);
        if (!match) {
            continue;
        }

        const rawUse = match[1].trim();
        refs.push({
            filePath,
            line: index + 1,
            rawUse
        });
    }

    return refs;
}

async function writeSummary(workflowFiles, refs, violations) {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) {
        return;
    }

    const status = violations.length === 0 ? "✅ Aprovado" : "❌ Reprovado";
    const lines = [
        "## Verificação de pinning SHA das Actions",
        "",
        `**Status:** ${status}`,
        `**Workflows analisados:** ${workflowFiles.length}`,
        `**Referências \`uses\` encontradas:** ${refs.length}`,
        `**Violações:** ${violations.length}`,
        "",
        "| Workflow | Linha | uses |",
        "|---|---:|---|"
    ];

    for (const ref of refs) {
        const relativeFile = ref.filePath.replace(`${process.cwd()}\\`, "");
        lines.push(`| ${relativeFile} | ${ref.line} | \`${ref.rawUse}\` |`);
    }

    if (violations.length > 0) {
        lines.push("", "### Violações", "");
        for (const violation of violations) {
            const relativeFile = violation.filePath.replace(`${process.cwd()}\\`, "");
            lines.push(`- ${relativeFile}:${violation.line} -> \`${violation.rawUse}\``);
        }
    }

    lines.push("");
    await appendFile(summaryPath, `${lines.join("\n")}\n`, "utf-8");
}

async function main() {
    const workflowFiles = await listWorkflowFiles();
    const allViolations = [];
    const allRefs = [];

    for (const workflowFile of workflowFiles) {
        const content = await readFile(workflowFile, "utf-8");
        allRefs.push(...collectUsesReferences(workflowFile, content));
        allViolations.push(...collectUsesViolations(workflowFile, content));
    }

    await writeSummary(workflowFiles, allRefs, allViolations);

    if (allViolations.length === 0) {
        console.log(`✅ Pinning SHA validado em ${workflowFiles.length} workflow(s).`);
        return;
    }

    for (const violation of allViolations) {
        console.log(
            `❌ ${violation.filePath}:${violation.line} -> '${violation.rawUse}' não está pinado por SHA de 40 caracteres.`
        );
    }

    console.error(`❌ Falha: ${allViolations.length} referência(s) uses sem pinning por SHA.`);
    process.exit(1);
}

main().catch((error) => {
    console.error(`❌ Erro na auditoria de pinning: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
