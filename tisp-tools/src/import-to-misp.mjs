import { request } from 'node:https';
import { readJson } from './ioc-utils.mjs';

const postToMisp = (url, apiKey, body, rejectUnauthorized) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = JSON.stringify(body);

    const req = request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'POST',
        rejectUnauthorized,
        headers: {
          Authorization: apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });

const bundlePath = process.argv[2] ?? 'out/stix-bundle.json';
const apiKey = process.env.MISP_API_KEY;

if (!apiKey) {
  throw new Error('MISP_API_KEY environment variable is required.');
}

const mispUrl = process.env.MISP_URL ?? 'https://localhost:4443';
const rejectUnauthorized = process.env.MISP_VERIFY_SSL === 'true';
const bundle = await readJson(bundlePath);
const indicators = (bundle.objects ?? []).filter((object) => object.type === 'indicator');

let imported = 0;

for (const object of indicators) {
  const eventBody = {
    Event: {
      info: object.name,
      distribution: 0,
      threat_level_id: 2,
      analysis: 0,
      Attribute: [
        {
          type: 'text',
          value: object.pattern,
          comment: object.description,
        },
      ],
    },
  };

  try {
    const result = await postToMisp(`${mispUrl}/events/add`, apiKey, eventBody, rejectUnauthorized);
    if (result.status >= 200 && result.status < 300) {
      const eventId = result.body?.Event?.id ?? result.body?.id ?? 'unknown';
      imported++;
      console.log(`[${object.id}] HTTP ${result.status}: event ${eventId}`);
    } else {
      console.error(`[${object.id}] HTTP ${result.status}: ${JSON.stringify(result.body).slice(0, 200)}`);
    }
  } catch (err) {
    console.error(`[${object.id}] error: ${err.message}`);
  }
}

console.log(`Imported ${imported} / ${indicators.length} indicators`);

if (imported < indicators.length) {
  process.exit(1);
}
