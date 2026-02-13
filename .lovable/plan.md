

## Fix Dependency Tooling Drift: Standardize on npm

### Problem

The project has **both** `bun.lockb` and `package-lock.json` checked into the repo. This causes inconsistent dependency resolution depending on which tool a developer (or CI) happens to use, leading to "works on my machine" bugs.

### Decision: Keep npm, Remove bun

Lovable's build system uses **npm**. The `package-lock.json` is the canonical lockfile. The `bun.lockb` is leftover drift.

### Changes

**1. Delete `bun.lockb`**

Remove the file from the repository.

**2. Update `.gitignore` to block future lockfile drift**

Add the following entries:

```text
# Lockfile drift prevention — npm is the standard
bun.lockb
yarn.lock
pnpm-lock.yaml
```

This prevents anyone from accidentally committing an alternative lockfile in the future.

### Files Changed

- `bun.lockb` -- deleted
- `.gitignore` -- add `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`

