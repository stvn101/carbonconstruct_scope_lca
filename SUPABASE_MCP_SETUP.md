# Supabase MCP Server Setup

## Overview

This document explains the setup and configuration of the Supabase MCP (Model Context Protocol) server for the CarbonConstruct project.

## Configuration

The Supabase MCP server is configured in `.vscode/mcp.json` with the following features:

- **docs**: Access to Supabase documentation
- **account**: Account management capabilities
- **database**: Database operations and queries
- **debugging**: Debugging tools and logs
- **development**: Development environment management
- **functions**: Edge Functions management
- **branching**: Database branching for development
- **storage**: File storage management

## Authentication

The MCP server requires authentication using the Supabase anonymous API key. When prompted by VS Code, use this key:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcXpveW91dXpoY2h1eXphZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTQyNjgsImV4cCI6MjA1OTM5MDI2OH0.NRKgoHt0rISen_jzkJpztRwmc4DFMeQDAinCu3eCDRE
```

## Project Configuration

- **Project Reference**: `jaqzoyouuzhchuyzafii`
- **Project URL**: `https://jaqzoyouuzhchuyzafii.supabase.co`
- **MCP Server URL**: `https://mcp.supabase.com/mcp`

## Available Tools

Once authenticated, you'll have access to various Supabase management tools through the MCP interface:

### Database Migration Tools

- `mcp_supabase_apply_migration` - Apply DDL migrations
- `mcp_supabase_list_migrations` - List database migrations
- `mcp_supabase_create_branch` - Create development branches
- `mcp_supabase_delete_branch` - Delete development branches
- `mcp_supabase_list_branches` - List all branches
- `mcp_supabase_merge_branch` - Merge branch to production
- `mcp_supabase_rebase_branch` - Rebase branch on production
- `mcp_supabase_reset_branch` - Reset branch migrations

### Edge Functions Management

- Deploy and manage Edge Functions
- View function contents and configurations
- List all functions in the project

### Project Configuration

- Get project URL and API keys
- Manage storage configuration
- Access project settings

### Logging and Advisory

- Get recent project logs
- Access security and performance advisories
- Monitor project health

### Storage Management

- List storage buckets
- Manage database extensions
- View table schemas

### SQL Execution

- Execute raw SQL queries
- Direct database access for complex operations

## Troubleshooting

### Authentication Issues

If you encounter 401 (Unauthorized) errors:

1. Ensure VS Code MCP is enabled in settings
2. Verify the API key is correct when prompted
3. Check that the project reference matches your Supabase project

### Connection Issues

If the MCP server fails to start:

1. Restart VS Code to refresh MCP connections
2. Check internet connectivity
3. Verify the Supabase project is active and accessible

## Usage Examples

After successful authentication, you can:

1. **List database migrations**:
   - Use the Supabase tools to view current database state

2. **Create development branches**:
   - Safely test database changes in isolated environments

3. **Deploy Edge Functions**:
   - Manage server-side logic and API endpoints

4. **Monitor project health**:
   - Access logs and performance metrics

## Security Notes

- The anonymous API key is safe for client-side use
- Row Level Security (RLS) policies protect sensitive data
- Never commit actual environment files to version control
- Use `.env.example` as a template for local configuration

## Next Steps

1. Restart VS Code to apply MCP configuration changes
2. When prompted, enter the Supabase anonymous API key
3. Test the connection by using Supabase MCP tools
4. Begin managing your database and functions through the MCP interface
