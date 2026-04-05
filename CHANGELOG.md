# ⚔️ EXCALIBUR — Changelog

## [v1.0.0] — 2026-04-05 — MVP COMPLETO ⚔️

### Added
- 🦷 Módulo Pacientes (CRUD + 5 KPIs + busca universal + 4 filtros status + conversão lead→paciente)
- 📅 Módulo Agenda (CRUD + 5 status + busca de paciente + 5 KPIs + filtros hoje/semana)
- 💰 Excalibur Pay (simulador de juros + 5 status propostas + 5 KPIs financeiros)
- 📈 Marketing (CPL/CAC/ROI calculados + chart por procedimento)
- 📊 BI & Análise (funil de conversão + 5 KPIs + chart 14d + 4 períodos)
- 🎓 Academia (6 trilhas de treinamento)
- 🔌 Extensão Chrome CRC v0.2 (8 variáveis + histórico + cancel + mais usadas + filtros)

### Infrastructure
- Migration 001: tabela `pacientes` (13 campos, RLS, trigger updated_at)
- Migration 002: `agendamentos` + `propostas` + `metricas_diarias`
- `types/index.ts`, `lib/queries.ts`, `lib/utils.ts`
- Layout i18n: `lang="pt-BR"` + notranslate (bloqueia Chrome auto-translate)

### Research
- Estudo completo Nexus Atemporal (27 módulos mapeados via CDP)
- Análise WaSeller/PROSPECTA CRM (clone live + gap analysis)
- 54 screenshots + 2 docs de arquitetura

## [v0.1.0] — 2026-04-04
### Added
- Login + Auth (Supabase)
- Dashboard + Kanban de Leads
- Módulo CRM com funil 5 etapas
- Sidebar navegação 7 pilares
- Identidade visual dark + amber-500
- Extensão Chrome Excalibur CRC v1.0
