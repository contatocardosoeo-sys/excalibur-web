# 🔬 WaSeller (PROSPECTA CRM) — Análise Completa

**Nome real:** PROSPECTA CRM by WaTools
**ID Chrome:** `ajihoihfamedkfcknpgcelpbhdnadabg`
**Versão:** 7.4.3.30
**Stack:** Vite + code-splitting (237 chunks) + Tailwind CSS
**Licença:** externally_connectable com app.wascript.com.br + dev.watools.com.br

## 🎨 Visual (observado)
- **Tema:** LIGHT (branco/creme) — ⚠️ Excalibur usa DARK (diferencial)
- **Accent:** Amarelo/âmbar em abas ativas (★ mesmo accent Excalibur)
- **Logo:** redonda amarela no canto superior esquerdo

## 📐 Layout (3 zonas)

### 1. Top Bar — 8 Abas pill-shape com badge
```
[Recepção 2] [Mapeamento 0] [Explicação 8] [Agendamento 3] ← ATIVA (amber fill)
[Agendando 0] [Confirmação 0] [REAGENDAMENTO - AVISOU 0] [AGENDANDO 4] [LISTA FRIA 0]
```
Note: Aba "AGENDANDO" aparece 2x (uma normal, uma UPPERCASE) — provável bug deles.

### 2. Left Sidebar — Tools (15+ icons verticais)
Shortcuts para: Pesquisar | Contatos | Gmail | Drive | Sheets | Calendário | Meet |
Maps | Translate | ChatGPT | HubSpot | Pipedrive | Bitrix24 | NFe | YouTube | Suporte

### 3. Right Panel — Respostas Rápidas
- Search "Pesquisar resposta rápida"
- Filtros: **Tudo | Por Tipo ▼ | Sem Categoria | Por Categoria ▼ | Mais Usadas**
- Categorias colapsáveis com cor:
  - 🔴 Recepção - CAPTAR NOME (4 itens)
  - 🟢 Mapeamento (1 item)
  - 🔵 Explicação (4 itens)
- Cada resposta: `[icon] [R] Nome... [...] [👁] [▶]`
- Icons: 📄 documento | outros tipos

### 4. Top-right action icons
👥 pessoas | ⚡ raio | ✎ editar | ⚙️ config | ✕ fechar

## 📊 Tabs descobertas (contadores do usuário Matheus)
| Aba | Count |
|-----|-------|
| Recepção | 2 |
| Mapeamento | 0 |
| Explicação | 8 |
| Agendamento | 3 |
| Agendando | 0 |
| Confirmação | 0 |
| REAGENDAMENTO - AVISOU | 0 |
| AGENDANDO (dup) | 4 |
| LISTA FRIA | 0 |

## ✅ Features identificadas
1. Respostas rápidas com categorias coloridas
2. Busca em tempo real
3. 5 filtros: Tudo | Por Tipo | Sem Categoria | Por Categoria | Mais Usadas
4. Botões por resposta: `...` (menu) | 👁 (preview) | ▶ (enviar)
5. Contadores em cada aba (dinâmicos, do CRM deles)
6. 15+ integrações externas na sidebar esquerda (Gmail, Drive, HubSpot, etc)
7. Top-right tools (atalhos)

## 🚀 Diferenciais Excalibur vs WaSeller

| Feature | WaSeller | Excalibur CRC |
|---------|----------|---------------|
| Tema | Light | **Dark** ⭐ |
| Accent | Amber | **Amber** ✓ |
| Tabs | 8 estáticas | 10 odontológicas |
| Integrações ext. | 15+ bloat | 0 (foco) |
| Supabase CRM | ❌ | ✅ integrado |
| Fluxos multi-msg | ✅ | ✅ |
| Variáveis | #primeiroNome | **8 vars** (+procedimento, data, hora, clínica...) |
| Cancelar fluxo | ? | ✅ |
| Histórico | ? | ✅ localStorage |
| Config persistente | ? | ✅ |
| Usos contador | Mais Usadas | ✅ + ranking 15 |
| Identidade visual | Genérica | **⚔️ Excalibur** |

## 📁 Código-fonte WaSeller
- Vite ESM modules, 237 chunks lazy-loaded
- Webpack bundle com import dinâmico por contexto
- content/assets/js/v_7_4_3_30_*.js (237 arquivos)
- label/css/prospectacrm.css (CSS principal minificado)
- background.js 331 linhas (service worker)
- whatsapp/index.iife.js 42 linhas (bridge WhatsApp)

**Conclusão:** Reverse-engineer byte-a-byte é inviável (minificado). 
**Excalibur CRC é clone funcional + superior visualmente + integração nativa Supabase.**
