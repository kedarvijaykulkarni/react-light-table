# Step-by-Step Guide: Publishing `react-light-table` to npmjs.com

> **Repository:** https://github.com/kedarvijaykulkarni/react-light-table
> **Target:** Publish as a public npm package so developers can run `npm install react-light-table`
> **Date:** April 2026

---

## Prerequisites

Before you begin, make sure you have the following installed and ready:

```bash
# Check Node.js (v18+ recommended)
node --version

# Check npm (v9+ recommended)
npm --version

# Check Git
git --version
```

If Node.js is not installed, download it from https://nodejs.org (LTS version recommended).

---

## STEP 1 — Create an npm Account

1. Go to **https://www.npmjs.com/signup**
2. Fill in your **username**, **email**, and **password**
3. Click **Create an Account**
4. **Verify your email** — check your inbox and click the confirmation link

### Enable 2FA (Required for Publishing)

npm now requires Two-Factor Authentication for publishing packages. As of late 2025, npm no longer supports new TOTP (authenticator app) configurations for 2FA — you must use a **security key** (WebAuthn) instead.

1. Log in at https://www.npmjs.com
2. Click your **profile picture** (top-right) → **Account**
3. Under **Two-Factor Authentication**, click **Enable 2FA**
4. Select **Security Key** (supports biometrics like Touch ID, Face ID, Windows Hello, or a physical key like YubiKey)
5. Follow browser prompts to register your security key
6. **Save your recovery codes** somewhere safe (password manager recommended) — these are your only backup if you lose access

---

## STEP 2 — Check Package Name Availability

The name `react-light-table` may already be taken or too similar to existing packages. Check before proceeding:

```bash
npm search react-light-table
```

Or visit: https://www.npmjs.com/package/react-light-table

**If the name is taken**, you have two options:

- **Option A:** Choose a different name (e.g., `react-light-datatable`, `rlt-table`)
- **Option B:** Use a scoped package name: `@kedarvijaykulkarni/react-light-table`
  - Scoped packages use your npm username as a namespace
  - They're always unique since they're tied to your account
  - Install command becomes: `npm install @kedarvijaykulkarni/react-light-table`

---

## STEP 3 — Clone and Prepare Your Repository

```bash
# Clone your repo
git clone https://github.com/kedarvijaykulkarni/react-light-table.git

# Navigate into the project
cd react-light-table

# Install dependencies
npm install
```

---

## STEP 4 — Restructure package.json for npm Publishing

Your current `package.json` has several issues that need fixing before publishing. Open it and make these changes:

```bash
# Open in your editor
code package.json    # or: vim package.json / nano package.json
```

Replace the contents with this corrected version (adjust name if needed):

```json
{
  "name": "react-light-table",
  "version": "1.0.0",
  "description": "A lightweight, sortable, searchable, and selectable React table component for any dataset",
  "author": "Kedar Vijay Kulkarni",
  "license": "MIT",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "sideEffects": [
    "**/*.css"
  ],
  "private": false,
  "keywords": [
    "react",
    "table",
    "react-table",
    "data-table",
    "sortable",
    "searchable",
    "selectable",
    "lightweight",
    "react-component",
    "dynamic-table",
    "datatable",
    "UI"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/kedarvijaykulkarni/react-light-table.git"
  },
  "bugs": {
    "url": "https://github.com/kedarvijaykulkarni/react-light-table/issues"
  },
  "homepage": "https://github.com/kedarvijaykulkarni/react-light-table#readme",
  "contributors": [
    {
      "name": "Kedar Vijay Kulkarni",
      "url": "https://github.com/kedarvijaykulkarni"
    }
  ],
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "@babel/cli": "^7.26.0",
    "@babel/core": "^7.26.0",
    "@babel/preset-env": "^7.26.0",
    "@babel/preset-react": "^7.26.0",
    "rollup": "^4.28.0",
    "@rollup/plugin-babel": "^6.0.4",
    "@rollup/plugin-commonjs": "^28.0.0",
    "@rollup/plugin-node-resolve": "^16.0.0",
    "@rollup/plugin-terser": "^0.4.4",
    "rollup-plugin-postcss": "^4.0.2",
    "rollup-plugin-peer-deps-external": "^2.2.4"
  },
  "scripts": {
    "build": "rollup -c",
    "prepublishOnly": "npm run build"
  }
}
```

