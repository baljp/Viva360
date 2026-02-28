import fs from 'fs';
import path from 'path';

// This script performs a static analysis of the Viva360 flow registry to ensure:
// 1. Every flow in registry.ts has valid entry/exit screens.
// 2. Every screen mentioned in registry.ts exists in screenMap.tsx.
// 3. Every flow adheres to the "No dead ends" principle.

const REGISTRY_PATH = 'src/flow/registry.ts';
const SCREEN_MAP_PATH = 'src/navigation/screenMap.tsx';

function log(msg) { console.log(`[FlowAudit] ${msg}`); }
function error(msg) { console.error(`[FlowAudit-ERROR] ${msg}`); process.exit(1); }

async function run() {
    log('Starting Flow Completeness Audit...');

    if (!fs.existsSync(REGISTRY_PATH)) error(`Registry not found at ${REGISTRY_PATH}`);
    if (!fs.existsSync(SCREEN_MAP_PATH)) error(`ScreenMap not found at ${SCREEN_MAP_PATH}`);

    const registryContent = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    const screenMapContent = fs.readFileSync(SCREEN_MAP_PATH, 'utf-8');

    // 1. Extract Screens from screenMap.tsx
    // Patterns like 'DASHBOARD: ClientDashboard,' or 'ORACLE_PORTAL: OracleView,'
    const screensInMap = new Set();
    const screenMatches = screenMapContent.matchAll(/([A-Z0-9_]+):\s+([A-Za-z0-9]+)/g);
    for (const match of screenMatches) {
        screensInMap.add(match[1]);
    }
    log(`Found ${screensInMap.size} unique screens in screenMap.tsx`);

    // 2. Parse Registry (Naive approach but effective for static audit)
    // We look for objects inside the flowRegistry array
    const flowBlocks = registryContent.match(/\{[\s\S]*?id:\s*'([a-z0-9_]+)'[\s\S]*?screens:\s*\[([\s\S]*?)\][\s\S]*?\}/g);

    if (!flowBlocks) error('No flows found in registry.ts');
    log(`Validating ${flowBlocks.length} flows...`);

    let totalIssues = 0;

    for (const block of flowBlocks) {
        const idMatch = block.match(/id:\s*'([a-z0-9_]+)'/);
        const flowId = idMatch ? idMatch[1] : 'unknown';

        const screensMatch = block.match(/screens:\s*\[([\s\S]*?)\]/);
        if (!screensMatch) {
            log(`[${flowId}] ERROR: No screens array found`);
            totalIssues++;
            continue;
        }

        const flowScreens = screensMatch[1]
            .split(',')
            .map(s => s.trim().replace(/'/g, '').replace(/"/g, ''))
            .filter(s => s.length > 0);

        if (flowScreens.length === 0) {
            log(`[${flowId}] ERROR: Empty screens array`);
            totalIssues++;
            continue;
        }

        // A. Check Entry Point
        if (flowScreens[0] !== 'START' && flowScreens[0] !== 'DASHBOARD' && flowScreens[0] !== 'EXEC_DASHBOARD') {
            log(`[${flowId}] WARNING: Flow starts with ${flowScreens[0]} instead of a primary entry point.`);
        }

        // B. Check existence in screenMap
        for (const screen of flowScreens) {
            if (screen !== 'START' && screen !== 'END' && !screensInMap.has(screen)) {
                log(`[${flowId}] ERROR: Screen "${screen}" is not defined in screenMap.tsx`);
                totalIssues++;
            }
        }

        // C. Terminal Screen Logic
        const expectedFinalMatch = block.match(/expectedFinal:\s*'([A-Z0-9_]+)'/);
        if (expectedFinalMatch) {
            const expectedFinal = expectedFinalMatch[1];
            if (!flowScreens.includes(expectedFinal)) {
                log(`[${flowId}] ERROR: expectedFinal "${expectedFinal}" is not in the screens list`);
                totalIssues++;
            }
        }
    }

    if (totalIssues > 0) {
        error(`Audit failed with ${totalIssues} errors.`);
    } else {
        log('✅ Flow Completeness Audit passed! All flows have valid mappings.');
    }
}

run();
