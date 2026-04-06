// Explora sub-abas de um módulo — clica em cada tab e captura
import WebSocket from 'ws'
import fs from 'fs/promises'

const [, , rota, slug, tabSelector = 'button, [role="tab"]'] = process.argv
if (!rota) {
  console.error('Usage: node nexus-subtabs.mjs <path> <slug> [tabSelector]')
  process.exit(1)
}

const res = await fetch('http://localhost:9222/json')
const tabs = await res.json()
const tab = tabs.find((t) => t.type === 'page' && t.url.includes('nexusatemporal'))
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => ws.once('open', r))

let id = 0
const send = (m, p = {}) =>
  new Promise((resolve, reject) => {
    const i = ++id
    const h = (d) => {
      const msg = JSON.parse(d)
      if (msg.id === i) {
        ws.off('message', h)
        if (msg.error) reject(msg.error)
        else resolve(msg.result)
      }
    }
    ws.on('message', h)
    ws.send(JSON.stringify({ id: i, method: m, params: p }))
  })

await send('Page.enable')
await send('Page.bringToFront')
await send('Page.navigate', { url: 'https://one.nexusatemporal.com.br' + rota })
await new Promise((r) => setTimeout(r, 3500))

// Detectar sub-abas dentro do main — procurar botões/links no topo/cabeçalho do conteúdo
const findTabs = await send('Runtime.evaluate', {
  expression: `
    (() => {
      // Procurar elementos que parecem sub-navegação: dentro de main, com role=tab ou classes similares
      const candidates = [
        ...document.querySelectorAll('main [role="tab"]'),
        ...document.querySelectorAll('main button[data-state]'),
        ...document.querySelectorAll('[role="tablist"] button'),
        ...document.querySelectorAll('nav[aria-label] button'),
      ];
      const unique = [...new Set(candidates)];
      const tabs = unique.map(el => ({
        text: el.textContent.trim().slice(0, 40),
        selected: el.getAttribute('aria-selected') === 'true' || el.dataset.state === 'active'
      })).filter(t => t.text && t.text.length < 40);
      return JSON.stringify(tabs);
    })()
  `,
  returnByValue: true,
})
const tabsList = JSON.parse(findTabs.result.value)
console.log(`Found ${tabsList.length} sub-tabs:`, tabsList.map((t) => t.text).join(' | '))

const captured = []

// Screenshot inicial
const shot0 = await send('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(`docs/nexus/sub-${slug}-00-initial.png`, Buffer.from(shot0.data, 'base64'))
captured.push({ tab: 'initial', img: `sub-${slug}-00-initial.png` })

// Click em cada sub-aba e captura
for (let i = 0; i < tabsList.length && i < 20; i++) {
  const label = tabsList[i].text
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const candidates = [
          ...document.querySelectorAll('main [role="tab"]'),
          ...document.querySelectorAll('main button[data-state]'),
          ...document.querySelectorAll('[role="tablist"] button'),
          ...document.querySelectorAll('nav[aria-label] button'),
        ];
        const unique = [...new Set(candidates)];
        const el = unique.find(x => x.textContent.trim() === ${JSON.stringify(label)});
        if (el) { el.click(); return true; }
        return false;
      })()
    `,
    returnByValue: true,
  })
  if (!clickRes.result.value) continue
  await new Promise((r) => setTimeout(r, 1500))
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  const clean = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 20)
  const fname = `sub-${slug}-${String(i + 1).padStart(2, '0')}-${clean}.png`
  await fs.writeFile(`docs/nexus/${fname}`, Buffer.from(shot.data, 'base64'))
  captured.push({ tab: label, img: fname })
  console.log(`  [${i + 1}] ${label} → ${fname}`)
}

await fs.writeFile(
  `docs/nexus/sub-${slug}-index.json`,
  JSON.stringify({ rota, subtabs: captured }, null, 2)
)
ws.close()
console.log(`\n✅ ${captured.length} screenshots salvos em docs/nexus/sub-${slug}-*.png`)
