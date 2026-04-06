// ⚔️ Excalibur — CDP direto via WebSocket
// Anexa a uma aba do Chrome e tira screenshot + extrai HTML/text
import WebSocket from 'ws'
import fs from 'fs/promises'

const CDP = 'http://localhost:9222'

async function getTabs() {
  const res = await fetch(`${CDP}/json`)
  return await res.json()
}

function send(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ id, method, params })
    const handler = (data) => {
      const msg = JSON.parse(data.toString())
      if (msg.id === id) {
        ws.off('message', handler)
        if (msg.error) reject(new Error(msg.error.message))
        else resolve(msg.result)
      }
    }
    ws.on('message', handler)
    ws.send(payload)
  })
}

async function attachAndScreenshot(url, outPath, waitMs = 3000) {
  const tabs = await getTabs()
  const tab = tabs.find((t) => t.type === 'page' && t.url.includes(url))
  if (!tab) throw new Error(`No tab found matching ${url}`)

  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((r) => ws.once('open', r))

  let id = 0
  await send(ws, ++id, 'Page.enable')
  await send(ws, ++id, 'DOM.enable')
  await send(ws, ++id, 'Runtime.enable')
  // bring to front
  await send(ws, ++id, 'Page.bringToFront').catch(() => {})

  await new Promise((r) => setTimeout(r, waitMs))

  // Get URL and title
  const info = await send(ws, ++id, 'Runtime.evaluate', {
    expression: 'JSON.stringify({url: location.href, title: document.title})',
  })
  console.log('PAGE:', info.result.value)

  // Capture screenshot
  const shot = await send(ws, ++id, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  })
  await fs.writeFile(outPath, Buffer.from(shot.data, 'base64'))
  console.log('SAVED:', outPath)

  // Get inner text
  const txt = await send(ws, ++id, 'Runtime.evaluate', {
    expression: 'document.body.innerText.slice(0, 8000)',
  })
  console.log('TEXT:', txt.result.value)

  ws.close()
}

async function navigateTab(matchUrl, newUrl, waitMs = 3500) {
  const tabs = await getTabs()
  const tab = tabs.find((t) => t.type === 'page' && t.url.includes(matchUrl))
  if (!tab) throw new Error(`No tab found matching ${matchUrl}`)
  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((r) => ws.once('open', r))
  let id = 0
  await send(ws, ++id, 'Page.enable')
  await send(ws, ++id, 'Page.navigate', { url: newUrl })
  await new Promise((r) => setTimeout(r, waitMs))
  ws.close()
}

// CLI
const [, , cmd, ...args] = process.argv
if (cmd === 'shot') {
  // usage: shot <urlMatch> <outPath> [waitMs]
  await attachAndScreenshot(args[0], args[1], args[2] ? +args[2] : 3000)
} else if (cmd === 'nav') {
  // usage: nav <urlMatch> <newUrl> [waitMs]
  await navigateTab(args[0], args[1], args[2] ? +args[2] : 3500)
} else if (cmd === 'tabs') {
  const tabs = await getTabs()
  console.log(
    JSON.stringify(
      tabs.filter((t) => t.type === 'page').map((t) => ({ id: t.id, title: t.title, url: t.url })),
      null,
      2
    )
  )
}
