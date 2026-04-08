'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sections = [
  {
    grupo: 'Principal',
    items: [
      { href: '/dashboard', icon: '📊', label: 'Dashboard' },
      { href: '/funil', icon: '📋', label: 'Funil Diario' },
      { href: '/crm-whatsapp', icon: '💬', label: 'CRM WhatsApp' },
      { href: '/crm', icon: '👥', label: 'Leads / CRM' },
    ],
  },
  {
    grupo: 'Vendas',
    items: [
      { href: '/oportunidades', icon: '🎯', label: 'Oportunidades' },
      { href: '/propostas', icon: '📄', label: 'Propostas' },
      { href: '/atividades', icon: '📋', label: 'Atividades' },
      { href: '/time-comercial', icon: '👔', label: 'Time Comercial' },
      { href: '/comissoes', icon: '💎', label: 'Comissoes' },
      { href: '/metas', icon: '🏆', label: 'Metas & OKRs' },
    ],
  },
  {
    grupo: 'Clinica',
    items: [
      { href: '/pacientes', icon: '🦷', label: 'Pacientes' },
      { href: '/agenda', icon: '📅', label: 'Agenda' },
      { href: '/financeiro', icon: '💰', label: 'Financeiro' },
    ],
  },
  {
    grupo: 'Inteligencia',
    items: [
      { href: '/bi', icon: '📊', label: 'BI & Analise' },
      { href: '/marketing', icon: '📈', label: 'Marketing' },
    ],
  },
  {
    grupo: 'Recursos',
    items: [
      { href: '/academia', icon: '🎓', label: 'Academia' },
      { href: '/extensao', icon: '🔌', label: 'Extensao CRC' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg">⚔️ Excalibur</h1>
        <p className="text-gray-500 text-[10px] mt-0.5">Plataforma Odontologica</p>
      </div>

      <nav className="p-3 flex flex-col gap-0.5 flex-1 overflow-auto">
        {sections.map((section) => (
          <div key={section.grupo} className="mb-3">
            <p className="text-[9px] uppercase tracking-widest text-gray-600 font-semibold px-2 mb-1">{section.grupo}</p>
            {section.items.map(({ href, icon, label }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition ${
                  pathname === href || pathname?.startsWith(href + '/')
                    ? 'bg-amber-500 text-gray-950 font-semibold'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}>
                <span className="text-sm">{icon}</span> {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <p className="text-gray-600 text-[10px]">Excalibur v2.0</p>
      </div>
    </div>
  )
}
