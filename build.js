#!/usr/bin/env node
/**
 * Build script for CarbonConstruct
 * Injects environment variables into static HTML files for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting CarbonConstruct build process...');

// Environment variables to inject
const ENV_VARS = {
    EC3_API_KEY: process.env.NEXT_PUBLIC_EC3_API_KEY || 'nK72LVKPVJxFb21fMIFpmtaLawqwvg', // fallback for local dev
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jaqzoyouuzhchuyzafii.supabase.co',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTQyNjgsImV4cCI6MjA1OTM5MDI2OH0.NRKgoHt0rISen_jzkJpztRwmc4DFMeQDAinCu3eCDRE'
};

console.log('🔑 Environment variables:');
console.log('  - EC3_API_KEY:', ENV_VARS.EC3_API_KEY ? `${ENV_VARS.EC3_API_KEY.substring(0, 8)}...` : 'NOT SET');
console.log('  - SUPABASE_URL:', ENV_VARS.SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('  - SUPABASE_ANON_KEY:', ENV_VARS.SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');

// Files to process
const filesToProcess = [
    'index.html',
    'test-ec3.html'
];

filesToProcess.forEach(filename => {
    const filePath = path.join(__dirname, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${filename} - file not found`);
        return;
    }

    console.log(`📝 Processing ${filename}...`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace environment variable placeholders
    content = content.replace(/REPLACE_WITH_EC3_API_KEY/g, ENV_VARS.EC3_API_KEY);
    content = content.replace(/REPLACE_WITH_SUPABASE_URL/g, ENV_VARS.SUPABASE_URL);
    content = content.replace(/REPLACE_WITH_SUPABASE_ANON_KEY/g, ENV_VARS.SUPABASE_ANON_KEY);

    // For test-ec3.html, also replace the hardcoded API key
    if (filename === 'test-ec3.html') {
        content = content.replace(/const EC3_API_KEY = '[^']*';/g, `const EC3_API_KEY = '${ENV_VARS.EC3_API_KEY}';`);
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filename}`);
});

console.log('🎉 Build completed successfully!');
console.log('📦 Static files are ready for deployment');

// Verify EC3 API configuration
if (ENV_VARS.EC3_API_KEY && ENV_VARS.EC3_API_KEY !== 'nK72LVKPVJxFb21fMIFpmtaLawqwvg') {
    console.log('✅ Using production EC3 API key');
} else {
    console.log('⚠️  Using development EC3 API key');
}