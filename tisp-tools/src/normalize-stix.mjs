import { anonymizeIndicator, buildTlpMarkings, indicatorPattern, normalizeInput, readJson, tlpMarkingRef, uuidFrom, writeJson } from './ioc-utils.mjs';

const [inputPath = 'examples/sample-iocs.json', outputPath = 'out/stix-bundle.json'] = process.argv.slice(2);
const indicators = normalizeInput(await readJson(inputPath));

const now = process.env.TISP_GENERATED_AT ?? new Date().toISOString();
const objects = indicators.map((indicator) => {
  const safeValue = anonymizeIndicator(indicator);
  return {
    type: 'indicator',
    spec_version: '2.1',
    id: `indicator--${uuidFrom(`${indicator.type}:${safeValue}`)}`,
    created: now,
    modified: now,
    name: `${indicator.type.toUpperCase()} indicator from ${indicator.sourceOrg}`,
    description: `Normalized and privacy-screened TISP indicator. Source: ${indicator.sourceOrg}. Severity: ${indicator.severity}.`,
    indicator_types: indicator.type === 'yara' ? ['malicious-activity'] : ['unknown'],
    pattern: indicatorPattern(indicator.type, safeValue),
    pattern_type: indicator.type === 'yara' ? 'yara' : 'stix',
    valid_from: indicator.firstSeen,
    labels: [...new Set([indicator.severity.toLowerCase(), indicator.type, ...indicator.tags])],
    confidence: indicator.confidence,
    object_marking_refs: [tlpMarkingRef(indicator.tlp)],
    x_tisp_source_org: indicator.sourceOrg,
    x_tisp_original_value_hash: anonymizeIndicator(indicator) === indicator.value ? undefined : `sha256:${uuidFrom(indicator.value)}`,
  };
});

const bundle = {
  type: 'bundle',
  id: `bundle--${uuidFrom(JSON.stringify(objects.map((item) => item.id)))}`,
  objects: [...buildTlpMarkings(), ...objects],
};

for (const object of bundle.objects) {
  for (const key of Object.keys(object)) {
    if (object[key] === undefined) {
      delete object[key];
    }
  }
}

await writeJson(outputPath, bundle);
console.log(`Wrote ${objects.length} STIX indicators to ${outputPath}`);
