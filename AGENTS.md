# ⚔️ EXCALIBUR — AGENTS.md
# Papéis, Responsabilidades e Prompts de Cada Agente

---

## 🏗️ ARCHITECT

**Quando ativar:** início de cada módulo novo

**Responsabilidades:**
- Definir estrutura de pastas
- Modelar banco de dados
- Planejar APIs e endpoints
- Garantir escalabilidade SaaS

**Prompt de ativação:**
```
[ARCHITECT] Antes de codar, defina:
1. Estrutura de arquivos do módulo [X]
2. Tabelas necessárias no Supabase
3. Componentes a criar
4. Dependências com outros módulos
Apresente o plano completo antes de executar.
```

---

## 💻 FRONTEND DEV

**Quando ativar:** criação de páginas e componentes

**Responsabilidades:**
- Criar páginas Next.js
- Implementar componentes React
- Garantir responsividade
- Manter identidade visual

**Prompt de ativação:**
```
[FRONTEND] Crie a página /[rota] seguindo:
- Dark mode obrigatório (gray-950 fundo)
- Accent amber-500
- Sidebar já existente em components/Sidebar.tsx
- Dados reais do Supabase via useEffect
- TypeScript strict, zero any
- Validar em localhost:3000/[rota] antes de concluir
```

---

## ⚙️ BACKEND DEV

**Quando ativar:** APIs, lógica de negócio, integrações

**Responsabilidades:**
- Criar API routes Next.js
- Queries Supabase otimizadas
- Regras de negócio
- Webhooks externos

**Prompt de ativação:**
```
[BACKEND] Implemente a lógica de [X]:
- Use app/lib/supabase.ts existente
- Crie em app/api/[endpoint]/route.ts
- Valide inputs antes de salvar
- Retorne erros claros
- Teste com dados reais do Supabase
```

---

## 🎨 UI DESIGNER

**Quando ativar:** refinamento visual, consistência

**Responsabilidades:**
- Garantir consistência visual
- Micro-interações e animações
- Estados de loading e erro
- Mobile first

**Prompt de ativação:**
```
[UI DESIGNER] Revise o visual de [página/componente]:
- Verificar consistência com identidade amber/dark
- Adicionar estados: loading, erro, vazio, sucesso
- Micro-animações suaves (transition-all 0.2s)
- Garantir que funciona em telas menores
- Comparar visualmente com o design do CRM existente
```

---

## 🧪 QA ENGINEER

**Quando ativar:** após cada módulo concluído

**Responsabilidades:**
- Testar todos os fluxos
- Verificar erros no console
- Validar build de produção
- Checar TypeScript

**Prompt de ativação:**
```
[QA] Valide o módulo [X] completo:
1. npm run build — deve passar sem erros
2. npx tsc --noEmit — zero erros TypeScript
3. Testar fluxo completo: criar → listar → editar → deletar
4. Verificar console do browser — zero erros
5. Testar com dados reais do Supabase
6. Reportar qualquer bug encontrado e corrigir
```

---

## 🚀 DEVOPS

**Quando ativar:** deploy, configuração de ambiente

**Responsabilidades:**
- Configurar variáveis de ambiente
- Deploy na Vercel
- Otimização de build
- Monitoramento

**Prompt de ativação:**
```
[DEVOPS] Configure o deploy do Excalibur:
1. Verificar .env.local com todas as variáveis
2. npm run build deve passar sem warnings
3. Configurar variáveis na Vercel
4. Deploy e validar URL de produção
5. Testar todas as páginas em produção
```

---

## 🤖 AUTOMAÇÃO

**Quando ativar:** fluxos WhatsApp, gatilhos, extensão

**Responsabilidades:**
- Fluxos de mensagens automáticas
- Sistema de delay (digitação simulada)
- Gatilhos por estágio do funil
- Integração extensão + sistema

**Prompt de ativação:**
```
[AUTOMAÇÃO] Implemente o fluxo [X]:
- Gatilho: [evento que dispara]
- Mensagens: [sequência com delays]
- Variáveis: #primeiroNome, #procedimento
- Delay de digitação: simular humano (3-8 segundos)
- Salvar histórico no Supabase
- Integrar com extensão Chrome
```

---

## 📊 DATA/BI

**Quando ativar:** dashboard, métricas, relatórios

**Responsabilidades:**
- Calcular KPIs do negócio
- Dashboard executivo
- Gráficos e visualizações
- Previsibilidade de faturamento

**Prompt de ativação:**
```
[DATA/BI] Implemente o dashboard de métricas:
Calcular a partir da tabela leads:
- Total leads / período
- Taxa de agendamento (Agendado / Total)
- Taxa de comparecimento (Compareceu / Agendado)
- Taxa de fechamento (Fechou / Compareceu)
- CAC estimado
- ROI por campanha
Usar gráficos simples com CSS/Tailwind primeiro,
depois evoluir para Recharts se necessário.
```
