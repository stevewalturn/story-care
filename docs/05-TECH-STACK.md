# Tech Stack Reference

> **Source of truth**: `package.json`
> This document catalogs every dependency, script, and configuration file in the StoryCare platform.

---

## Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | ^16.1.6 |
| Language | TypeScript (strict mode) | ^5.9.3 |
| UI Library | React (with React Compiler) | ^19.2.0 |
| Styling | Tailwind CSS 4 | ^4.1.16 |
| Database ORM | DrizzleORM | ^0.44.7 |
| Database | PostgreSQL (Neon prod, PGlite dev) | pg ^8.16.3 |
| Auth | Firebase / Google Identity Platform | ^11.2.0 |
| Testing | Vitest + Playwright | ^4.0.4 / ^1.56.1 |
| Hosting | Vercel (Enterprise) | -- |
| Container Jobs | Google Cloud Run | @google-cloud/run ^3.0.1 |

---

## Dependencies

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^16.1.6 | React framework with App Router, SSR, API routes |
| `react` | ^19.2.0 | UI library with React 19 features (Compiler, Actions) |
| `react-dom` | ^19.2.0 | React DOM renderer |
| `typescript` | ^5.9.3 | Type-safe JavaScript (strict mode enabled) |
| `lightningcss` | ^1.30.2 | CSS minification and transformation engine |

### Database

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.44.7 | Type-safe PostgreSQL ORM with query builder |
| `pg` | ^8.16.3 | PostgreSQL client driver for Node.js |
| `drizzle-kit` | ^0.31.6 | Migration generation, push, and studio tooling (dev) |
| `@electric-sql/pglite-socket` | ^0.0.16 | PGlite socket adapter for local dev database (dev) |

### Authentication

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | ^11.2.0 | Client-side Firebase SDK for Google Identity Platform |
| `firebase-admin` | ^13.0.1 | Server-side Firebase Admin SDK for token verification |
| `google-auth-library` | ^9.15.1 | Google API authentication for Cloud services |

### AI Services

| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | ^6.7.0 | OpenAI API client (GPT-4, GPT-3.5 for text generation) |
| `@deepgram/sdk` | ^4.11.2 | Deepgram speech-to-text transcription with diarization |
| `langfuse` | ^3.38.6 | AI observability, tracing, and cost tracking |

### Google Cloud

| Package | Version | Purpose |
|---------|---------|---------|
| `@google-cloud/storage` | ^7.17.3 | Google Cloud Storage for media files and uploads |
| `@google-cloud/run` | ^3.0.1 | Google Cloud Run job management for video processing |

### UI Components

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^0.548.0 | Icon library (20x20px navigation icons) |
| `@tiptap/react` | ^3.15.1 | Rich text editor (WYSIWYG) for content blocks |
| `@tiptap/starter-kit` | ^3.15.1 | Tiptap base extensions (bold, italic, lists, etc.) |
| `@tiptap/extension-highlight` | ^3.15.1 | Text highlighting extension for Tiptap |
| `@tiptap/extension-placeholder` | ^3.15.1 | Placeholder text extension for Tiptap |
| `@tiptap/extension-text-align` | ^3.15.1 | Text alignment extension for Tiptap |
| `@tiptap/extension-underline` | ^3.15.1 | Underline extension for Tiptap |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop toolkit (scene clips, page blocks) |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable preset for drag-and-drop lists |
| `@dnd-kit/utilities` | ^3.2.2 | Utility functions for dnd-kit |
| `@wavesurfer/react` | ^1.0.12 | Audio waveform visualization (session audio, music) |
| `react-day-picker` | ^9.13.0 | Date picker component |
| `qrcode.react` | ^4.2.0 | QR code generation (shareable recording links) |
| `react-hot-toast` | ^2.6.0 | Toast notification system |
| `sonner` | ^2.0.7 | Toast notification system (alternative) |
| `react-syntax-highlighter` | ^16.1.0 | Code syntax highlighting for AI JSON responses |

### Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.65.0 | Performant form state management |
| `@hookform/resolvers` | ^5.2.2 | Validation resolver bridge (Zod integration) |
| `zod` | ^4.1.12 | Schema validation for forms, API inputs, env vars |
| `@t3-oss/env-nextjs` | ^0.13.8 | Type-safe environment variable validation (T3 Env) |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | ^4.1.0 | Date manipulation and formatting library |
| `jsonrepair` | ^3.13.1 | Repair malformed JSON from AI responses |
| `jspdf` | ^4.0.0 | PDF generation (assessment reports, exports) |
| `marked` | ^17.0.1 | Markdown to HTML parser |
| `react-markdown` | ^10.1.0 | React component for rendering Markdown |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown plugin for react-markdown |

