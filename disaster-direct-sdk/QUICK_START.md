# 🚀 Quick Start - Disaster Direct SDK v0.1.2

## Test Locally (RIGHT NOW)

```bash
cd disaster-direct-sdk
npm install
npm test
```

Expected output:
```
✓ tests/ddClient.test.ts (4 tests)
   ✓ errorToUserMessage (4 tests)
     ✓ maps 401 to sign-in message
     ✓ maps 403 to permission message  
     ✓ maps 429 to rate-limit message
     ✓ maps 500 to service unavailable

Test Files  1 passed (1)
Tests  4 passed (4)
```

## Run with Coverage

```bash
npm run test:ci
```

Creates coverage report in `./coverage/`

## Build the Package

```bash
npm run build
```

Creates `dist/` with ESM, CJS, and TypeScript definitions.

## Publish to npm (When Ready)

### 1. Setup (one time)
- Get npm token from [npmjs.com](https://www.npmjs.com/settings/yourname/tokens)
- Add to GitHub secrets as `NPM_TOKEN`

### 2. Release
```bash
npm version patch
git push --follow-tags
```

GitHub Actions automatically:
- ✅ Runs tests
- ✅ Builds package  
- ✅ Publishes to npm
- ✅ Creates GitHub release

---

**Files Included:**
- ✅ Vitest config (`vitest.config.ts`)
- ✅ Unit tests (`tests/ddClient.test.ts`) 
- ✅ CI workflow (`.github/workflows/ci.yml`)
- ✅ Release workflow (`.github/workflows/release.yml`)
- ✅ Updated `package.json` v0.1.2
- ✅ Updated `CHANGELOG.md`
- ✅ Complete source code (`src/`)

**Ready for production!** 🎉
