#!/bin/bash
# setup-github.sh
# Configure o GitHub do Excalibur

echo "⚔️ Configurando GitHub do Excalibur..."

# Inicializar git se não existir
git init

# Configurar .gitignore
cat > .gitignore << EOF
node_modules/
.next/
.env.local
.env
*.log
.DS_Store
EOF

# Primeiro commit
git add .
git commit -m "chore: setup inicial do Excalibur"

echo "✅ Agora crie o repositório no GitHub:"
echo "1. Acesse https://github.com/new"
echo "2. Nome: excalibur-web"
echo "3. Privado"
echo "4. Sem README (já temos)"
echo ""
echo "Depois rode:"
echo "git remote add origin https://github.com/SEU-USUARIO/excalibur-web.git"
echo "git push -u origin main"
