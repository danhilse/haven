# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and route handlers (e.g., `app/category/[slug]`).
- `components/`: Reusable React components (PascalCase files).
- `convex/`: Convex backend functions, schema, and generated API (`_generated/`).
- `lib/`: Shared utilities and types (`lib/openai.ts`, `lib/types.ts`).
- `context/`: Content assets and prompt templates used by the app.
- `public/`: Static assets served as-is.
- `scripts/`: Maintenance scripts (e.g., `importPrompts.ts`).

## Build, Test, and Development Commands
- `pnpm install`: Install dependencies (pnpm preferred; npm works too).
- `pnpm dev`: Run frontend (`next dev`) and backend (`convex dev`) in parallel. Opens Convex dashboard on first start.
- `pnpm build`: Production build via `next build`.
- `pnpm start`: Start the built app with `next start`.
- `pnpm lint`: Lint with Next/ESLint config.
- `pnpm run import-prompts`: Import markdown templates from `context/pages_nonprofit_ai_templates` into Convex.

## Coding Style & Naming Conventions
- TypeScript strict; 2-space indentation; formatting via Prettier (`.prettierrc`).
- ESLint: `next/core-web-vitals` + `next/typescript` (see `eslint.config.mjs`). Fix lint issues before PR.
- Components: PascalCase in `components/` (e.g., `PromptExecutor.tsx`).
- Routes: lower-case folders; dynamic segments in brackets (e.g., `app/prompt/[id]/page.tsx`).
- Convex functions: descriptive camelCase file names (e.g., `orgProfiles.ts`).
- Imports: prefer `@/*` alias where helpful (configured in `tsconfig.json`).

## Testing Guidelines
- No formal test suite yet. If adding tests, use Vitest/Jest + React Testing Library.
- Name tests `*.test.ts(x)` colocated with source or under `__tests__/`.
- Keep fast, deterministic tests; prioritize critical paths (Convex mutations/queries and UI rendering).

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject; include scope when helpful (e.g., `feat(components): add CategoryGrid filters`).
- Prefer small, focused PRs. Include:
  - Clear description and rationale; link issues.
  - Screenshots/GIFs for UI changes.
  - Checklist: `pnpm lint` passes; builds locally (`pnpm build`).
- Branches: `feat/*`, `fix/*`, `chore/*`, `docs/*`.

## Security & Configuration Tips
- Configure `.env.local` (not committed) with `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, `OPENAI_KEY`.
- Never log or commit secrets; `.gitignore` already excludes `.env*`.
- When changing Convex schema, regenerate and verify `_generated/` by running `pnpm dev` once.

## Convex-Specific Guidelines
`.cursor/rules/convex_rules.mdc` contains our rules for building Convex projects.
If you need help, use web search to find the relevant information on the latest Convex documentation.

## Templates
Templates are stored in the `context/pages_nonprofit_ai_templates` directory as markdown files. We will need to migrate them to the Convex database.

## Design
Use shadcn. Keep in mind that the package is not shadcn/ui, it's just shadcn now.

## Copywriting
Use the copy style guide in `context/COPY_STYLE_GUIDE.md` for all copywriting.