import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { isIP } from 'node:net';

const ALLOWED_KEYS = new Set(['name', 'description', 'domains', 'cidrs']);

function parseArgs(argv) {
  const args = {
    input: 'profiles',
    output: 'dist',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      args.input = argv[index + 1];
      index += 1;
    } else if (arg === '--output') {
      args.output = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function parseSimpleYaml(content, filePath) {
  const result = {};
  let currentListKey = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, '    ');
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (line.startsWith('  - ')) {
      if (!currentListKey) {
        throw new Error(`Invalid YAML in ${filePath}: list item without a parent key`);
      }

      result[currentListKey].push(trimmed.slice(2).trim());
      continue;
    }

    if (line.startsWith(' ')) {
      throw new Error(`Invalid YAML in ${filePath}: unsupported indentation`);
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      throw new Error(`Invalid YAML in ${filePath}: expected key/value pair`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`Invalid YAML in ${filePath}: unsupported key "${key}"`);
    }

    if (value) {
      result[key] = value;
      currentListKey = null;
      continue;
    }

    result[key] = [];
    currentListKey = key;
  }

  return result;
}

function normalizeDomains(domains, filePath) {
  if (domains === undefined || domains === null || domains === 'null') {
    return [];
  }

  if (!Array.isArray(domains)) {
    throw new Error(`Invalid YAML in ${filePath}: domains must be a list`);
  }

  return [...new Set(domains.map((item) => String(item).trim().toLowerCase()).filter(Boolean))].sort();
}

function validateCidr(cidr, filePath) {
  const [address, prefix] = String(cidr).trim().split('/');
  if (!address || prefix === undefined) {
    throw new Error(`Invalid CIDR in ${filePath}: ${cidr}`);
  }

  const ipVersion = isIP(address);
  if (!ipVersion) {
    throw new Error(`Invalid CIDR in ${filePath}: ${cidr}`);
  }

  const prefixNumber = Number(prefix);
  const maxPrefix = ipVersion === 4 ? 32 : 128;
  if (!Number.isInteger(prefixNumber) || prefixNumber < 0 || prefixNumber > maxPrefix) {
    throw new Error(`Invalid CIDR in ${filePath}: ${cidr}`);
  }

  return `${address}/${prefixNumber}`;
}

function normalizeCidrs(cidrs, filePath) {
  if (cidrs === undefined || cidrs === null || cidrs === 'null') {
    return [];
  }

  if (!Array.isArray(cidrs)) {
    throw new Error(`Invalid YAML in ${filePath}: cidrs must be a list`);
  }

  return [...new Set(cidrs.map((item) => validateCidr(item, filePath)).filter(Boolean))].sort();
}

function loadProfile(profileDir) {
  const filePath = path.join(profileDir, 'rules.yaml');
  const parsed = parseSimpleYaml(readFileSync(filePath, 'utf8'), filePath);

  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new Error(`Invalid YAML in ${filePath}: name is required`);
  }

  return {
    name: parsed.name.trim(),
    description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
    domains: normalizeDomains(parsed.domains ?? [], filePath),
    cidrs: normalizeCidrs(parsed.cidrs ?? [], filePath),
  };
}

function toClash(profile) {
  const payload = [
    ...profile.domains.map((domain) => `  - DOMAIN,${domain}`),
    ...profile.cidrs.map((cidr) => `  - IP-CIDR,${cidr},no-resolve`),
  ];

  return ['payload:', ...payload, ''].join('\n');
}

function toSingBox(profile) {
  const rules = [];
  if (profile.domains.length > 0) {
    rules.push({ domain: profile.domains });
  }
  if (profile.cidrs.length > 0) {
    rules.push({ ip_cidr: profile.cidrs });
  }

  return `${JSON.stringify({ version: 4, rules }, null, 2)}\n`;
}

function toRuleList(profile) {
  return [
    ...profile.domains.map((domain) => `DOMAIN,${domain},wg`),
    ...profile.cidrs.map((cidr) => `IP-CIDR,${cidr},wg,no-resolve`),
    '',
  ].join('\n');
}

function writeProfileOutput(profile, outputDir) {
  const profileOutputDir = path.join(outputDir, profile.name);
  rmSync(profileOutputDir, { recursive: true, force: true });
  mkdirSync(profileOutputDir, { recursive: true });

  writeFileSync(path.join(profileOutputDir, 'clash.yaml'), toClash(profile), 'utf8');
  writeFileSync(path.join(profileOutputDir, 'sing-box.source.json'), toSingBox(profile), 'utf8');
  writeFileSync(path.join(profileOutputDir, 'surge.list'), toRuleList(profile), 'utf8');
  writeFileSync(path.join(profileOutputDir, 'shadowrocket.list'), toRuleList(profile), 'utf8');
}

function buildAllProfiles(inputDir, outputDir) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const profileDirs = readdirSync(inputDir)
    .map((entry) => path.join(inputDir, entry))
    .filter((entryPath) => statSync(entryPath).isDirectory())
    .sort();

  for (const profileDir of profileDirs) {
    const profile = loadProfile(profileDir);
    writeProfileOutput(profile, outputDir);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  buildAllProfiles(path.resolve(args.input), path.resolve(args.output));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
