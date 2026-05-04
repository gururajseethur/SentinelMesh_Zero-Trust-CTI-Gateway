import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

export const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

export const sha256 = (value) => createHash('sha256').update(String(value)).digest('hex');

export const uuidFrom = (value) => {
  const hex = sha256(value).slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20, 32).join('')}`;
};

export const normalizeInput = (input) => {
  const rows = Array.isArray(input) ? input : input.indicators;
  if (!Array.isArray(rows)) {
    throw new Error('Input must be an array or an object with an indicators array.');
  }

  return rows.map((row, index) => {
    const value = String(row.value ?? '').trim();
    if (!value) {
      throw new Error(`Indicator at index ${index} is missing value.`);
    }

    return {
      value,
      type: normalizeType(row.type, value),
      sourceOrg: String(row.sourceOrg ?? 'UNKNOWN').trim(),
      tlp: String(row.tlp ?? 'AMBER').trim().toUpperCase(),
      confidence: clamp(Number(row.confidence ?? 50), 0, 100),
      severity: String(row.severity ?? 'MEDIUM').trim().toUpperCase(),
      firstSeen: row.firstSeen ? new Date(row.firstSeen).toISOString() : new Date('2026-01-01T00:00:00Z').toISOString(),
      tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean) : [],
    };
  });
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export const normalizeType = (type, value) => {
  const known = String(type ?? '').trim().toLowerCase();
  if (known) {
    return known;
  }

  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return 'ipv4';
  if (/^[a-f0-9]{32}$/i.test(value)) return 'md5';
  if (/^[a-f0-9]{40}$/i.test(value)) return 'sha1';
  if (/^[a-f0-9]{64}$/i.test(value)) return 'sha256';
  if (/^https?:\/\//i.test(value)) return 'url';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) return 'domain';
  if (/^rule\s+\w+/i.test(value)) return 'yara';
  return 'artifact';
};

export const anonymizeIndicator = ({ type, value }) => {
  if (type === 'ipv4') {
    const octets = value.split('.');
    if (octets.length === 4) {
      return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
    }
  }

  if (type === 'url') {
    const parsed = new URL(value);
    parsed.search = parsed.search ? `?redacted=${sha256(parsed.search).slice(0, 12)}` : '';
    return parsed.toString();
  }

  if (type === 'email') {
    return `anon-${sha256(value).slice(0, 12)}@example.invalid`;
  }

  return value;
};

export const indicatorPattern = (type, value) => {
  const escaped = value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
  if (type === 'ipv4') return `[ipv4-addr:value = '${escaped}']`;
  if (type === 'domain') return `[domain-name:value = '${escaped}']`;
  if (type === 'url') return `[url:value = '${escaped}']`;
  if (type === 'md5') return `[file:hashes.MD5 = '${escaped}']`;
  if (type === 'sha1') return `[file:hashes.'SHA-1' = '${escaped}']`;
  if (type === 'sha256') return `[file:hashes.'SHA-256' = '${escaped}']`;
  return `[artifact:payload_bin MATCHES '${sha256(value)}']`;
};

export const severityWeight = (severity) => {
  if (severity === 'CRITICAL') return 4;
  if (severity === 'HIGH') return 3;
  if (severity === 'MEDIUM') return 2;
  if (severity === 'LOW') return 1;
  return 0;
};

export const tlpMarkingRef = (tlp) => {
  const normalized = ['WHITE', 'GREEN', 'AMBER', 'RED'].includes(tlp) ? tlp : 'AMBER';
  return `marking-definition--${uuidFrom(`tlp:${normalized}`)}`;
};

export const buildTlpMarkings = () =>
  ['WHITE', 'GREEN', 'AMBER', 'RED'].map((tlp) => ({
    type: 'marking-definition',
    spec_version: '2.1',
    id: tlpMarkingRef(tlp),
    created: '2026-01-01T00:00:00.000Z',
    definition_type: 'tlp',
    name: `TLP:${tlp}`,
    definition: { tlp },
  }));
