import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// This script performs a "Hygiene Audit" on the Viva360 codebase to ensure:
// 1. Buttons and interactive elements have handlers.
// 2. API calls are wrapped in try/catch or have error notification logic.
// 3. No critical hardcoded strings for gamification or finance.

const VIEWS_DIR = 'views';
const COMPONENTS_DIR = 'src/components';

function log(msg) { console.log(`[HygieneAudit] ${msg}`); }
function warn(msg) { console.warn(`[HygieneAudit-WARN] ${msg}`); }

async function run() {
    log('Starting Hygiene & Handler Audit...');

    const files = globSync(`${VIEWS_DIR}/**/*.{tsx,ts}`).concat(globSync(`${COMPONENTS_DIR}/**/*.{tsx,ts}`));
    log(`Scanning ${files.length} files...`);

    let issues = 0;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        // 1. Check for Buttons without onClick
        // Regex looking for <button ... > without onClick
        // Simple regex for detection (may have false positives but good for audit)
        const buttons = content.matchAll(/<button[^>]*>/g);
        for (const match of buttons) {
            const tag = match[0];
            if (!tag.includes('onClick') && !tag.includes('type="submit"') && !tag.includes('form=') && !tag.includes('disabled')) {
                // Check if it's a spread button {...props} which is common in wrappers
                if (!tag.includes('{...')) {
                    warn(`[${relativePath}] Potential inactive button: ${tag}`);
                    issues++;
                }
            }
        }

        // 2. Check for "Silenced" API Errors
        // Look for catch blocks that are empty or only console.log without UI feedback
        const silentCatches = content.match(/catch\s*\([^)]*\)\s*\{\s*(console\.(log|error|warn)\([^)]*\);?\s*)?\}/g);
        if (silentCatches) {
            for (const catchBlock of silentCatches) {
                // If it's a service file it's fine (bubble up), but in Views/Components it should show a toast/notify
                if (file.includes('views/')) {
                    warn(`[${relativePath}] Silent catch block found. Ensure user gets feedback.`);
                    issues++;
                }
            }
        }

        // 3. Check for hardcoded critical metrics (Simple keyword detection)
        if (content.includes('karma: 10') || content.includes('streak: 5') || content.includes('occupancy: 80')) {
            warn(`[${relativePath}] Potential hardcoded critical metric detected.`);
            issues++;
        }

        // 4. Check for screen without exit (Back/Close)
        // Every view component should typically contain a 'back' or 'close' or 'setView' or 'go' call
        if (file.includes('views/') && !file.includes('generated/')) {
            const hasExit = /setView|go\(|back\(|close\(|actions\.set/i.test(content);
            if (!hasExit && content.includes('export const')) {
                // warn(`[${relativePath}] View might lack an exit action (back/close).`);
                // issues++;
            }
        }
    }

    log(`--- Audit Finished ---`);
    log(`Total issues identified: ${issues}`);

    // We don't exit(1) yet as many existing items might need refinement, 
    // but we can enforce it in CI later.
}

run();
