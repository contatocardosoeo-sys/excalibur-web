// Tour ao vivo por todas as páginas do Excalibur no Chrome do CEO
import WebSocket from 'ws'
import fs from 'fs/promises'

const res = await fetch('http://localhost:9222/json')
const tabs = await res.json()
const tab = tabs.find((t) => t.type === 'page' && t.url.includes('localhost:3000'))
if (!tab) { console.error('Nenhuma aba localhost:3000'); process.exit(1) }

const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => ws.once('open', r))
let id = 0
const send = (m, p = {}) =>
  new Promise((resolve, reject) => {
    const i = ++id
    const h = (d) => { const msg = JSON.parse(d); if (msg.id === i) { ws.off('message', h); if (msg.error) reject(msg.error); else resolve(msg.result) } }
    ws.on('message', h)
    ws.send(JSON.stringify({ id: i, method: m, params: p }))
  })

await send('Page.enable')
await send('Page.bringToFront')

const rotas = [
  { path: '/dashboard', nome: 'Dashboard' },
  { path: '/crm', nome: 'CRM + Funil' },
  { path: '/pacientes', nome: 'Pacientes' },
  { path: '/agenda', nome: 'Agenda' },
  { path: '/financeiro', nome: 'Excalibur Pay' },
  { path: '/marketing', nome: 'Marketing' },
  { path: '/academia', nome: 'Academia' },
]

for (const r of rotas) {
  console.log(`→ ${r.nome} (${r.path})`)
  await send('Page.navigate', { url: 'http://localhost:3000' + r.path })
  await new Promise((x) => setTimeout(x, 2800))
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  await fs.writeFile(`tour-${r.path.slice(1)}.png`, Buffer.from(shot.data, 'base64'))
}
console.log('\n✅ Tour completo — 7 páginas capturadas')
ws.close()
