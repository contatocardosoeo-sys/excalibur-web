#!/bin/bash
# ⚔️ Excalibur — Inicialização Completa
# Roda web + HEAD autônomo + N8N (se instalado)

echo "⚔️ Excalibur — Iniciando todos os sistemas..."
echo ""

# 1. Sistema Web (Next.js)
echo "[1/3] Iniciando Next.js dev server..."
npm run dev &
WEB_PID=$!

# 2. HEAD Autônomo (loop de monitoramento)
echo "[2/3] Iniciando HEAD Autônomo..."
npm run head &
HEAD_PID=$!

# 3. N8N (se instalado)
if command -v n8n &> /dev/null; then
  echo "[3/3] Iniciando N8N..."
  n8n start &
  N8N_PID=$!
  echo "   N8N: http://localhost:5678"
else
  echo "[3/3] N8N não instalado (npm install -g n8n para ativar)"
  N8N_PID=""
fi

echo ""
echo "⚔️ Excalibur rodando:"
echo "   Web:  http://localhost:3000"
echo "   CEO:  http://localhost:3000/ceo"
echo "   HEAD: loop autônomo a cada 5min"
if [ -n "$N8N_PID" ]; then
  echo "   N8N:  http://localhost:5678"
fi
echo ""
echo "Ctrl+C para parar tudo."

# Esperar qualquer processo morrer
wait $WEB_PID $HEAD_PID $N8N_PID
