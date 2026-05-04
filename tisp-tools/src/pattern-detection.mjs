import { anonymizeIndicator, normalizeInput, readJson, severityWeight, sha256, writeJson } from './ioc-utils.mjs';

const [inputPath = 'examples/sample-iocs.json', outputPath = 'out/threat-report.json'] = process.argv.slice(2);
const indicators = normalizeInput(await readJson(inputPath));

const byTag = new Map();
const bySource = new Map();
const byIndicator = new Map();

for (const indicator of indicators) {
  const safeValue = anonymizeIndicator(indicator);
  const indicatorKey = `${indicator.type}:${safeValue}`;

  if (!byIndicator.has(indicatorKey)) {
    byIndicator.set(indicatorKey, {
      type: indicator.type,
      value: safeValue,
      sources: new Set(),
      maxSeverity: indicator.severity,
      maxConfidence: indicator.confidence,
      tags: new Set(indicator.tags),
    });
  }

  const existing = byIndicator.get(indicatorKey);
  existing.sources.add(indicator.sourceOrg);
  existing.maxConfidence = Math.max(existing.maxConfidence, indicator.confidence);
  existing.maxSeverity = severityWeight(indicator.severity) > severityWeight(existing.maxSeverity) ? indicator.severity : existing.maxSeverity;
  indicator.tags.forEach((tag) => existing.tags.add(tag));

  if (!bySource.has(indicator.sourceOrg)) {
    bySource.set(indicator.sourceOrg, { indicatorCount: 0, confidenceTotal: 0, highSeverityCount: 0 });
  }

  const source = bySource.get(indicator.sourceOrg);
  source.indicatorCount += 1;
  source.confidenceTotal += indicator.confidence;
  source.highSeverityCount += severityWeight(indicator.severity) >= 3 ? 1 : 0;

  for (const tag of indicator.tags) {
    if (!byTag.has(tag)) {
      byTag.set(tag, { count: 0, maxSeverity: indicator.severity, sources: new Set() });
    }

    const tagStats = byTag.get(tag);
    tagStats.count += 1;
    tagStats.sources.add(indicator.sourceOrg);
    tagStats.maxSeverity = severityWeight(indicator.severity) > severityWeight(tagStats.maxSeverity) ? indicator.severity : tagStats.maxSeverity;
  }
}

const correlatedIndicators = [...byIndicator.values()]
  .filter((indicator) => indicator.sources.size > 1 || severityWeight(indicator.maxSeverity) >= 3)
  .map((indicator) => ({
    type: indicator.type,
    value: indicator.value,
    valueHash: sha256(indicator.value).slice(0, 16),
    sourceCount: indicator.sources.size,
    sources: [...indicator.sources].sort(),
    maxSeverity: indicator.maxSeverity,
    maxConfidence: indicator.maxConfidence,
    tags: [...indicator.tags].sort(),
  }))
  .sort((a, b) => severityWeight(b.maxSeverity) - severityWeight(a.maxSeverity) || b.sourceCount - a.sourceCount);

const emergingThemes = [...byTag.entries()]
  .map(([tag, stats]) => ({
    tag,
    count: stats.count,
    sourceCount: stats.sources.size,
    maxSeverity: stats.maxSeverity,
  }))
  .filter((theme) => theme.count >= 2 || severityWeight(theme.maxSeverity) >= 3)
  .sort((a, b) => b.count - a.count || severityWeight(b.maxSeverity) - severityWeight(a.maxSeverity));

const sourceReliability = [...bySource.entries()]
  .map(([sourceOrg, stats]) => ({
    sourceOrg,
    indicatorCount: stats.indicatorCount,
    averageConfidence: Number((stats.confidenceTotal / stats.indicatorCount).toFixed(2)),
    highSeverityCount: stats.highSeverityCount,
    reliabilityScore: Number(((stats.confidenceTotal / stats.indicatorCount) + stats.highSeverityCount * 4).toFixed(2)),
  }))
  .sort((a, b) => b.reliabilityScore - a.reliabilityScore);

const report = {
  generatedAt: process.env.TISP_GENERATED_AT ?? new Date().toISOString(),
  summary: {
    indicatorCount: indicators.length,
    sourceCount: bySource.size,
    correlatedIndicatorCount: correlatedIndicators.length,
    emergingThemeCount: emergingThemes.length,
  },
  correlatedIndicators,
  emergingThemes,
  sourceReliability,
  recommendedActions: [
    'Promote multi-source high-confidence indicators to MISP sharing groups.',
    'Create TheHive cases for CRITICAL indicators tagged c2, ransomware, or credential-access.',
    'Push sanitized STIX bundles to TAXII collections for partner consumption.',
    'Review low-confidence single-source indicators before external sharing.',
  ],
};

await writeJson(outputPath, report);
console.log(`Wrote TISP pattern report to ${outputPath}`);
