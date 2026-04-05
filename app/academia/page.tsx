'use client'

import Sidebar from '../components/Sidebar'

const TRILHAS = [
  { id: 1, nome: 'Recepção Excalibur', aulas: 8, duracao: '2h 15min', cor: 'from-amber-600 to-amber-400', descricao: 'Do primeiro "oi" ao agendamento confirmado' },
  { id: 2, nome: 'Mapeamento de Leads', aulas: 6, duracao: '1h 30min', cor: 'from-blue-600 to-blue-400', descricao: 'Qualifique e entenda a dor do paciente' },
  { id: 3, nome: 'Fechamento & Vendas', aulas: 10, duracao: '3h 10min', cor: 'from-green-600 to-green-400', descricao: 'Técnicas de fechamento para clínicas' },
  { id: 4, nome: 'Recuperação de No-Show', aulas: 5, duracao: '1h 20min', cor: 'from-red-600 to-red-400', descricao: 'Resgate pacientes que não compareceram' },
  { id: 5, nome: 'Pós-venda & Indicação', aulas: 7, duracao: '2h 00min', cor: 'from-purple-600 to-purple-400', descricao: 'Transforme pacientes em promotores' },
  { id: 6, nome: 'Excalibur Pay na prática', aulas: 4, duracao: '45min', cor: 'from-amber-500 to-yellow-400', descricao: 'Use a mesa de crédito para fechar mais' },
]

export default function AcademiaPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">🎓 Academia Excalibur</h1>
          <p className="text-gray-400 text-sm mt-1">Trilhas de treinamento, playbooks e scripts para clínicas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TRILHAS.map((t) => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 hover:border-amber-600/40 rounded-xl overflow-hidden group cursor-pointer transition">
              <div className={`h-24 bg-gradient-to-br ${t.cor} relative`}>
                <span className="absolute bottom-2 right-3 text-white/90 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded-full">{t.aulas} aulas</span>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-amber-400 transition">{t.nome}</h3>
                <p className="text-gray-500 text-xs mb-3">{t.descricao}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600">⏱ {t.duracao}</span>
                  <span className="text-amber-400 font-medium">0% concluído</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Em breve: vídeos, playbooks em PDF, quizzes e certificados.</p>
          <p className="text-gray-600 text-xs">Sugira trilhas para sua equipe em <span className="text-amber-400">contato@excalibur.com</span></p>
        </div>
      </div>
    </div>
  )
}
