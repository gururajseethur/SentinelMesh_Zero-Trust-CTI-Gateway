import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';

const outputDir = 'FINAL_SUBMISSION/final-screenshots';
await mkdir(outputDir, { recursive: true });

const findFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
  server.on('error', reject);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForJson = async (url, timeoutMs = 15000, options = {}) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const r = await fetch(url, options); if (r.ok) return r.json(); } catch {}
    await sleep(200);
  }
  throw new Error('Timed out: ' + url);
};

const port = await findFreePort();
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = spawn(edgePath, [
  '--headless=new','--disable-gpu','--no-first-run',
  '--ignore-certificate-errors', '--allow-insecure-localhost',
  `--remote-debugging-port=${port}`,'--window-size=1440,900','about:blank'
], { stdio: 'ignore' });

// Capture MISP login page
const tab = await waitForJson(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('https://localhost:4443/users/login')}`, 15000, { method: 'PUT' });
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve));
let cmdId = 0;
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++cmdId;
  socket.send(JSON.stringify({ id, method, params }));
  const handler = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id === id) { socket.removeEventListener('message', handler); data.error ? reject(data.error) : resolve(data.result); }
  };
  socket.addEventListener('message', handler);
});

await send('Page.enable');
await send('Page.navigate', { url: 'https://localhost:4443/users/login' });
await sleep(5000);

const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
await writeFile(`${outputDir}/misp-login-page-1440x900.png`, Buffer.from(shot.data, 'base64'));
console.log('Captured: misp-login-page-1440x900.png');

socket.close();
browser.kill();
