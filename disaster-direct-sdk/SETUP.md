# Disaster Direct SDK v0.1.2 - Setup Guide

## 📦 What's Included

This is the **complete, production-ready SDK package** for Disaster Direct, now with:

✅ **Vitest Testing** - Unit tests with coverage reporting  
✅ **GitHub Actions CI/CD** - Automated testing and npm publishing  
✅ **TypeScript** - Fully typed with ESM + CJS builds  
✅ **Auto-detect baseUrl** - Works on localhost and Replit automatically  

## 📁 Directory Structure

```
disaster-direct-sdk/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI workflow (tests, typecheck, build)
│       └── release.yml     # npm publish + GitHub release
├── src/
│   ├── config.ts          # Auto-detect baseUrl
│   ├── ddClient.ts        # API client with retries & error handling
│   ├── ddTiles.ts         # Map tile helpers
│   └── index.ts           # Main exports
├── tests/
│   └── ddClient.test.ts   # Unit tests for error handling
├── CHANGELOG.md           # Version history
├── package.json           # v0.1.2 with test scripts
├── vitest.config.ts       # Vitest configuration
├── tsconfig.json          # TypeScript config
├── tsup.config.ts         # Build config
└── README.md              # Package documentation
```

## 🚀 Local Development

### Install Dependencies

```bash
cd disaster-direct-sdk
npm install
```

### Run Tests

```bash
# Watch mode (development)
npm test

# CI mode with coverage
npm run test:ci
```

### Type Check

```bash
npm run typecheck
```

### Build Package

```bash
npm run build
```

This creates:
- `dist/index.mjs` - ESM build
- `dist/index.cjs` - CommonJS build  
- `dist/index.d.ts` - TypeScript definitions

## 🔄 CI/CD Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Every push to `main`/`develop` and all PRs

**Steps:**
1. ✅ Checkout code
2. ✅ Install dependencies (`npm ci`)
3. ✅ Run typecheck (`npm run typecheck`)
4. ✅ Build package (`npm run build`)
5. ✅ Run tests with coverage (`npm run test:ci`)
6. ✅ Upload coverage to Codecov (optional)

### Release Workflow (`.github/workflows/release.yml`)

**Triggers:** Push a version tag like `v0.1.2`

**Steps:**
1. ✅ Build and typecheck
2. ✅ Publish to npm (public) with provenance
3. ✅ Create GitHub Release with CHANGELOG

## 📤 Publishing to npm

### One-Time Setup

1. **Create npm account** at [npmjs.com](https://www.npmjs.com)

2. **Generate Access Token:**
   - Go to npmjs.com → Account → Access Tokens
   - Create "Automation" token (recommended)
   - Copy the token

3. **Add to GitHub Secrets:**
   - GitHub repo → Settings → Secrets → Actions
   - New repository secret
   - Name: `NPM_TOKEN`
   - Value: `<your-npm-token>`

4. **Push SDK to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "SDK v0.1.2 with Vitest tests"
   git remote add origin https://github.com/yourorg/disaster-direct-sdk.git
   git push -u origin main
   ```

### Cut a Release

When you're ready to publish a new version:

```bash
# Update CHANGELOG.md with new changes

# Bump version (patch/minor/major)
npm version patch   # 0.1.2 → 0.1.3
# or
npm version minor   # 0.1.2 → 0.2.0
# or  
npm version major   # 0.1.2 → 1.0.0

# Push with tags (triggers release workflow)
git push --follow-tags
```

The GitHub Action will automatically:
- ✅ Run all tests
- ✅ Build the package
- ✅ Publish to npm as `@disaster-direct/sdk`
- ✅ Create GitHub Release with changelog

## 📋 Test Coverage

Current tests in `tests/ddClient.test.ts`:

- ✅ `errorToUserMessage` maps 401 to "Sign in" message
- ✅ `errorToUserMessage` maps 403 to permission error
- ✅ `errorToUserMessage` maps 429 to rate limit error
- ✅ `errorToUserMessage` maps 500 to service unavailable

### Adding More Tests

```typescript
// tests/ddClient.test.ts
import { describe, it, expect } from "vitest";
import { apiFetch } from "../src/ddClient";

describe("apiFetch", () => {
  it("retries on 5xx errors", async () => {
    // Add your test
  });
});
```

Run tests:
```bash
npm test
```

## 🔗 Using the SDK in Apps

After publishing to npm, install in any project:

```bash
npm install @disaster-direct/sdk
```

Usage:
```typescript
import { apiFetch, getImpact, makeUnsignedTileTemplate } from '@disaster-direct/sdk';

// API calls with automatic retries
const data = await apiFetch('/api/claims');

// Get impact score
const impact = await getImpact(baseUrl, 33.7490, -84.3880);

// Map tiles
const tileUrl = makeUnsignedTileTemplate('/api/tiles/impact/{z}/{x}/{y}');
```

## 📝 Version History

### v0.1.2 (Current)
- ✅ Vitest testing with coverage
- ✅ CI/CD workflows (GitHub Actions)
- ✅ Sample unit tests

### v0.1.1
- ✅ Auto-detect baseUrl (localhost/Replit)
- ✅ Package metadata updates

### v0.1.0
- ✅ Initial SDK release
- ✅ API client, impact helpers, tile utilities
- ✅ TypeScript with ESM + CJS builds

## 🎯 Next Steps

1. **Run tests locally:** `npm test`
2. **Push to GitHub** with workflows
3. **Set up npm token** in GitHub secrets
4. **Cut first release:** `npm version patch && git push --follow-tags`
5. **Monitor CI/CD** in GitHub Actions tab

## 📞 Support

SDK is ready for production use. All endpoints integrate with the main Disaster Direct application.
