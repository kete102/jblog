# Contributing

## Branches

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | https://destellos-de-fe.fly.dev |
| `staging` | Pre-production verification | https://destellos-de-fe-staging.fly.dev |
| `feat/*`, `fix/*`, `chore/*`, … | Feature / fix work | — |

**Workflow:**

1. Branch off `staging` for new work (`git checkout -b feat/my-feature staging`)
2. When ready, merge into `staging` and push — GitHub Actions deploys to staging automatically
3. Verify on https://destellos-de-fe-staging.fly.dev
4. Merge `staging` into `main` and push — no deploy yet, staging and prod are now in sync

## Commit conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org).

| Prefix | When to use | Semver impact |
|---|---|---|
| `feat:` | New user-facing feature | Minor bump |
| `fix:` | Bug fix | Patch bump |
| `refactor:` | Code restructuring, no behaviour change | — |
| `perf:` | Performance improvement | — |
| `chore:` | Tooling, deps, config — not user-facing | — |
| `docs:` | Documentation only | — |
| `style:` | Formatting, no logic change | — |

Rules:
- Lowercase prefix and message
- Imperative mood: "add search" not "added search" or "adds search"
- No period at the end
- Keep the subject line under 72 characters
- Breaking changes: add `BREAKING CHANGE: <description>` in the commit footer — triggers a Major bump

**Examples:**

```
feat: add full-text search on post titles and excerpts
fix: resolve redirect loop for rejected users
refactor: extract post query logic into services/posts
chore: release v1.4.0
docs: update README with staging environment
```

## Release process

Releases are tag-based. Pushing a `v*` tag triggers the production deploy automatically via GitHub Actions. Run these steps from `main` after merging staging:

1. Move `[Unreleased]` to a versioned entry in `CHANGELOG.md` with today's date
2. Bump `"version"` in `package.json`
3. Commit: `chore: release vX.Y.Z`
4. Tag and push: `git push && git push origin vX.Y.Z` — production deploys automatically

**Semver rules:**

| Commits since last release | Version bump | Example |
|---|---|---|
| Only `fix:` | Patch | `1.3.0` → `1.3.1` |
| At least one `feat:` | Minor | `1.3.0` → `1.4.0` |
| Any `BREAKING CHANGE` | Major | `1.3.0` → `2.0.0` |