### Key Changes Explained

| What Changed | Why |
|---|---|
| `"private": false` | Was `true` — npm refuses to publish private packages |
| `react` / `react-dom` moved to `peerDependencies` | Prevents duplicate React bundles in consumer apps |
| Removed `@babel/polyfill` | Deprecated since Babel 7.4 |
| Removed `react-scripts` | CRA dependency — not needed for a library |
| Removed testing libs from `dependencies` | These are dev-only tools |
| Added `"files": ["dist"]` | Only ships the built output, not your source code |
| Added `"types"` field | Points to TypeScript declarations (for future TS support) |
| Added `"module"` field | ESM entry point for bundlers that support tree-shaking |
| Added `"prepublishOnly"` script | Automatically runs build before every `npm publish` |

---

## STEP 5 — Set Up Rollup Build System

Your current build uses bare Babel which doesn't produce a proper library bundle. Set up Rollup instead.

### 5a. Install Rollup and Plugins

```bash
npm install --save-dev \
  rollup \
  @rollup/plugin-babel \
  @rollup/plugin-commonjs \
  @rollup/plugin-node-resolve \
  @rollup/plugin-terser \
  rollup-plugin-postcss \
  rollup-plugin-peer-deps-external \
  @babel/preset-react
```

### 5b. Create `rollup.config.mjs`

Create this file in your project root:

```bash
touch rollup.config.mjs
```

Add this content:

```javascript
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
  input: 'src/lib/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.js', '.jsx'],
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-react'],
    }),
    postcss({
      extract: true,
      minimize: true,
    }),
    terser(),
  ],
};
```

### 5c. Create `.babelrc` (if not already present)

```bash
touch .babelrc
```

Content:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

### 5d. Test the Build

```bash
npm run build
```

**Expected output:** A `dist/` folder is created containing:

```
dist/
├── index.js          # CommonJS bundle
├── index.js.map      # Source map
├── index.esm.js      # ES Module bundle
├── index.esm.js.map  # Source map
└── index.css         # Extracted CSS
```

If you see errors, read them carefully — common fixes include missing Babel presets or incorrect file paths.

---

## STEP 6 — Add Essential Files

### 6a. Create/Update README.md

```bash
touch README.md
```

Add a clear README with installation instructions, usage example, props API, etc. At minimum:

```markdown
# react-light-table

A lightweight, sortable, searchable, and selectable React table component.

## Installation

npm install react-light-table

## Usage

import { Table } from 'react-light-table';
import 'react-light-table/dist/index.css';

function App() {
  return (
    <Table
      columns={[
        { key: 'name', path: 'name', label: 'Name', sortable: true },
        { key: 'email', path: 'email', label: 'Email' },
      ]}
      url="https://jsonplaceholder.typicode.com/users"
      isSearchable={true}
      isSelectable={true}
    />
  );
}

## License

MIT
```

### 6b. Create LICENSE File

```bash
touch LICENSE
```

Add the MIT license text (replace year and name):

```
MIT License

Copyright (c) 2026 Kedar Vijay Kulkarni

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 6c. Create `.npmignore`

This tells npm which files NOT to include in the published package. Since we already use the `"files"` field in `package.json`, this is a safety net:

```bash
touch .npmignore
```

Content:

```
# Source files (only dist is shipped)
src/
demo/
public/
node_modules/

# Config files
.babelrc
rollup.config.mjs
.eslintrc*
.prettierrc*
tsconfig.json
.gitignore
.github/

# Test files
*.test.js
*.test.tsx
*.spec.js
__tests__/
coverage/

