# TISP Automated Analysis Tools

This folder contains free, dependency-free Node.js utilities that support the project deliverables for automated analysis, anonymization, normalization, and STIX/TAXII-ready exchange.

## Commands

```powershell
npm test
npm run normalize
npm run analyze
```

Set `TISP_GENERATED_AT` to produce reproducible timestamps in generated evidence:

```powershell
$env:TISP_GENERATED_AT="2026-04-28T00:00:00.000Z"
npm test
```

## Outputs

- `out/stix-bundle.json`: STIX 2.1 bundle with TLP markings and sanitized indicators.
- `out/threat-report.json`: Pattern detection report with correlated indicators, emerging themes, source reliability, and recommended actions.

The sample data uses reserved IP ranges and example domains. Replace `examples/sample-iocs.json` with lab data from the simulated organizations before final reporting.
