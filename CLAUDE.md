# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` - Runs both Next.js frontend and Convex backend in parallel
- **Build project**: `npm run build` - Creates production build  
- **Lint code**: `npm run lint` - Runs ESLint
- **Start production server**: `npm start` - Serves production build

## Architecture Overview

This is a full-stack Next.js application using Convex as the backend database and real-time engine.

### Frontend (Next.js)
- **App Router**: Uses Next.js 15 App Router with file-based routing in `/app`
- **Client Components**: Main interactivity in `app/page.tsx` marked with "use client"
- **Convex Integration**: ConvexClientProvider wraps the app in `app/layout.tsx` for real-time data
- **Styling**: Tailwind CSS with dark mode support, Geist fonts

### Backend (Convex)
- **Functions**: All backend logic in `/convex` directory using the new function syntax
- **Schema**: Database schema defined in `convex/schema.ts` with TypeScript validation
- **Real-time**: Queries automatically update UI when data changes
- **Function Types**: 
  - `query` for reading data
  - `mutation` for writing data  
  - `action` for external API calls and non-transactional operations

### Key Patterns
- **Function Definition**: Always use new syntax with `args`, `returns`, and `handler`
- **Validators**: All functions must include argument and return validators using `v.*`
- **File-based Routing**: Convex functions accessible as `api.filename.functionName`
- **Real-time Updates**: UI components use `useQuery` and `useMutation` hooks

## Convex-Specific Guidelines
`.cursor/rules/convex_rules.mdc` contains our rules for building Convex projects.
If you need help, use web search to find the relevant information on the latest Convex documentation.

### Function Syntax
Always use the new function syntax from `.cursor/rules/convex_rules.mdc`:
```typescript
export const myFunction = query({
  args: { param: v.string() },
  returns: v.object({ result: v.string() }),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

### Important Rules
- Use `v.null()` validator when returning null
- Include both `args` and `returns` validators for all functions
- Use `withIndex` instead of `filter` for queries
- File-based routing: functions in `convex/myFunctions.ts` are accessed as `api.myFunctions.functionName`
- Authentication is available via `ctx.auth.getUserIdentity()`

## Current Implementation

The app demonstrates a simple number storage system:
- Frontend displays a list of numbers and allows adding random numbers
- Backend stores numbers in a `numbers` table with real-time updates
- Shows authentication state (currently shows "Anonymous")
- Includes example server-side rendering route at `/server`

## Environment Setup
- Convex URL configured in `NEXT_PUBLIC_CONVEX_URL` environment variable
- ConvexClientProvider handles client-side connection

## Templates
Templates are stored in the `context/pages_nonprofit_ai_templates` directory as markdown files. We will need to migrate them to the Convex database.

## Design
Use shadcn. Keep in mind that the package is not shadcn/ui, it's just shadcn now.