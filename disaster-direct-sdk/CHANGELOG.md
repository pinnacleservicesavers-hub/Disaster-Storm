# Changelog
All notable changes to **@disaster-direct/sdk** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.3] - 2025-10-14
### Added
- **New test:** `tests/ddTiles.test.ts` validates `getLegendUrl` for unsigned legend URLs
- Test coverage for legend path generation, query parameters, and baseUrl handling
- Support for different legend formats (png/svg), schemes (traffic/viridis), and backgrounds (solid/transparent)

### Tests
- 4 new tests for `getLegendUrl` function
- Validates default values, custom options, and URL construction

---

## [0.1.2] - 2025-10-14
### Added
- CI-ready tests using **Vitest** with coverage (text + lcov).
- Sample unit test for `errorToUserMessage`.

### Scripts
- `npm test` and `npm run test:ci` added.



## [0.1.1] - 2025-10-13
### Added
- `defaultBaseUrl` auto-detection:
  - Defaults to `http://localhost:3001` for local dev
  - Detects `*.repl.co` origin automatically when hosted on Replit
- Exported `defaultBaseUrl` from `index.ts` for easier use in apps.

### Changed
- `package.json` metadata (homepage, repo, bugs) now points to Replit instead of GitHub.

---

## [0.1.0] - 2025-10-13
### Added
- Initial SDK release with:
  - `apiFetch` wrapper with retries, `Retry-After`, and friendly error messages
  - `getImpact(baseUrl, lat, lng, pollen?)`
  - Map tile helpers (`makeUnsignedTileTemplate`, `makeMapboxTransformRequest`)
  - `getLegendUrl` for signed/unsigned legends
- Fully typed (TypeScript) with ESM + CJS builds
- README and license
