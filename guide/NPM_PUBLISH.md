## STEP 1

```bash
# Open in your editor
code package.json    # or: vim package.json / nano package.json
```

### Update the version

```json
{
  "name": "react-light-table",
  "version": "2.0.5"
}
```

do npm install to update the package lock

```bash
npm install
```

### Check the build version

```bash
npm run build
```

expected output

```bash
PS D:\work\react-light-table> npm run build

> @kedman1234/react-light-table@2.0.5 build
> rollup -c


src/index.ts → dist/index.js, dist/index.esm.js...
created dist/index.js, dist/index.esm.js in 3.8s
```

## STEP 2 — Verify What Will Be Published

Before actually publishing, inspect exactly what npm will include in your package:

### 2a. Dry Run — See the File List

```bash
npm pack --dry-run
```

This prints the list of files that would go into the tarball without actually creating it. Verify:

```bash
npm notice
npm notice 📦  @kedman1234/react-light-table@2.0.5
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 7.7kB README.md
npm notice 451B dist/hooks/usePagination.d.ts
npm notice 292B dist/hooks/useSearch.d.ts
npm notice 469B dist/hooks/useSelection.d.ts
npm notice 369B dist/hooks/useSort.d.ts
npm notice 297B dist/index.d.ts
npm notice 8.7kB dist/index.esm.js
npm notice 12.5kB dist/index.esm.js.map
npm notice 9.3kB dist/index.js
npm notice 13.0kB dist/index.js.map
npm notice 43B dist/setupTests.d.ts
npm notice 5.8kB dist/table.css
npm notice 104B dist/Table/index.d.ts
npm notice 328B dist/Table/Table.d.ts
npm notice 2.2kB dist/Table/Table.types.d.ts
npm notice 686B dist/utils/helpers.d.ts
npm notice 2.2kB package.json
npm notice Tarball Details
npm notice name: @kedman1234/react-light-table
npm notice version: 2.0.5
npm notice filename: kedman1234-react-light-table-2.0.5.tgz
npm notice package size: 19.0 kB
npm notice unpacked size: 65.5 kB
npm notice shasum: 0eac13111b7d9a1fe7d3916af2e5bcf85ab7e27b
npm notice integrity: sha512-4bCOj8UON9dDo[...]mFbOcFpt6b5Fg==
npm notice total files: 18
npm notice
kedman1234-react-light-table-2.0.5.tgz
```

### 2b. Create the Actual Tarball

```bash
npm pack
```

This creates a `.tgz` file like `react-light-table-1.0.0.tgz`. You can open it to inspect:

```bash
npm notice 5.8kB dist/table.css
npm notice 104B dist/Table/index.d.ts
npm notice 328B dist/Table/Table.d.ts
npm notice 2.2kB dist/Table/Table.types.d.ts
npm notice 686B dist/utils/helpers.d.ts
npm notice 2.2kB package.json
npm notice Tarball Details
npm notice name: @kedman1234/react-light-table
npm notice version: 2.0.5
npm notice filename: kedman1234-react-light-table-2.0.5.tgz
npm notice package size: 19.0 kB
npm notice unpacked size: 65.5 kB
npm notice shasum: 0eac13111b7d9a1fe7d3916af2e5bcf85ab7e27b
npm notice integrity: sha512-4bCOj8UON9dDo[...]mFbOcFpt6b5Fg==
npm notice total files: 18
npm notice
kedman1234-react-light-table-2.0.5.tgz
```

```bash
tar -tzf kedman1234-react-light-table-2.0.5.tgz
```

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
git commit -m "feat: prepare v2.0.5 for npm publish"
git tag v2.0.5
git push origin develop --tags
```

### 10b. Publish

```bash
npm publish
```

If you're using a **scoped** package name (`@kedman1234/react-light-table`), scoped packages are private by default. To publish as public:

```bash
npm publish --access public
```
