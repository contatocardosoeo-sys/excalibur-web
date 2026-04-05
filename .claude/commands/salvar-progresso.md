# Comando: /salvar-progresso
# Use após cada task concluída

Execute automaticamente:

1. Rode npm run build — se falhar, corrija antes de continuar
2. Rode npx tsc --noEmit — corrija erros TypeScript
3. Atualize PROGRESSO.md com o que foi feito hoje
4. Atualize STATUS.md marcando o módulo como concluído
5. Execute git add .
6. Execute git commit -m "feat([módulo]): [descrição do que foi feito]"
7. Execute git push origin main
8. Confirme que o push foi feito
9. Abra localhost:3000 no browser e tire screenshot
10. Reporte: ✅ SALVO | 📁 ARQUIVOS | 🔗 COMMIT | ➡️ PRÓXIMO
