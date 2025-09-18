# Repository Guidelines

## Project Structure & Module Organization
- `app/` houses Next.js App Router routes, layouts, and API handlers; dynamic segments live in bracketed folders (e.g., `app/prompt/[id]/page.tsx`).
- `components/` stores reusable React components in PascalCase files (e.g., `PromptExecutor.tsx`); `lib/` provides shared utilities such as `lib/openai.ts` and type definitions.
- Backend logic sits under `convex/`, including schema definitions and generated APIs in `_generated/`; content assets and prompt templates live in `context/`.
- Static assets belong in `public/`; maintenance scripts (like `scripts/importPrompts.ts`) support data import and other chores.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies; use pnpm by default to match lockfile behavior.
- `pnpm dev` runs Next.js and Convex dev servers together and opens the Convex dashboard on first launch.
- `pnpm build` performs a production `next build`; follow with `pnpm start` to serve the compiled app.
- `pnpm lint` enforces ESLint/Prettier rules before committing; fix warnings before opening a PR.

## Coding Style & Naming Conventions
- TypeScript is strict with 2-space indentation and Prettier formatting; run `pnpm lint` or your editor integration to format.
- Favor `@/*` path aliases where it improves clarity; keep components in PascalCase and Convex functions in camelCase.
- Routes use lower-case folders with bracketed dynamic segments, matching the App Router conventions.

## User Experience Principles
- Treat prompts/templates as behind-the-scenes infrastructure; all copy and UI should describe the assistance as user-ready guidance, not reveal internal tooling.
- Favor concise, supportive explanations that highlight how the guidance helps with the user’s request instead of referencing implementation details.

## Testing Guidelines
- No formal suite yet; when adding tests, use Vitest or Jest with React Testing Library and name files `*.test.ts(x)` or place them in `__tests__/`.
- Keep tests deterministic and focused on Convex mutations/queries and UI rendering basics; document any gaps in the PR description.

## Commit & Pull Request Guidelines
- Write imperative commit subjects with optional scope (e.g., `feat(components): add CategoryGrid filters`).
- PRs should describe rationale, link related issues, and include screenshots or GIFs for UI changes.
- Confirm `pnpm lint` and `pnpm build` pass locally before requesting review; note any skipped checks.

## Security & Configuration Tips
- Store secrets in `.env.local`, setting `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, and `OPENAI_KEY`; never commit secret values.
- After Convex schema changes, run `pnpm dev` once to regenerate `_generated/` and verify the dashboard reflects updates.
