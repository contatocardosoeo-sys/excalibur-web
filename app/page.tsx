'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha inválidos')
    } else {
      router.push('/dashboard')
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-md px-8">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">⚔️ Excalibur</h1>
          <p className="text-gray-400 mt-2 text-sm">Sistema Operacional Odontológico</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white text-xl font-semibold mb-6">Entrar na plataforma</h2>

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-3 rounded-lg transition mt-2"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-gray-500 text-xs text-center mt-6">
            Acesso restrito a clínicas parceiras Excalibur
          </p>
        </div>
      </div>
    </div>
  )
}
