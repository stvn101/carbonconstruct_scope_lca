# Stripe MCP Server Setup

This document explains the setup and configuration of the Stripe MCP (Model Context Protocol) server for the CarbonConstruct project.

## 🔧 Configuration

The Stripe MCP server is configured in `.vscode/mcp.json` with the following features:

### MCP Server Configuration

```jsonc
{
  "stripe": {
    "type": "stdio",
    "command": "npx",
    "args": ["@stripe/mcp"],
    "env": {
      "STRIPE_SECRET_KEY": "${input:stripe-secret-key}"
    }
  }
}
```

## 🔑 Authentication

The MCP server requires authentication using your Stripe Secret Key. When prompted by VS Code, use your rotated Stripe secret key.

**Important**: Never use hardcoded keys. The MCP configuration uses secure input prompts.

## 🎯 Available Features

### Core Configuration

- **MCP Server Package**: `@stripe/mcp`
- **Transport**: stdio (standard input/output)
- **Authentication**: Stripe Secret Key via secure input

### Available Tools

Once authenticated, you'll have access to various Stripe management tools through the MCP interface:

#### Payment Management

- Create and manage payment intents
- Process payments and refunds
- Handle payment methods
- Manage payment confirmations

#### Customer Management

- Create and update customers
- Manage customer payment methods
- Handle customer subscriptions
- Access customer payment history

#### Subscription Management

- Create and modify subscriptions
- Handle subscription billing cycles
- Manage subscription items and pricing
- Process subscription cancellations

#### Product and Pricing

- Create and update products
- Manage pricing tiers
- Handle recurring billing configurations
- Set up usage-based billing

#### Invoice Management

- Generate and send invoices
- Track invoice status
- Handle invoice payments
- Manage billing cycles

#### Webhook Management

- Configure webhook endpoints
- Test webhook delivery
- Handle webhook signatures
- Debug webhook events

#### Analytics and Reporting

- Access payment analytics
- Generate financial reports
- Monitor subscription metrics
- Track customer lifetime value

## 🚀 Setup Instructions

### 1. Verify MCP Configuration

The Stripe MCP server is already configured in `.vscode/mcp.json`. No additional setup required.

### 2. Prepare Stripe Credentials

Make sure you have:

- ✅ Rotated Stripe Secret Key (after security cleanup)
- ✅ Webhook endpoints configured (if needed)
- ✅ Proper API permissions

### 3. Enable MCP in VS Code

1. Ensure VS Code MCP is enabled in settings
2. Restart VS Code to load the new Stripe MCP configuration
3. When prompted, enter your Stripe Secret Key

## 🔍 Troubleshooting

If the MCP server fails to start:

1. **Restart VS Code** to refresh MCP connections
2. **Verify API Key**: Make sure you're using the rotated secret key
3. **Check Network**: Ensure you can reach Stripe's API
4. **Review Permissions**: Confirm your API key has necessary permissions

### Common Issues

#### Authentication Errors

- Make sure you're using `sk_live_...` or `sk_test_...` format
- Verify the key hasn't been deactivated in Stripe Dashboard
- Check that key permissions include required scopes

#### Connection Issues

- Verify internet connectivity
- Check if corporate firewalls block Stripe API
- Ensure VS Code has necessary permissions

## 🔐 Security Best Practices

### API Key Management

- ✅ Use input prompts instead of hardcoded keys
- ✅ Rotate keys regularly
- ✅ Use different keys for test/live environments
- ✅ Monitor API key usage in Stripe Dashboard

### Environment Separation

- Use test keys for development
- Use live keys only for production
- Never commit API keys to git
- Use secure environment variable storage

## 📚 Usage Examples

### Creating a Payment Intent

```typescript
// Available through MCP tools after setup
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // $20.00
  currency: 'aud',
  customer: 'cus_customer_id',
  metadata: {
    project: 'carbonconstruct',
    feature: 'premium_calculations'
  }
});
```

### Managing Subscriptions

```typescript
// Create subscription for premium features
const subscription = await stripe.subscriptions.create({
  customer: 'cus_customer_id',
  items: [{
    price: 'price_premium_monthly'
  }],
  metadata: {
    plan: 'premium',
    features: 'advanced_calculations,reporting'
  }
});
```

### Handling Webhooks

```typescript
// Verify and process webhook events
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
);

switch (event.type) {
  case 'payment_intent.succeeded':
    // Handle successful payment
    break;
  case 'customer.subscription.created':
    // Handle new subscription
    break;
}
```

## 📋 Integration Checklist

### Pre-Setup

- [ ] Stripe account configured
- [ ] API keys rotated (post-security cleanup)
- [ ] Webhook endpoints configured
- [ ] VS Code with MCP support installed

### Setup Process

- [ ] MCP configuration verified in `.vscode/mcp.json`
- [ ] VS Code restarted to load configuration
- [ ] Stripe Secret Key entered when prompted
- [ ] MCP tools available in VS Code

### Testing

- [ ] Can access Stripe MCP tools
- [ ] API calls work with rotated keys
- [ ] Webhook delivery functional
- [ ] Error handling working correctly

### Production Ready

- [ ] Live API keys configured
- [ ] Webhook URLs point to production
- [ ] Error monitoring in place
- [ ] API usage tracking enabled

## 🔄 Next Steps

1. **Complete Setup**: Follow the setup instructions above
2. **Test Integration**: Verify MCP tools work with your Stripe account
3. **Configure Webhooks**: Set up webhook endpoints for real-time updates
4. **Monitor Usage**: Track API calls and billing in Stripe Dashboard

## 📞 Support Resources

- **Stripe Documentation**: <https://stripe.com/docs>
- **MCP Documentation**: <https://modelcontextprotocol.io/>
- **VS Code MCP Guide**: <https://code.visualstudio.com/docs/copilot/mcp>

---

**Status**: ✅ **Configured** - Stripe MCP server ready for use with secure authentication
