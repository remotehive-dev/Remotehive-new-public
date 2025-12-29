# RemoteHive Rules (Build Complete)

[byterover-mcp]
MUST use `byterover-retrieve-knowledge` for context/debugging & `byterover-store-knowledge` for saving patterns/solutions.

## Architecture
- **Admin**: `remotehive-admin` (Next.js :3000)
- **Public**: `remotehive-public` (Vite :5173)
- **Resume**: `temp_reactive_resume` (Nx)
- **Backend**: Python/FastAPI (:8000)
- **Auth/DB**: Clerk (JWT 'supabase') + Supabase (RLS).

## Workflow
- **Startup**: `python3 comprehensive_startup.py` runs all services.
- **Dev**: Focus on features & maintenance. Build is stable.
- **Auth Pattern**:
  ```ts
  const { getToken } = useAuth();
  const token = await getToken({ template: 'supabase' });
  const supabase = getSupabase(token);
  ```

## Key Configs
- **Env**: Check `.env` in admin/public for keys (Clerk, Supabase, Google Maps, OpenRouter).
- **Resume**: AI parsing (OpenRouter) + PDF generation.
- **Maps**: Google Places API in `PostJob`.

## Troubleshooting
- **PDF Worker**: Check `pdfjs-dist` paths.
- **RLS Errors**: Verify Clerk-Supabase JWT exchange.

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
