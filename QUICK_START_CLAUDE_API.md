# Quick Start: Claude API Integration

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account or sign in
3. Settings → API Keys → Create Key
4. Copy the key (starts with `sk-ant-`)

### 3. Configure Environment
```bash
# Create local environment file
cp .env.example .env.local

# Edit .env.local and add:
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 4. Deploy to Vercel
```bash
# Add to Vercel environment variables
vercel env add ANTHROPIC_API_KEY

# Paste your API key when prompted

# Deploy
vercel --prod
```

### 5. Test
```javascript
// In your app, after authentication:
const response = await fetch('/api/invoke-agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentType: 'cc-lca-analyst',
    action: 'calculate_lca',
    data: {
      projectInfo: { name: 'Test Project', gfa: 1000 },
      materials: [
        { name: 'Concrete', quantity: 100, carbonFactor: 0.5 }
      ]
    }
  })
});

const result = await response.json();
console.log('Success:', result.success);
console.log('Used Claude:', result.usedClaudeAPI);
console.log('Cost:', result.cost);
```

---

## What You Get

✅ **4 AI Agents**:
- LCA Analyst (ISO 14040/14044)
- Compliance Checker (NCC, NABERS, Green Star)
- Materials Database Manager
- Construction Estimator

✅ **Auto-Fallback**: Works without API key (uses standard calculations)

✅ **Cost Tracking**: Every invocation logged with cost

✅ **Rate Limited**: Free (5/mo), Pro (50/mo), Enterprise (unlimited)

---

## Costs

| Action | Typical Cost |
|--------|-------------|
| LCA Calculation | ~$0.10 |
| Compliance Check | ~$0.05 |
| Database Sync | ~$0.02 |
| Cost Estimation | ~$0.08 |

**Pro Tier Example**: 50 LCA calculations/month = ~$5/month

---

## No API Key? No Problem!

The system **automatically falls back** to standard calculations if:
- API key not configured
- API call fails
- Rate limit exceeded

No errors, no downtime, just works!

---

## Full Documentation

See [CLAUDE_API_SETUP.md](CLAUDE_API_SETUP.md) for complete details.

---

**Status**: ✅ Ready to use
**Version**: 1.0.0
