/**
 * Script CDP — navega ao Supabase Settings via Chrome debug port
 * e extrai a service_role key da página
 */

import { createConnection } from 'net';

const TAB_WS = 'ws://localhost:9222/devtools/page/D75F7E085B4814455DF43071BA19D31F';
const TARGET_URL = 'https://supabase.com/dashboard/project/hluhlsnodndpskrkbjuw/settings/api';

// Parse WebSocket URL
const wsUrl = new URL(TAB_WS);
const host = wsUrl.hostname;
const port = parseInt(wsUrl.port) || 9222;
const path = wsUrl.pathname;

let msgId = 1;
let socket;
let buffer = '';

function sendCmd(method, params = {}) {
  const msg = JSON.stringify({ id: msgId++, method, params });
  const frame = buildWsFrame(msg);
  socket.write(frame);
}

function buildWsFrame(data) {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length;

  let header;
  if (len < 126) {
    header = Buffer.alloc(6);
    header[0] = 0x81; // text frame
    header[1] = 0x80 | len; // masked
    header[2] = 0x00; header[3] = 0x00; header[4] = 0x00; header[5] = 0x00; // mask key = 0
  } else if (len < 65536) {
    header = Buffer.alloc(8);
    header[0] = 0x81;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
    header[4] = 0x00; header[5] = 0x00; header[6] = 0x00; header[7] = 0x00;
  } else {
    throw new Error('Message too large');
  }

  return Buffer.concat([header, payload]);
}

function parseWsFrame(data) {
  const messages = [];
  let offset = 0;

  while (offset < data.length) {
    if (data.length < offset + 2) break;

    const opcode = data[offset] & 0x0f;
    const masked = (data[offset + 1] & 0x80) !== 0;
    let payloadLen = data[offset + 1] & 0x7f;

    let headerLen = 2;
    if (payloadLen === 126) { payloadLen = data.readUInt16BE(offset + 2); headerLen = 4; }
    else if (payloadLen === 127) { payloadLen = Number(data.readBigUInt64BE(offset + 2)); headerLen = 10; }

    if (masked) headerLen += 4;

    if (data.length < offset + headerLen + payloadLen) break;

    const payload = data.slice(offset + headerLen, offset + headerLen + payloadLen);
    if (opcode === 1) messages.push(payload.toString('utf8'));

    offset += headerLen + payloadLen;
  }

  return messages;
}

let rawData = Buffer.alloc(0);
let navigated = false;
let waiting = false;

socket = createConnection({ host, port }, () => {
  // WebSocket handshake
  const key = Buffer.from('dGhlIHNhbXBsZSBub25jZQ==');
  socket.write(
    `GET ${path} HTTP/1.1\r\n` +
    `Host: ${host}:${port}\r\n` +
    `Upgrade: websocket\r\n` +
    `Connection: Upgrade\r\n` +
    `Sec-WebSocket-Key: ${key.toString()}\r\n` +
    `Sec-WebSocket-Version: 13\r\n\r\n`
  );
});

socket.on('data', (chunk) => {
  rawData = Buffer.concat([rawData, chunk]);

  // Check for HTTP upgrade response
  const str = rawData.toString('utf8');
  if (!navigated && str.includes('101 Switching Protocols')) {
    const headerEnd = rawData.indexOf('\r\n\r\n');
    rawData = rawData.slice(headerEnd + 4);
    navigated = true;

    console.log('✅ WebSocket conectado ao Chrome CDP');
    console.log('📡 Navegando para Supabase Settings...');

    // Enable runtime
    sendCmd('Runtime.enable');
    // Navigate to Supabase settings
    sendCmd('Page.navigate', { url: TARGET_URL });

    return;
  }

  if (!navigated) return;

  // Parse WebSocket frames
  const messages = parseWsFrame(rawData);
  rawData = Buffer.alloc(0); // consume buffer

  for (const msg of messages) {
    try {
      const data = JSON.parse(msg);

      if (data.method === 'Page.loadEventFired' && !waiting) {
        waiting = true;
        console.log('📄 Página carregada. Extraindo service_role key...');

        // Wait 3s for React to render, then extract
        setTimeout(() => {
          sendCmd('Runtime.evaluate', {
            expression: `
              // Try to find service_role key in page content
              const text = document.body.innerText;
              const match = text.match(/service_role[\\s\\S]{0,50}?(eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+)/);
              if (match) {
                'FOUND: ' + match[1];
              } else {
                // Try all JWT tokens on page
                const allJwt = [...text.matchAll(/eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+/g)].map(m => m[0]);
                JSON.stringify({ url: window.location.href, jwts: allJwt.slice(0, 5), title: document.title });
              }
            `,
            returnByValue: true,
          });
        }, 4000);
      }

      if (data.result?.result?.value) {
        console.log('\n🔑 RESULTADO:');
        console.log(data.result.result.value);
        socket.destroy();
        process.exit(0);
      }

    } catch(e) {
      // ignore parse errors
    }
  }
});

socket.on('error', (err) => {
  console.error('Erro socket:', err.message);
  process.exit(1);
});

// Timeout
setTimeout(() => {
  console.log('⏱️ Timeout — verificando estado da página...');
  sendCmd('Runtime.evaluate', {
    expression: `JSON.stringify({ url: window.location.href, title: document.title, bodyLen: document.body?.innerText?.length })`,
    returnByValue: true,
  });
  setTimeout(() => process.exit(1), 5000);
}, 20000);
