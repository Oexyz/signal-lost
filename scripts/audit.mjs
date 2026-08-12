import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const mode = process.argv[2];
const supportedModes = new Set(['legal', 'privacy', 'assets', 'brand', 'release']);

if (!supportedModes.has(mode)) {
  console.error('Usage: node scripts/audit.mjs <legal|privacy|assets|brand|release>');
  process.exit(2);
}

const failures = [];
const notices = [];
const frontendRoot = resolve(root, 'apps/web');
const sourceExtensions = new Set(['.css', '.html', '.js', '.jsx', '.mjs', '.svg', '.ts', '.tsx', '.webmanifest']);
const ignoredDirectories = new Set(['coverage', 'node_modules']);
const publicTextExtensions = new Set([
  '', '.css', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.svg',
  '.toml', '.ts', '.tsx', '.txt', '.webmanifest', '.yaml', '.yml',
]);
const ignoredPublicDirectories = new Set([
  '.git', '.workspace', 'blob-report', 'coverage', 'node_modules',
  'playwright-report', 'test-results',
]);

function walk(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (!entry.startsWith('.') && !ignoredDirectories.has(entry)) files.push(...walk(path));
    } else if (sourceExtensions.has(extname(entry))) {
      files.push(path);
    }
  }
  return files;
}

function walkPublicText(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (!ignoredPublicDirectories.has(entry)) files.push(...walkPublicText(path));
    } else if (
      publicTextExtensions.has(extname(entry)) &&
      entry !== '.env.local' &&
      !entry.endsWith('.log')
    ) {
      files.push(path);
    }
  }
  return files;
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function display(path) {
  return relative(root, path).replaceAll('\\', '/');
}