### Analytics & Support

| Package | Version | Purpose |
|---------|---------|---------|
| `posthog-js` | ^1.281.0 | Product analytics and event tracking |
| `react-use-intercom` | ^5.5.0 | Intercom integration for customer support |

### Tailwind CSS & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.1.16 | Utility-first CSS framework (v4) |
| `@tailwindcss/postcss` | ^4.1.16 | PostCSS plugin for Tailwind CSS 4 (dev) |
| `@tailwindcss/typography` | ^0.5.0-alpha.3 | Typography plugin for prose content |
| `postcss` | ^8.5.6 | CSS transformation pipeline (dev) |
| `postcss-load-config` | ^6.0.1 | PostCSS config loading (dev) |

---

## Dev Dependencies

### Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.0.4 | Unit test runner (Vite-native) |
| `@vitest/browser` | ^4.0.4 | Vitest browser mode for component tests |
| `@vitest/browser-playwright` | ^4.0.4 | Playwright provider for Vitest browser mode |
| `@vitest/coverage-v8` | ^4.0.4 | Code coverage via V8 engine |
| `vitest-browser-react` | ^2.0.2 | React rendering utilities for Vitest browser mode |
| `@playwright/test` | ^1.56.1 | E2E and integration testing framework |
| `@chromatic-com/playwright` | ^0.12.7 | Visual regression testing with Chromatic |
| `@faker-js/faker` | ^10.1.0 | Fake data generation for tests and seeds |

### Storybook

| Package | Version | Purpose |
|---------|---------|---------|
| `storybook` | ^10.0.0 | Component development environment |
| `@storybook/nextjs-vite` | ^10.0.0 | Next.js framework integration (Vite builder) |
| `@storybook/addon-a11y` | ^10.0.0 | Accessibility auditing addon |
| `@storybook/addon-docs` | ^10.0.0 | Documentation pages addon |
| `@storybook/addon-vitest` | ^10.0.0 | Vitest integration addon |

### Linting & Formatting

| Package | Version | Purpose |
|---------|---------|---------|
| `eslint` | ^9.38.0 | Code linting engine (flat config) |
| `@antfu/eslint-config` | ^6.1.0 | Opinionated ESLint config by Anthony Fu |
| `@eslint-react/eslint-plugin` | ^2.2.4 | React-specific ESLint rules |
| `@next/eslint-plugin-next` | ^16.1.6 | Next.js-specific ESLint rules |
| `eslint-plugin-format` | ^1.0.2 | Code formatting via ESLint (Prettier alternative) |
| `eslint-plugin-jsx-a11y` | ^6.10.2 | Accessibility linting for JSX |
| `eslint-plugin-playwright` | ^2.2.2 | Playwright-specific linting rules |
| `eslint-plugin-react-hooks` | ^7.0.1 | React Hooks rules enforcement |
| `eslint-plugin-react-refresh` | ^0.4.24 | React Refresh boundary validation |
| `eslint-plugin-storybook` | ^10.0.0 | Storybook-specific linting rules |
| `eslint-plugin-tailwindcss` | ^4.0.0-beta.0 | Tailwind CSS class ordering and validation |

### Build Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `@next/bundle-analyzer` | ^16.1.6 | Webpack bundle analysis (via `ANALYZE=true`) |
| `@vitejs/plugin-react` | ^5.1.0 | React plugin for Vite (Storybook) |
| `babel-plugin-react-compiler` | ^1.0.0 | React Compiler babel plugin for auto-memoization |
| `vite-tsconfig-paths` | ^5.1.4 | TypeScript path resolution for Vite |
| `cross-env` | ^10.1.0 | Cross-platform environment variable setting |
| `dotenv-cli` | ^10.0.0 | CLI for loading .env files |
| `npm-run-all` | ^4.1.5 | Run multiple npm scripts in parallel or series |
| `rimraf` | ^6.0.1 | Cross-platform rm -rf |
| `knip` | ^5.66.4 | Unused dependency and export detection |

### TypeScript Types

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | ^24.9.1 | Node.js type definitions |
| `@types/react` | ^19.2.2 | React type definitions |
| `@types/react-dom` | ^19.2.3 | React DOM type definitions |
| `@types/pg` | ^8.15.6 | PostgreSQL client type definitions |
| `@types/marked` | ^5.0.2 | Marked library type definitions |
| `@types/react-syntax-highlighter` | ^15.5.13 | Syntax highlighter type definitions |

