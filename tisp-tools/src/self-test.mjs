import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { readJson } from './ioc-utils.mjs';

await rm('out', { recursive: true, force: true });

const commands = [
  ['src/normalize-stix.mjs', 'examples/sample-iocs.json', 'out/stix-bundle.json'],
  ['src/pattern-detection.mjs', 'examples/sample-iocs.json', 'out/threat-report.json'],
];

for (const args of commands) {
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env, TISP_GENERATED_AT: '2026-04-28T00:00:00.000Z' },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const bundle = await readJson('out/stix-bundle.json');
const report = await readJson('out/threat-report.json');

if (bundle.type !== 'bundle' || bundle.objects.filter((item) => item.type === 'indicator').length !== 6) {
  throw new Error('STIX normalization test failed.');
}

if (report.summary.indicatorCount !== 6 || report.summary.sourceCount !== 3 || report.emergingThemes.length === 0) {
  throw new Error('Pattern detection test failed.');
}

console.log('TISP tools self-test passed.');
