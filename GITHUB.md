# ⚔️ EXCALIBUR — Padrões Git/GitHub

## Branch
- `main` → produção (auto-deploy Vercel)
- Nunca committar direto na main em time. Solo dev do CEO: ok.

## Commits (Conventional Commits)
```
feat(módulo): nova funcionalidade
fix(módulo): correção de bug
chore: tarefa de manutenção
docs: documentação
refactor(módulo): refatoração sem mudar comportamento
test(módulo): testes
```

## Tags Semânticas
- v0.1.0 → CRM + Dashboard ✅
- v0.2.0 → Extensão Chrome 🔄
- v0.3.0 → Pacientes
- v0.4.0 → Agenda
- v0.5.0 → Financeiro
- v0.6.0 → Marketing
- v0.7.0 → BI
- v0.8.0 → Academia
- v1.0.0 → MVP PRONTO

## Auto-save após cada STORY
```bash
npm run build && npx tsc --noEmit && npm run lint
git add .
git commit -m "feat(módulo): descrição"
git push origin main
```

## Remote
`origin`: https://github.com/contatocardosoeo-sys/excalibur-web.git
