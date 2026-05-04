import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const targetUrl = args.get('--url') ?? 'http://127.0.0.1:5173/';
const outputPath = args.get('--output') ?? 'submission-evidence/screenshots/opencti-dataflow-desktop-1440x900.png';
const edgePath = args.get('--edge') ?? process.env.EDGE_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

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
    let commandId = 0;

    socket.addEventListener('open', () => {
      resolve({
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
      }
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

await mkdir(path.dirname(outputPath), { recursive: true });

const port = await findFreePort();
const browser = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

let client;
try {
  const tab = await waitForJson(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(targetUrl)}`, 10000, { method: 'PUT' });
  client = await connectCdp(tab.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Page.navigate', { url: targetUrl });
  await waitForPageReady(client);
  await sleep(500);

  const result = await runtimeValue(client, `
    (async () => {
      const button = Array.from(document.querySelectorAll('button')).find((node) => node.title === 'OpenCTI Graph');
      if (!button) throw new Error('OpenCTI Graph button not found');
      button.click();
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (document.body.innerText.includes('Threat Relationship Graph')) break;
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      const stage = document.querySelector('.opencti-stage');
      if (!stage) throw new Error('OpenCTI stage not found');
      const stageRect = stage.getBoundingClientRect();
      const boxes = Array.from(document.querySelectorAll('.opencti-graph-node')).map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          id: node.getAttribute('data-flow-node'),
          left: rect.left >= stageRect.left,
          right: rect.right <= stageRect.right,
          top: rect.top >= stageRect.top,
          bottom: rect.bottom <= stageRect.bottom,
          rect: {
            left: Math.round(rect.left - stageRect.left),
            right: Math.round(stageRect.right - rect.right),
            top: Math.round(rect.top - stageRect.top),
            bottom: Math.round(stageRect.bottom - rect.bottom)
          }
        };
      });
      const clippedNodes = boxes.filter((box) => !box.left || !box.right || !box.top || !box.bottom);
      const wireCount = document.querySelectorAll('.opencti-wire').length;
      const socketCount = document.querySelectorAll('.opencti-wire-socket').length;
      const grid = document.querySelector('.opencti-stage__grid');
      const gridHidden = !grid || getComputedStyle(grid).display === 'none';
      const campaign = document.querySelector('[data-flow-node="campaign"] button');
      if (!campaign) throw new Error('Campaign graph node not found');
      const campaignRect = campaign.getBoundingClientRect();
      return {
        rendered: document.body.innerText.includes('Threat Relationship Graph'),
        nodeCount: boxes.length,
        clipped: clippedNodes.length,
        clippedNodes,
        wireCount,
        socketCount,
        gridHidden,
        hoverPoint: {
          x: Math.round(campaignRect.left + campaignRect.width / 2),
          y: Math.round(campaignRect.top + campaignRect.height / 2)
        }
      };
    })()
  `);

  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: result.hoverPoint.x,
    y: result.hoverPoint.y,
  });
  await sleep(350);

  const popoverVisible = await runtimeValue(client, `
    (() => {
      const campaignPopover = document.querySelector('[data-flow-node="campaign"] .opencti-popover');
      return campaignPopover && Number.parseFloat(getComputedStyle(campaignPopover).opacity) > 0.8;
    })()
  `);

  if (!result.rendered || result.nodeCount < 8 || result.wireCount < 8 || result.socketCount < 8 || !result.gridHidden || result.clipped > 0 || !popoverVisible) {
    result.popoverVisible = popoverVisible;
    throw new Error(`OpenCTI screenshot preflight failed: ${JSON.stringify(result)}`);
  }

  await sleep(1400);
  const capture = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(outputPath, Buffer.from(capture.data, 'base64'));
  console.log(`OpenCTI screenshot captured: ${outputPath}`);
} finally {
  client?.close();
  browser.kill();
}
