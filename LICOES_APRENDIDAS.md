# ⚔️ EXCALIBUR — Lições Aprendidas

Registro de erros, causa raiz, correção e aprendizado.

## Template
```
### [DATA] — Tópico
**Erro:** [o que aconteceu]
**Causa raiz:** [por quê]
**Correção:** [como resolvemos]
**Aprendizado:** [aplicar daqui em diante]
```

---

## 2026-04-05 — GitHub push sem credential helper
**Erro:** `git push -u origin main` travou pedindo credenciais interativas.
**Causa raiz:** Ambiente sem credential helper configurado; gh CLI não instalado.
**Correção:** Pendente — precisa Personal Access Token do CEO.
**Aprendizado:** Em nova máquina, verificar `git config credential.helper` antes de assumir que push funciona.