---

## NPM Scripts

### Development

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start Next.js development server on port 3000 |
| `build` | `run-s db:migrate build:next` | Production build: run migrations then build Next.js |
| `build:next` | `next build --webpack` | Build Next.js with Webpack bundler |
| `build-local` | `run-p db-server:memory build:next --race` | Build with in-memory PGlite (CI/testing) |
| `start` | `next start` | Start production server from `.next` output |
| `build-stats` | `cross-env ANALYZE=true npm run build` | Production build with bundle analyzer |
| `clean` | `rimraf .next out coverage` | Remove build artifacts and coverage reports |

### Database

| Script | Command | Description |
|--------|---------|-------------|
| `db:generate` | `drizzle-kit generate` | Generate SQL migrations from Schema.ts changes |
| `db:migrate` | `drizzle-kit migrate` | Apply pending migrations to the database |
| `db:push` | `drizzle-kit push` | Push schema directly without migration files (dev only) |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio GUI in the browser |
| `db-server:file` | `pglite-server --db=local.db --run 'npm run db:migrate'` | Start PGlite with file-based persistence |
| `db-server:memory` | `pglite-server --run 'npm run db:migrate'` | Start PGlite with in-memory database |

### Database Seeding

| Script | Command | Description |
|--------|---------|-------------|
| `db:seed-superadmin` | `node --env-file=.env.local scripts/seed-superadmin.mjs` | Create initial super admin user |
| `db:create-superadmin` | `node --env-file=.env.local scripts/create-superadmin.mjs` | Alternative super admin creation script |
| `db:seed-modules` | `...esbuild-register scripts/seed-treatment-modules.ts` | Seed treatment modules |
| `db:seed-templates` | `...esbuild-register scripts/seed-templates.ts` | Seed survey/reflection templates |
| `db:seed-prompts` | `...esbuild-register scripts/seed-system-prompts.ts` | Seed AI system prompts |
| `db:seed-therapist-prompts` | `...esbuild-register scripts/seed-therapist-prompts.ts` | Seed therapist-specific prompts |
| `db:delete-therapist-prompts` | `...esbuild-register scripts/delete-therapist-prompts.ts` | Remove therapist prompts |
| `db:seed-ai-models` | `...esbuild-register scripts/seed-ai-models.ts` | Seed AI model registry with pricing |
| `db:seed-assessments` | `...esbuild-register scripts/seed-assessment-instruments.ts` | Seed clinical assessment instruments |
| `db:seed-feature-toggles` | `...esbuild-register scripts/seed-feature-toggles.ts` | Seed feature toggle flags |
| `db:seed-sage-health` | `...esbuild-register scripts/seed-sage-health.ts` | Seed Sage Health organization data |

### Testing

| Script | Command | Description |
|--------|---------|-------------|
| `test` | `vitest run` | Run all unit tests (Vitest) |
| `test:e2e` | `playwright test` | Run E2E tests (Playwright) |
| `storybook` | `storybook dev -p 6006` | Start Storybook dev server on port 6006 |
| `storybook:test` | `vitest run --config .storybook/vitest.config.mts` | Run Storybook component tests |
| `build-storybook` | `storybook build` | Build static Storybook site |

### Code Quality

| Script | Command | Description |
|--------|---------|-------------|
| `lint` | `eslint .` | Check all files for linting issues |
| `lint:fix` | `eslint . --fix` | Auto-fix linting issues |
| `check:types` | `tsc --noEmit --pretty` | Run TypeScript type checking |
| `check:deps` | `knip` | Detect unused dependencies and exports |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration (plugins, webpack, env) |
| `tsconfig.json` | TypeScript compiler options (strict mode, paths) |
| `eslint.config.mjs` | ESLint flat config (Antfu base config) |
| `postcss.config.mjs` | PostCSS configuration (Tailwind CSS plugin) |
| `drizzle.config.ts` | Drizzle Kit configuration (DB connection, migrations) |
| `vitest.config.mts` | Vitest configuration (test projects, browser mode) |
| `playwright.config.ts` | Playwright configuration (browsers, timeouts, base URL) |
| `.storybook/vitest.config.mts` | Storybook-specific Vitest configuration |
| `commitlint.config.js` | Conventional commit message linting |
| `knip.config.ts` | Knip unused dependency detection config |
| `package.json` | Project metadata, dependencies, scripts |

---

## Runtime Requirements

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Node.js | >= 20 | Specified in `engines` field |
| npm | (any modern) | Used as package manager |
| PostgreSQL | 15+ | Neon (production), PGlite (development) |