function checkRemoteRuntimeLoads(files) {
  const patterns = [
    { label: 'remote element source', regex: /\b(?:src|poster)\s*=\s*["']https?:\/\//giu },
    { label: 'remote stylesheet or preload', regex: /<link\b[^>]*\bhref\s*=\s*["']https?:\/\//giu },
    { label: 'remote CSS asset', regex: /(?:url\s*\(\s*|@import\s+(?:url\s*\(\s*)?)["']?https?:\/\//giu },
    { label: 'remote module import', regex: /\b(?:import|export)\s+(?:[^"']+from\s+)?["']https?:\/\//giu },
    { label: 'remote HTTP runtime request', regex: /\b(?:fetch|EventSource)\s*\(\s*["']https?:\/\//giu },
    { label: 'remote WebSocket', regex: /\bWebSocket\s*\(\s*["'](?:wss?|https?):\/\//giu },
  ];

  for (const file of files) {
    const content = read(file);
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        failures.push(`${display(file)} contains a ${pattern.label}.`);
      }
      pattern.regex.lastIndex = 0;
    }
  }
}

function checkLegal({ release }) {
  const sourceLegalFiles = [
    resolve(frontendRoot, 'public/impressum/index.html'),
    resolve(frontendRoot, 'public/datenschutz/index.html'),
  ];
  const distRoot = resolve(frontendRoot, 'dist');
  const builtLegalFiles = existsSync(distRoot)
    ? [
        resolve(distRoot, 'impressum/index.html'),
        resolve(distRoot, 'datenschutz/index.html'),
      ]
    : [];
  const legalFiles = [...sourceLegalFiles, ...builtLegalFiles];

  for (const file of legalFiles) {
    if (!existsSync(file)) {
      failures.push(`${display(file)} is missing.`);
      continue;
    }
    const content = read(file);
    if (content.trim().length < 300) failures.push(`${display(file)} is unexpectedly empty.`);
    if (/INSERT ADDRESS|YOUR NAME HERE|TODO LEGAL|LOREM IPSUM/iu.test(content)) {
      failures.push(`${display(file)} contains a forbidden legal placeholder.`);
    }
    const pending = content.match(/\[[^\]\r\n]*REQUIRED BEFORE PRODUCTION[^\]\r\n]*\]/giu) ?? [];
    if (pending.length > 0) {
      if (release) {
        failures.push(`${display(file)} still contains production operator placeholders.`);
      } else {
        notices.push(`${display(file)}: MANUAL REVIEW REQUIRED before production (${pending.length} operator field(s)).`);
      }
    }
  }

  const frontendFiles = walk(frontendRoot);
  const combined = frontendFiles.map(read).join('\n');
  for (const route of ['/impressum', '/datenschutz']) {
    if (!combined.includes(`href="${route}"`) && !combined.includes(`href='${route}'`)) {
      failures.push(`No direct footer/navigation link to ${route} was found.`);
    }
  }

  if (release) {
    for (const file of frontendFiles) {
      const pending = read(file).match(/\[[^\]\r\n]*REQUIRED BEFORE PRODUCTION[^\]\r\n]*\]/giu) ?? [];
      if (pending.length > 0 && !legalFiles.includes(file)) {
        failures.push(`${display(file)} still contains production placeholders.`);
      }
    }
  }
}

function packageManifests(directory) {
  if (!existsSync(directory)) return [];
  const manifests = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const stats = statSync(path);
    if (stats.isDirectory()) manifests.push(...packageManifests(path));
    else if (entry === 'package.json') manifests.push(path);
  }
  return manifests;
}

function scriptKind(path) {
  if (path.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (path.endsWith('.ts')) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}

function containsBrowserStorageUse(path) {
  const extension = extname(path);
  const sourceBodies = extension === '.html'
    ? [...read(path).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)].map((match) => match[1] ?? '')
    : ['.js', '.jsx', '.mjs', '.ts', '.tsx'].includes(extension)
      ? [read(path)]
      : [];
  const storageIdentifiers = new Set([
    'caches',
    'indexedDB',
    'localStorage',
    'serviceWorker',
    'sessionStorage',
  ]);

  return sourceBodies.some((body, index) => {
    const source = ts.createSourceFile(
      `${path}#${index}`,
      body,
      ts.ScriptTarget.Latest,
      true,
      extension === '.html' ? ts.ScriptKind.JS : scriptKind(path),
    );
    let found = false;
    const visit = (node) => {
      if (found) return;
      if (ts.isIdentifier(node) && storageIdentifiers.has(node.text)) {
        found = true;
        return;
      }
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'document' &&
        node.name.text === 'cookie'
      ) {
        found = true;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
  });
}

function checkPrivacy() {
  const files = walk(frontendRoot);
  checkRemoteRuntimeLoads(files);

  const prohibited = [
    'amplitude', 'datadog', 'fullstory', 'hotjar', 'logrocket', 'mixpanel',
    'newrelic', 'posthog', 'rollbar', 'segment', 'sentry',
  ];
  for (const manifest of packageManifests(root)) {
    const content = read(manifest).toLowerCase();
    for (const name of prohibited) {
      if (content.includes(`"${name}`) || content.includes(`/${name}`)) {
        failures.push(`${display(manifest)} references prohibited telemetry package ${name}.`);
      }
    }
  }

  const storageFiles = files.filter(containsBrowserStorageUse);
  if (storageFiles.length > 0) {
    const dataMap = resolve(root, 'docs/PRIVACY_DATA_MAP.md');
    if (!existsSync(dataMap)) {
      failures.push('Browser storage is used but docs/PRIVACY_DATA_MAP.md is missing.');
    } else failures.push(`Browser storage APIs require an explicit reviewed audit policy: ${storageFiles.map(display).join(', ')}.`);
  }
}

function checkAssets() {
  const files = walk(frontendRoot);
  checkRemoteRuntimeLoads(files);

  for (const file of files) {
    const content = read(file);
    if (/fonts\.(?:googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com/iu.test(content)) {
      failures.push(`${display(file)} references a prohibited runtime asset host.`);
    }
  }
}

function checkBrand() {
  for (const file of walkPublicText(root)) {
    if (/signal\s*\/(?!\/)\s*lost/iu.test(read(file))) {
      failures.push(`${display(file)} uses a single-slash brand spelling; visible branding must be SIGNAL//LOST.`);
    }
  }
}

if (mode === 'legal') checkLegal({ release: false });
if (mode === 'release') {
  checkLegal({ release: true });
  checkPrivacy();
  checkAssets();
  checkBrand();
}
if (mode === 'privacy') checkPrivacy();
if (mode === 'assets') checkAssets();
if (mode === 'brand') checkBrand();

for (const notice of [...new Set(notices)]) console.log(`NOTICE: ${notice}`);
for (const failure of [...new Set(failures)]) console.error(`ERROR: ${failure}`);

if (failures.length > 0) process.exit(1);
console.log(`${mode} audit passed.`);
