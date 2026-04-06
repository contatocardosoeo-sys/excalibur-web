// ⚔️ Nexus crawler — clica cada item da sidebar, captura URL + screenshot + texto
import WebSocket from 'ws'
import fs from 'fs/promises'

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.error('Usage: node nexus-crawl.mjs "Label1" "Label2" ...')
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
await send('Runtime.enable')

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const results = []

for (const label of targets) {
  try {
    // click button by exact text match in aside
    const clickScript = `
      (() => {
        const btns = Array.from(document.querySelectorAll('aside button'));
        const b = btns.find(x => x.textContent.trim() === ${JSON.stringify(label)});
        if (!b) return { clicked: false, reason: 'not found' };
        b.click();
        return { clicked: true };
      })()
    `
    const cr = await send('Runtime.evaluate', { expression: clickScript, returnByValue: true })
    if (!cr.result.value?.clicked) {
      console.log(`[SKIP] ${label}: ${cr.result.value?.reason}`)
      results.push({ label, skipped: true })
      continue
    }

    // wait for navigation/render
    await new Promise((r) => setTimeout(r, 2200))

    // get URL + title + body text (truncated)
    const info = await send('Runtime.evaluate', {
      expression:
        'JSON.stringify({url:location.href, title:document.title, h1: document.querySelector(\"h1,h2\")?.textContent?.trim()||\"\", text: document.body.innerText.slice(0, 3500)})',
      returnByValue: true,
    })
    const data = JSON.parse(info.result.value)

    // screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    const slug = slugify(label)
    const imgPath = `docs/nexus/mod-${slug}.png`
    await fs.writeFile(imgPath, Buffer.from(shot.data, 'base64'))

    results.push({ label, ...data, imgPath })
    console.log(`[OK] ${label} → ${data.url}`)
  } catch (e) {
    console.log(`[ERR] ${label}: ${e.message}`)
    results.push({ label, error: e.message })
  }
}

await fs.writeFile(
  `docs/nexus/_crawl-${Date.now()}.json`,
  JSON.stringify(results, null, 2)
)

console.log('\n=== SUMMARY ===')
results.forEach((r) => {
  if (r.skipped) console.log(`  [skip] ${r.label}`)
  else if (r.error) console.log(`  [err]  ${r.label}: ${r.error}`)
  else console.log(`  [ok]   ${r.label} → ${r.url}`)
})

ws.close()
