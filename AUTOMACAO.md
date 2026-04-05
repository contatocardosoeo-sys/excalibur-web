# ⚔️ EXCALIBUR — AUTOMAÇÃO DE PROJETO
# Regras que o Claude DEVE seguir automaticamente

---

## 🔄 APÓS CADA TASK CONCLUÍDA — CHECKLIST OBRIGATÓRIO

O Claude executa isso automaticamente sem que o CEO precise pedir:

```bash
# 1. Verificar se build passa
npm run build

# 2. Verificar TypeScript
npx tsc --noEmit

# 3. Commit com mensagem padronizada
git add .
git commit -m "feat(módulo): descrição do que foi feito"

# 4. Push para GitHub
git push origin main

# 5. Atualizar PROGRESSO.md
# 6. Atualizar STATUS.md
# 7. Screenshot do resultado no browser
```

---

## 📝 PADRÃO DE COMMIT OBRIGATÓRIO

```
feat(crm): adiciona filtro por procedimento
fix(extensao): corrige delay de digitação
style(dashboard): ajusta cores do kanban
docs(readme): atualiza instruções de instalação
refactor(auth): simplifica fluxo de login
```

Tipos: feat | fix | style | docs | refactor | test | chore

---

## 📊 ATUALIZAÇÃO DE DOCUMENTOS

Após cada task, o Claude atualiza automaticamente:

### PROGRESSO.md
```markdown
## [DATA] — Task concluída
- Módulo: [nome]
- O que foi feito: [descrição]
- Arquivos criados/modificados: [lista]
- Como testar: [URL ou passos]
- Próximo: [próxima task]
```

### STATUS.md
```markdown
| Módulo | Status | Última atualização |
|--------|--------|-------------------|
| Login | ✅ | 2026-04-05 |
| CRM | ✅ | 2026-04-05 |
| Extensão | ✅ | 2026-04-05 |
| Pacientes | 🔄 | 2026-04-05 |
```

---

## 🐙 REGRAS DE GIT

```bash
# Branch principal
main — sempre funcionando, nunca quebrado

# Nunca commitar diretamente na main sem build passando
# Mensagem de commit sempre em português
# Push após cada task concluída
# Tag de versão a cada módulo completo:
git tag -a v1.0-crm -m "CRM completo"
git tag -a v1.1-extensao -m "Extensão Chrome completa"
```

---

## ☁️ DEPLOY AUTOMÁTICO

```bash
# Após cada push na main, Vercel faz deploy automático
# URL de produção: excalibur.vercel.app
# Verificar deploy após cada push
# Se falhar: corrigir antes de continuar próxima task
```

---

## 🔒 BACKUP DE SEGURANÇA

```bash
# A cada módulo concluído:
# 1. Tag no GitHub com versão
# 2. Export do banco Supabase
# 3. Screenshot de todas as telas
# 4. Atualizar CHANGELOG.md
```