# Dev files
*.log
.DS_Store
.env*
```

---

## STEP 7 — Verify What Will Be Published

Before actually publishing, inspect exactly what npm will include in your package:

### 7a. Dry Run — See the File List

```bash
npm pack --dry-run
```

This prints the list of files that would go into the tarball without actually creating it. Verify:

- ✅ `dist/index.js` is included
- ✅ `dist/index.esm.js` is included
- ✅ `dist/index.css` is included
- ✅ `README.md` is included
- ✅ `LICENSE` is included
- ✅ `package.json` is included
- ❌ `src/` is NOT included
- ❌ `node_modules/` is NOT included
- ❌ Config files are NOT included

### 7b. Create the Actual Tarball

```bash
npm pack
```

This creates a `.tgz` file like `react-light-table-1.0.0.tgz`. You can open it to inspect:

```bash
tar -tzf react-light-table-1.0.0.tgz
```

---

## STEP 8 — Test the Package Locally Before Publishing

This is critical. Test the package as a real consumer would use it.

### 8a. Create a Temporary Test App

```bash
# Go to a different directory (outside your package)
cd /tmp
mkdir test-rlt && cd test-rlt

# Create a quick React app with Vite
npm create vite@latest test-app -- --template react
cd test-app
npm install
```

### 8b. Install Your Local Package

```bash
# Install from the tarball you created in Step 7
npm install /path/to/react-light-table/react-light-table-1.0.0.tgz
```

### 8c. Test It in Code

Edit `src/App.jsx`:

```jsx
import { Table } from 'react-light-table';
import 'react-light-table/dist/index.css';

function App() {
  return (
    <div>
      <h1>Testing react-light-table</h1>
      <Table
        columns={[
          { key: 'name', path: 'name', label: 'Name', sortable: true, className: 'name-col' },
          { key: 'email', path: 'email', label: 'Email', className: 'email-col' },
        ]}
        url="https://jsonplaceholder.typicode.com/users"
        isSearchable={true}
      />
    </div>
  );
}

export default App;
```

Run the test app:

```bash
npm run dev
```

**Verify the table renders correctly in the browser.** If it doesn't work, go back and fix the issues before proceeding.

### 8d. Clean Up

```bash
# Delete the test app when done
cd /tmp && rm -rf test-rlt
```

---

## STEP 9 — Log In to npm from Terminal

```bash
npm login
```

This will open your browser for authentication. Follow the prompts:

1. Your browser opens the npm login page
2. Enter your **username** and **password**
3. Complete **2FA verification** (security key / biometric)
4. The terminal confirms: `Logged in as kedarvijaykulkarni on https://registry.npmjs.org/`

**Verify you're logged in:**

```bash
npm whoami
```

This should print your npm username.

### Troubleshooting: Wrong Registry

If `npm login` or `npm publish` fails, ensure you're pointing to the official npm registry:

```bash
# Check current registry
npm config get registry

# It should be: https://registry.npmjs.org/
# If it's something else, reset it:
npm config set registry https://registry.npmjs.org/
```

---

## STEP 10 — Publish to npm

### 10a. Commit All Changes

```bash
cd /path/to/react-light-table

git add .
git commit -m "feat: prepare v2.0.1 for npm publish"
git tag v2.0.0
git push origin main --tags
```

### 10b. Publish

```bash
npm publish
```

If you're using a **scoped** package name (`@kedarvijaykulkarni/react-light-table`), scoped packages are private by default. To publish as public:

```bash
npm publish --access public
```

**Expected output:**

```
npm notice
npm notice 📦 react-light-table@1.0.0
npm notice === Tarball Contents ===
npm notice 1.2kB  dist/index.css
npm notice 15.4kB dist/index.js
npm notice 14.8kB dist/index.esm.js
npm notice 1.5kB  package.json
npm notice 1.2kB  README.md
npm notice 1.1kB  LICENSE
npm notice === Tarball Details ===
npm notice name:          react-light-table
npm notice version:       1.0.0
npm notice filename:      react-light-table-1.0.0.tgz
npm notice package size:  8.5 kB
npm notice unpacked size: 35.2 kB
npm notice total files:   6
+ react-light-table@1.0.0
```

---

## STEP 11 — Verify the Published Package

### 11a. Check on npmjs.com

