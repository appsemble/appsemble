# Agent Instructions — Appsemble

A where-to-look map, not a manual. Team-wide defaults (git, local-context commit policy, doc style,
tone) live in the global instructions — not repeated here. Follow the user's lead, keep changes
scoped, and read the source when steered.

Appsemble is a low-code platform: a Koa backend, a React studio + app runtime, a CLI, and reusable
**Preact** UI "blocks" (only blocks use Preact; studio/app are React). npm-workspaces monorepo,
all-ESM, Node >= 24. The current block/package version lives in `packages/cli/package.json`
(`0.36.x-test.x`) and matters for block hot-reload.

## What's where

- `blocks/*` — UI blocks (`@appsemble/<name>`); a block's parameter schema is
  `blocks/*/src/block.ts`.
- `packages/server` — backend: Sequelize models, `migrations/`, ops `commands/`.
- `packages/utils/api` — where HTTP **endpoints/paths are declared** (lives under `utils`, but this
  is the door for adding an endpoint).
- `packages/studio` — studio frontend + docs (`pages/docs/`); `packages/app` — published-app
  runtime; `packages/cli` — the `appsemble` CLI.
- `lang-sdk` / `sdk` / `types` / `utils` / `node-utils`, `preact-components` / `react-components`,
  `eslint-config` / `eslint-plugin` / `tsconfig` — shared libs, UI, tooling. `e2e` /
  `block-interaction-tests` — tests.
- `apps/*` — example/template apps. `config/` — assets + `config/retext/personal.dic` (spell dict).
  `trainings/` — studio training content.

## Run it

- `docker compose up -d` — backing services (Postgres :5432, test DB :54321, Valkey :6379, MinIO
  :9000), credentials `admin`/`password`.
- `npm start` — dev server at `http://localhost:9999`; `npm run appsemble -- <cmd>` for the CLI
  (login, migrate, publish…).
- First run: register at `/register` (the verification link prints to the server logs), create the
  `appsemble` org, then publish.
- Apps serve at `{app}.{org}.localhost:9999` — map `*.localhost` → `127.0.0.1` (dnsmasq/hosts). For
  tunnel testing, set the app's `domain`.

## Blocks & apps

- The dev server hot-reloads **local** block edits only when the app pins the **current** monorepo
  block version; otherwise it serves the cached/upstream block.
- CLI publish needs auth: `npm run appsemble -- login`, or `APPSEMBLE_CLIENT_CREDENTIALS=id:secret`
  (create at `/settings/client-credentials`). Token endpoint is `/auth/oauth2/token`.
- Per-org public-app cap: `OrganizationSubscription` / `packages/types/subscriptionPlans.ts` (free =
  3).
- `app publish --dry-run` validates an app against the block schemas without creating it — run it
  before a real publish.
- Studio/API routes 404/405 unless the request `Host` matches `--host`; the CLI derives `Host` from
  `--remote`/the `.appsemblerc` context.

## Testing

- `npm test` is vitest (watch in a terminal). One file: `npm test -- run <path>`. Single spec
  non-watch: `npx vitest run <file> --no-file-parallelism` (bare single runs hit a thread-pool
  conflict). `-u` updates snapshots.
- Changing a block's param schema changes the block manifest → refresh
  `packages/cli/lib/__snapshots__/config.test.*.snap` with `-u`.
- e2e is Playwright in `packages/e2e` — see its README.

## Lint & pre-commit

- Husky pre-commit = gitleaks + lint-staged (eslint + cspell, prettier + remark, stylelint,
  `tsc --noEmit`).
- Two gotchas: eslint needs the custom plugin built once —
  `npm run prepack -w @appsemble/eslint-plugin`; and `tsc --incremental` throws phantom errors from
  a stale `.tsbuildinfo` — `find . -name '*.tsbuildinfo' -not -path '*/node_modules/*' -delete`.
- New i18n messages: get IDs via `npx eslint --fix <messages.ts>`, then
  `npm run scripts -- extract-messages`. New words → `config/retext/personal.dic`.

**Non-obvious rules** (all `error` — easy to trip on):

- `import-x/extensions: ignorePackages` — local imports need the explicit `.js`.
- `@typescript-eslint/consistent-type-imports: inline` — `import { type X }`, not
  `import type { X }`.
- `react/jsx-sort-props` — JSX props alphabetical (case-insensitive).
- `@typescript-eslint/naming-convention` — strict camel/Pascal; a non-conforming key (e.g.
  `time_24hr`) needs an inline `eslint-disable`.
- `react/function-component-definition` — named = `function`, anonymous = arrow;
  `react/jsx-fragments` — `<>` not `<Fragment>`; no useless fragments.
- `@typescript-eslint/explicit-function-return-type` (expressions exempt);
  `react-hooks/exhaustive-deps` is `error`, not warn.
- `curly: all`, `arrow-body-style: as-needed`, `object-shorthand`, `prefer-const`, `no-console`, and
  no-arg `.toString()` is banned.
- `no-param-reassign` — except Koa `ctx` may be mutated; `capitalized-comments`.
- Prettier `singleQuote`, `trailingComma: all`, `proseWrap: always` (wrap markdown at 80). Remark:
  heading levels can't skip; no undefined/unused refs.

## Changelog

Per block/package `changed/{added,changed,fixed,deprecated,removed,security}/` — add a one-line
imperative `.md` for any notable change (parsed into the changelog on release). Format: one
imperative line, no trailing period (e.g. `Add boolean field support`); prettier wraps it. See the
lint-rule list above for the rest.

## Migrations (high-risk — read CONTRIBUTING §Migrations first)

Source of truth: `packages/server/migrations`. up + down both tested, no conditionals, unique =
indexes (not constraints), queries take `{ transaction }`. Validate:
`npm run appsemble -- check-migrations` / `check-down-migrations` / `fuzz-migrations`.

## Commits, branches, CI

- Conventional Commits; scope = the package/app/block: `feat(apps/notes): …`, `fix(blocks/form): …`,
  `test(server): …`.
- Branches: `${issueNo}-${kebab}`, or `${type}-${kebab}` with no issue, or
  `${otherRepo}-${issueNo}/${kebab}` for a cross-repo issue.
- CI is on `gitlab.com/appsemble/appsemble` (`glab` if available). MR pipelines are
  **merged-results** (your branch merged into the target, assumed `main`), so a failure can come
  from `main`, not just your diff. Jobs are sharded (tests, e2e) alongside
  build/validate/docker/downstream/review-deploy — don't run the full suite locally. Offer to wait
  on results, or let the user report them.
