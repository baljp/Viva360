
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Build Verification for Hostinger/Vercel...');

const distPath = path.join(__dirname, '../dist');
const errors = [];

// 1. Verify dist folder exists
if (!fs.existsSync(distPath)) {
    errors.push('❌ dist/ folder not found. Build likely failed.');
} else {
    console.log('✅ dist/ folder exists');
    
    // 2. Verify index.html
    if (fs.existsSync(path.join(distPath, 'index.html'))) {
        console.log('✅ dist/index.html found');
    } else {
        errors.push('❌ dist/index.html missing');
    }
    
    // 3. Verify assets
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
        const files = fs.readdirSync(assetsPath);
        const hasJs = files.some(f => f.endsWith('.js'));
        const hasCss = files.some(f => f.endsWith('.css'));
        
        if (hasJs) console.log('✅ JS bundle found in assets');
        else errors.push('❌ No JS bundle found in dist/assets');
        
        if (hasCss) console.log('✅ CSS bundle found in assets');
        else errors.push('❌ No CSS bundle found in dist/assets');
    } else {
        errors.push('❌ dist/assets folder missing');
    }
    
    // 4. Verify Hostinger Compat (.htaccess)
    // Note: Vite copies public/ to dist/
    if (fs.existsSync(path.join(distPath, '.htaccess'))) {
        console.log('✅ .htaccess found in dist/ (Hostinger Routing OK)');
    } else {
        errors.push('❌ dist/.htaccess missing (React Router will fail on refresh)');
    }
}

if (errors.length > 0) {
    console.error('\n⚠️  VERIFICATION FAILED:');
    errors.forEach(e => console.error(e));
    process.exit(1);
} else {
    console.log('\n🎉 BUILD VERIFICATION PASSED! Ready for Hostinger/Vercel.');
    process.exit(0);
}