Visit: `https://www.npmjs.com/package/react-light-table`

Your package page should now be live with the README rendered.

### 11b. Test Installation from npm Registry

```bash
cd /tmp
mkdir verify-rlt && cd verify-rlt
npm init -y
npm install react-light-table
```

Check that it installed correctly:

```bash
ls node_modules/react-light-table/dist/
```

You should see your built files (`index.js`, `index.esm.js`, `index.css`).

---

## STEP 12 — Publishing Updates (Future Versions)

When you make changes and want to publish a new version:

### 12a. Bump the Version

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm version patch

# For new features (1.0.0 → 1.1.0)
npm version minor

# For breaking changes (1.0.0 → 2.0.0)
npm version major
```

Each `npm version` command automatically:
1. Updates `version` in `package.json`
2. Creates a git commit
3. Creates a git tag (e.g., `v2.0.0`)

### 12b. Push and Publish

```bash
git push origin main --tags
npm publish
```

---

## STEP 13 (Optional) — Automate with GitHub Actions

Create `.github/workflows/publish.yml` in your repo:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish with provenance
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setting Up the NPM Token for GitHub Actions

1. Go to https://www.npmjs.com → **Profile** → **Access Tokens**
2. Click **Generate New Token** → **Granular Access Token**
3. Set:
   - **Token name:** `github-actions-publish`
   - **Expiration:** 90 days (maximum allowed)
   - **Packages and scopes:** Select `react-light-table` (or all packages)
   - **Permissions:** Read and write
4. Click **Generate Token** — copy the token (starts with `npm_`)
5. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
6. Click **New repository secret**
   - **Name:** `NPM_TOKEN`
   - **Value:** Paste the token
7. Click **Add secret**

Now, every time you push a version tag, GitHub Actions will automatically build and publish:

```bash
npm version patch
git push origin main --tags
# GitHub Actions takes over and publishes automatically
```

---

## Quick Reference — Command Cheat Sheet

```bash
# One-time setup
npm login                              # Log in to npm
npm whoami                             # Verify login

# Before first publish
npm run build                          # Build the library
npm pack --dry-run                     # Preview what will be published
npm pack                               # Create tarball for local testing
npm publish                            # Publish to npm (first time)
npm publish --access public            # For scoped packages

# For updates
npm version patch                      # Bump version (patch)
npm version minor                      # Bump version (minor)
npm version major                      # Bump version (major)
git push origin main --tags            # Push version tag
npm publish                            # Publish update

# Troubleshooting
npm config get registry                # Check registry URL
npm config set registry https://registry.npmjs.org/   # Reset registry
npm cache clean --force                # Clear npm cache
npm pack --dry-run                     # Verify files list
npm info react-light-table             # Check published package info

# Unpublish (within 72 hours only — use with caution!)
npm unpublish react-light-table@1.0.0  # Remove specific version
```

---

## Troubleshooting Common Errors

| Error | Cause | Fix |
|---|---|---|
| `npm ERR! 403 Forbidden` | Not logged in or wrong registry | Run `npm login` and check `npm config get registry` |
| `npm ERR! 402 Payment Required` | Trying to publish a scoped package as private | Add `--access public` flag |
| `npm ERR! You cannot publish over the previously published versions` | Version already exists on npm | Run `npm version patch` to bump |
| `npm ERR! This package name is not available` | Name is taken | Choose a different name or use scoped: `@username/name` |
| `npm ERR! ENEEDAUTH` | No auth token | Run `npm login` again |
| `npm ERR! private` is true | `package.json` has `"private": true` | Change to `"private": false` |
| Build fails — `Cannot find module 'react'` | react is in `peerDependencies` only | Add react to `devDependencies` too |
| Consumers get "Module not found" | `"main"` field points to wrong path | Ensure `dist/index.js` exists after build |
| CSS not loading for consumers | CSS not extracted or not documented | Document: `import 'react-light-table/dist/index.css'` |

---

*Follow these steps in order. Do not skip the local testing step (Step 8) — it catches 90% of publishing issues before they affect real users.*
