## STEP 1

```bash
# Open in your editor
code package.json    # or: vim package.json / nano package.json
```

### Update the version

```json
{
  "name": "@kedman1234/react-light-table",
  "version": "2.1.1"
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

> @kedman1234/react-light-table@2.1.1 build
> rollup -c


src/index.ts -> dist/index.js, dist/index.esm.js...
created dist/index.js, dist/index.esm.js in 3.8s
```

## STEP 2 - Verify What Will Be Published

Before actually publishing, inspect exactly what npm will include in your package:

### 2a. Dry Run - See the File List

```bash
npm pack --dry-run
```

This prints the list of files that would go into the tarball without actually creating it. Verify:

```bash
npm notice
npm notice package: @kedman1234/react-light-table@2.1.1
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 13.4kB README.md
npm notice 562B dist/hooks/usePagination.d.ts
npm notice 641B dist/hooks/useSearch.d.ts
npm notice 581B dist/hooks/useSelection.d.ts
npm notice 589B dist/hooks/useSort.d.ts
npm notice 308B dist/index.d.ts
npm notice 18.1kB dist/index.esm.js
npm notice 26.4kB dist/index.esm.js.map
npm notice 19.1kB dist/index.js
npm notice 27.1kB dist/index.js.map
npm notice 43B dist/setupTests.d.ts
npm notice 8.5kB dist/table.css
npm notice 104B dist/Table/index.d.ts
npm notice 220B dist/Table/Table.d.ts
npm notice 3.6kB dist/Table/Table.types.d.ts
npm notice 854B dist/utils/helpers.d.ts
npm notice 2.3kB package.json
npm notice Tarball Details
npm notice name: @kedman1234/react-light-table
npm notice version: 2.1.1
npm notice filename: kedman1234-react-light-table-2.1.1.tgz
npm notice package size: 33.3 kB
npm notice unpacked size: 123.5 kB
npm notice shasum: eed1e49c787fa8830be030beb534e1c000ef9aba
npm notice integrity: sha512-NKpaYa9DFX6tL[...]wCgXS9FuOJVtA==
npm notice total files: 18
npm notice
kedman1234-react-light-table-2.1.1.tgz
```

### 2b. Create the Actual Tarball

```bash
npm pack
```

This creates a `.tgz` file like `kedman1234-react-light-table-2.1.1.tgz`. You can open it to inspect:

```bash
npm notice 8.5kB dist/table.css
npm notice 104B dist/Table/index.d.ts
npm notice 220B dist/Table/Table.d.ts
npm notice 3.6kB dist/Table/Table.types.d.ts
npm notice 854B dist/utils/helpers.d.ts
npm notice 2.3kB package.json
npm notice Tarball Details
npm notice name: @kedman1234/react-light-table
npm notice version: 2.1.1
npm notice filename: kedman1234-react-light-table-2.1.1.tgz
npm notice package size: 33.3 kB
npm notice unpacked size: 123.5 kB
npm notice shasum: eed1e49c787fa8830be030beb534e1c000ef9aba
npm notice integrity: sha512-NKpaYa9DFX6tL[...]wCgXS9FuOJVtA==
npm notice total files: 18
npm notice
kedman1234-react-light-table-2.1.1.tgz
```

```bash
tar -tzf kedman1234-react-light-table-2.1.1.tgz
```

## STEP 9 - Log In to npm from Terminal

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

## STEP 10 - Publish to npm

### 10a. Commit All Changes

```bash
cd /path/to/react-light-table

git add .
git commit -m "feat: prepare v2.1.1 for npm publish"
git tag v2.1.1
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
