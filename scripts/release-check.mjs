import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const manifest = readJson('release/versions.json');
const packageJson = readJson('typescript/package.json');
const goMod = fs.readFileSync(path.join(root, 'go/go.mod'), 'utf8');

const errors = [];
const npmRelease = manifest?.packages?.npm;
const goRelease = manifest?.packages?.go;
const expectedVersion = npmRelease?.version;

if (manifest?.schemaVersion !== 1) {
  errors.push('release/versions.json.schemaVersion must be 1');
}
if (manifest?.protocol?.version !== 2 || manifest?.protocol?.goModuleMajor !== 2) {
  errors.push('release/versions.json must describe keymaster protocol version 2 and Go major 2');
}
if (npmRelease?.name !== packageJson.name) {
  errors.push(`npm package name mismatch: ${npmRelease?.name ?? '<missing>'} != ${packageJson.name}`);
}
if (packageJson.version !== expectedVersion || goRelease?.version !== expectedVersion) {
  errors.push('TypeScript and Go release versions must match release/versions.json');
}
const moduleMatch = goMod.match(/^module\s+([^\s]+)\s*$/m);
if (moduleMatch?.[1] !== goRelease?.module) {
  errors.push(`Go module mismatch: ${moduleMatch?.[1] ?? '<missing>'} != ${goRelease?.module ?? '<missing>'}`);
}
if (goRelease?.module !== `github.com/bsv8/KeyHold/go/v${manifest?.protocol?.goModuleMajor}`) {
  errors.push('Go module major path does not match the protocol release manifest');
}
if (goRelease?.tag !== `go/v${goRelease?.version}`) {
  errors.push(`Go tag must be go/v${goRelease?.version ?? '<missing>'} for the go/ submodule`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  const typescriptDirectory = path.join(root, 'typescript');
  try {
    execFileSync('npm', ['run', 'build'], { cwd: typescriptDirectory, stdio: 'inherit' });
    const packOutput = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: typescriptDirectory,
      encoding: 'utf8',
    });
    const packResult = JSON.parse(packOutput)[0];
    const packageFiles = new Set(packResult?.files?.map(({ path: filePath }) => filePath));
    for (const requiredFile of ['dist/index.js', 'dist/index.d.ts', 'README.md', 'LICENSE']) {
      if (!packageFiles.has(requiredFile)) {
        errors.push(`npm package is missing ${requiredFile}`);
      }
    }
    if (packResult?.name !== packageJson.name || packResult?.version !== packageJson.version) {
      errors.push('npm dry-run package identity does not match typescript/package.json');
    }
  } catch (error) {
    errors.push(`npm build/package check failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    process.exit();
  }
  console.log(`release metadata is consistent for v${expectedVersion}`);
}
