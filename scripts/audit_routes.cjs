
const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const screenMapPath = path.join(baseDir, 'src/navigation/screenMap.tsx');
const appPath = path.join(baseDir, 'App.tsx');

function audit() {
    console.log("=== Viva360 Route & Asset Audit ===");
    
    if (!fs.existsSync(screenMapPath)) {
        console.error("Error: screenMap.tsx not found at " + screenMapPath);
        return;
    }

    const screenMapLines = fs.readFileSync(screenMapPath, 'utf8').split('\n');
    const importRegex = /lazyNamed\(\(\) => import\('(.*?)'\), '(.*?)'\)/;
    const defaultImportRegex = /lazy\(\(\) => import\('(.*?)'\)\)/;

    const brokenImports = [];

    screenMapLines.forEach((line, index) => {
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
            return;
        }

        let match = line.match(importRegex) || line.match(defaultImportRegex);
        if (match) {
            const relativePath = match[1];
            const componentName = match[2] || 'Default';
            const absolutePath = path.resolve(path.dirname(screenMapPath), relativePath);
            
            const possibleExtensions = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
            let found = false;
            for (const ext of possibleExtensions) {
                const fullPath = absolutePath.endsWith(ext) ? absolutePath : absolutePath + ext;
                if (fs.existsSync(fullPath)) {
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                brokenImports.push({ line: index + 1, componentName, relativePath, absolutePath });
            }
        }
    });

    if (brokenImports.length > 0) {
        console.error("\n❌ Found " + brokenImports.length + " broken imports in screenMap.tsx:");
        brokenImports.forEach(imp => {
            console.error(`  - Line ${imp.line}: Component: ${imp.componentName} | Path: ${imp.relativePath}`);
        });
    } else {
        console.log("\n✅ All screenMap.tsx imports verified.");
    }

    // Audit App.tsx for basic Route/ViewState consistency
    const appContent = fs.readFileSync(appPath, 'utf8');
    const viewStateRegex = /ViewState\.(\w+)/g;
    const viewStatesInApp = new Set();
    let match;
    while ((match = viewStateRegex.exec(appContent)) !== null) {
        viewStatesInApp.add(match[1]);
    }

    console.log(`\nFound ${viewStatesInApp.size} ViewStates referenced in App.tsx`);

    console.log("\n=== Audit Complete ===");
}

audit();
