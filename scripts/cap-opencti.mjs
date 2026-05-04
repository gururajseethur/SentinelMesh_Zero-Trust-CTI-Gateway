import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import net from 'node:net';
const outputDir = 'FINAL_SUBMISSION/final-screenshots';
await mkdir(outputDir, { recursive: true });
const findFreePort = () => new Promise((res,rej)=>{ const s=net.createServer(); s.listen(0,'127.0.0.1',()=>{ const {port}=s.address(); s.close(()=>res(port)); }); s.on('error',rej); });
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const waitForJson = async (url,ms=15000,opts={}) => { const t=Date.now(); while(Date.now()-t<ms){ try{ const r=await fetch(url,opts); if(r.ok) return r.json(); }catch{} await sleep(200); } throw new Error('Timeout'); };
const port = await findFreePort();
const br = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,'--window-size=1440,900','about:blank'],{stdio:'ignore'});
try {
  const tab = await waitForJson(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('http://localhost:8080')}`,15000,{method:'PUT'});
  const sock = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r=>sock.addEventListener('open',r));
  let id=0; const send=(m,p={})=>new Promise((res,rej)=>{ const i=++id; sock.send(JSON.stringify({id:i,method:m,params:p})); const h=msg=>{ const d=JSON.parse(msg.data); if(d.id===i){sock.removeEventListener('message',h); d.error?rej(d.error):res(d.result);} }; sock.addEventListener('message',h); });
  await send('Page.enable'); await send('Page.navigate',{url:'http://localhost:8080'}); await sleep(8000);
  const shot = await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  await writeFile(`${outputDir}/opencti-live-1440x900.png`, Buffer.from(shot.data,'base64'));
  console.log('Captured OpenCTI');
  sock.close();
} finally { br.kill(); }
