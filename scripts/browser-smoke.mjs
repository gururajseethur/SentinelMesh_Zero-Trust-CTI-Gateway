import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const targetUrl = args.get('--url') ?? 'http://127.0.0.1:5173/';
const outputPath = args.get('--output') ?? 'submission-evidence/logs/09-sidebar-navigation-smoke.json';
const edgePath = args.get('--edge') ?? process.env.EDGE_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const checks = [
  ['Technology Blueprint', 'TECHNOLOGY_BLUEPRINT'],
  ['Architecture Map', 'SYSTEM_TOPOLOGY'],
  ['MISP Ingestion', 'MISP_INTEL_MATRIX'],
  ['OpenCTI Graph', 'OPEN_CTI_NEXUS'],
  ['TheHive Cases', 'THE_HIVE_OPERATIONS'],
  ['Identity & RBAC', 'IDENTITY_MESH'],
  ['Automation', 'AUTOMATION_CONTROL'],
  ['Project settings', 'PROJECT_SETTINGS'],
  ['Executive Dashboard', 'TISP Command Center'],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findFreePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });

const waitForJson = async (url, timeoutMs = 10000, options = {}) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
    } catch {
      // Browser is still starting.
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const connectCdp = (webSocketUrl) =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const pending = new Map();
    const events = [];
    let commandId = 0;

    socket.addEventListener('open', () => {
      resolve({
        events,
        send(method, params = {}) {
          commandId += 1;
          const id = commandId;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((commandResolve, commandReject) => {
            pending.set(id, { resolve: commandResolve, reject: commandReject });
          });
        },
        close() {
          socket.close();
        },
      });
    });

    socket.addEventListener('message', (message) => {
      const payload = JSON.parse(message.data);
      if (payload.id && pending.has(payload.id)) {
        const command = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) {
          command.reject(new Error(payload.error.message));
        } else {
          command.resolve(payload.result);
        }
        return;
      }
      events.push(payload);
    });

    socket.addEventListener('error', reject);
  });

const runtimeValue = async (client, expression) => {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed');
  }
  return result.result.value;
};

const waitForPageReady = async (client) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = await runtimeValue(client, 'document.readyState === "complete"');
    if (ready) return;
    await sleep(250);
  }
  throw new Error('Page did not reach complete readyState');
};

const port = await findFreePort();
const userDataDir = path.join(tmpdir(), `tisp-browser-smoke-${Date.now()}`);
await mkdir(path.dirname(outputPath), { recursive: true });

const browser = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  'about:blank',
], { stdio: 'ignore' });

let client;
try {
  const tab = await waitForJson(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(targetUrl)}`, 10000, { method: 'PUT' });
  client = await connectCdp(tab.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Log.enable');
  await client.send('Page.navigate', { url: targetUrl });
  await waitForPageReady(client);
  await sleep(500);

  const results = [];
  for (const [buttonTitle, expectedTitle] of checks) {
    const result = await runtimeValue(client, `
      (async () => {
        const button = Array.from(document.querySelectorAll('button')).find((node) => node.title === ${JSON.stringify(buttonTitle)});
        if (!button) {
          return { buttonTitle: ${JSON.stringify(buttonTitle)}, expectedTitle: ${JSON.stringify(expectedTitle)}, actualTitle: null, status: 'failed', reason: 'button not found' };
        }
        button.click();
        for (let attempt = 0; attempt < 15; attempt += 1) {
          if (document.body.innerText.includes(${JSON.stringify(expectedTitle)})) break;
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        const bodyText = document.body.innerText;
        const heading = Array.from(document.querySelectorAll('h1,h2,h3')).map((node) => node.textContent.trim()).find(Boolean) ?? '';
        return {
          buttonTitle: ${JSON.stringify(buttonTitle)},
          expectedTitle: ${JSON.stringify(expectedTitle)},
          actualTitle: bodyText.includes(${JSON.stringify(expectedTitle)}) ? ${JSON.stringify(expectedTitle)} : heading,
          status: bodyText.includes(${JSON.stringify(expectedTitle)}) ? 'passed' : 'failed'
        };
      })()
    `);
    results.push(result);
  }

  const consoleProblems = client.events.filter((event) => {
    if (event.method === 'Runtime.exceptionThrown') return true;
    if (event.method !== 'Runtime.consoleAPICalled') return false;
    return ['error', 'assert'].includes(event.params?.type);
  });

  const payload = {
    url: targetUrl,
    generatedAt: new Date().toISOString(),
    results,
    consoleProblems: consoleProblems.length,
  };

  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const failed = results.filter((result) => result.status !== 'passed');
  if (failed.length > 0 || consoleProblems.length > 0) {
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }

  console.log(`Browser smoke test passed: ${results.length} navigation checks, ${consoleProblems.length} console problems.`);
} finally {
  client?.close();
  browser.kill();
  await Promise.race([once(browser, 'exit'), sleep(3000)]).catch(() => undefined);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(userDataDir, { recursive: true, force: true });
      break;
    } catch (error) {
      if (attempt === 4) {
        console.log(`Could not remove temporary browser profile ${userDataDir}: ${error.message}`);
        break;
      }
      await sleep(300);
    }
  }
}
