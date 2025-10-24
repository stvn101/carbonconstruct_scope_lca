# MCP Configuration Cleanup

## Overview

Cleaned up the Model Context Protocol (MCP) configuration to only include servers that are essential for the CarbonConstruct Scope LCA application.

## Removed MCP Servers

The following unnecessary MCP servers were removed:

### 🗑️ Playwright MCP

- **Purpose**: Browser automation for testing
- **Reason for Removal**: Not needed for the current LCA application
- **Impact**: No functionality loss for the core application

### 🗑️ Fetch MCP

- **Purpose**: Generic HTTP fetch capabilities
- **Reason for Removal**: Redundant with built-in capabilities
- **Impact**: No functionality loss

### 🗑️ Browserbase MCP

- **Purpose**: Cloud browser automation
- **Reason for Removal**: Not needed for the current application
- **Impact**: No functionality loss

## Retained MCP Servers

The following essential MCP servers are configured:

### ✅ Supabase MCP

- **Purpose**: Database management, authentication, storage
- **Justification**: Core backend service for the application
- **Features**: docs, account, database, debugging, development, functions, branching, storage

### ✅ Stripe MCP

- **Purpose**: Payment processing and subscription management
- **Justification**: Essential for monetization and payment features
- **Features**: Payment processing, subscription management, customer management

## Added MCP Servers

The following required MCP servers were added:

### ➕ GitHub MCP

- **Purpose**: Repository management and version control
- **Justification**: Essential for development workflow
- **Features**: Repository management, issue tracking, pull requests

### ➕ Vercel MCP

- **Purpose**: Deployment and hosting management
- **Justification**: Primary deployment platform for the application
- **Features**: Deployment management, environment variables, domain configuration

## Configuration Summary

**Final MCP Servers**: 4 total

- Supabase (database & backend)
- Stripe (payments)
- GitHub (repository management)
- Vercel (deployment)

## Security Features

- All API keys use secure input prompts (`${input:*}`)
- No hardcoded credentials in configuration
- Password-protected input fields for sensitive data

## Next Steps

1. Restart VS Code to load the new MCP configuration
2. Enter API keys when prompted:
   - Supabase Anonymous API Key
   - Stripe Secret Key
   - GitHub Personal Access Token
   - Vercel API Token

## Benefits

- ✅ Reduced complexity
- ✅ Faster startup times
- ✅ Only essential tools available
- ✅ Cleaner development environment
- ✅ Better security posture
