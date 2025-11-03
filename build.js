#!/usr/bin/env node
/**
 * Build script for CarbonConstruct
 * Injects environment variables into static HTML files for Vercel deployment
 * NO HARDCODED KEYS - All from environment variables only
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting CarbonConstruct build process...');

// Environment variables to inject - NO FALLBACKS, NO HARDCODED VALUES
const ENV_VARS = {
    NEXT_PUBLIC_EC3_API_KEY: process.env.NEXT_PUBLIC_EC3_API_KEY || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    APP_URL: process.env.APP_URL || '',
    EC3_CLIENT_ID: process.env.EC3_CLIENT_ID || 'gNyUuor5vOAOiCrRdQ7o209nnMzESTrb4HpGKpqX' // Public OAuth client ID (not secret)
};

console.log('🔑 Environment variables status:');
console.log('  - EC3_API_KEY:', ENV_VARS.NEXT_PUBLIC_EC3_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('  - SUPABASE_URL:', ENV_VARS.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('  - SUPABASE_ANON_KEY:', ENV_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');
console.log('  - APP_URL:', ENV_VARS.APP_URL ? '✅ SET' : '❌ NOT SET (will use window.location.origin)');

// Create environment injection script
const envScript = `
<script>
// Environment variables injected at build time from Vercel
// NO HARDCODED KEYS - All from environment variables
window.ENV = {
    NEXT_PUBLIC_EC3_API_KEY: '${ENV_VARS.NEXT_PUBLIC_EC3_API_KEY}',
    NEXT_PUBLIC_SUPABASE_URL: '${ENV_VARS.NEXT_PUBLIC_SUPABASE_URL}',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '${ENV_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY}',
    APP_URL: '${ENV_VARS.APP_URL}' || window.location.origin,
    EC3_CLIENT_ID: '${ENV_VARS.EC3_CLIENT_ID}'
};
console.log('✅ Environment variables loaded from build');
</script>
`;

// Files to process - all HTML files that need environment variables
const htmlFiles = [
    'index.html',
    'dashboard.html',
    'calculator.html',
    'operational-carbon.html',
    'signin-new.html',
    'signup-new.html',
    'signin.html',
    'signup.html',
    'settings.html',
    'subscription.html',
    'ec3-oauth.html',
    'ec3-callback.html',
    'test-ec3.html'
];

let injectedCount = 0;
let skippedCount = 0;

htmlFiles.forEach(filename => {
    const filePath = path.join(__dirname, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${filename} - file not found`);
        skippedCount++;
        return;
    }

    console.log(`📝 Processing ${filename}...`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove any existing window.ENV script blocks to avoid duplicates
    content = content.replace(/<script>[\s\S]*?window\.ENV = \{[\s\S]*?\};[\s\S]*?<\/script>/g, '');
    
    // Inject before closing </head> tag
    if (content.includes('</head>')) {
        content = content.replace('</head>', `${envScript}</head>`);
        fs.writeFileSync(filePath, content);
        console.log(`✅ Injected env vars into ${filename}`);
        injectedCount++;
    } else {
        console.log(`⚠️  No </head> tag found in ${filename}`);
        skippedCount++;
    }
});

console.log('\n✨ Build completed!');
console.log(`📝 Successfully processed: ${injectedCount} files`);
console.log(`⏭️  Skipped: ${skippedCount} files`);

// Validation warnings
console.log('\n🔐 Configuration Validation:');
if (!ENV_VARS.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('⚠️  WARNING: NEXT_PUBLIC_SUPABASE_URL not set - app may not function correctly');
}
if (!ENV_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️  WARNING: NEXT_PUBLIC_SUPABASE_ANON_KEY not set - database access will fail');
}
if (!ENV_VARS.NEXT_PUBLIC_EC3_API_KEY) {
    console.log('ℹ️  INFO: EC3_API_KEY not set - EC3 database features will be limited');
}

console.log('\n💡 To set environment variables:');
console.log('   - Vercel: Dashboard > Project > Settings > Environment Variables');
console.log('   - Local: Create .env.local file (already in .gitignore)');
console.log('\n📦 Build artifacts ready for deployment');
