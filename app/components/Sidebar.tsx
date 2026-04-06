'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/ceo', icon: '👑', label: 'CEO' },
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/crm', icon: '👥', label: 'Leads / CRM' },
  { href: '/pacientes', icon: '🦷', label: 'Pacientes' },
  { href: '/agenda', icon: '📅', label: 'Agenda' },
  { href: '/financeiro', icon: '💰', label: 'Financeiro' },
  { href: '/marketing', icon: '📈', label: 'Marketing' },
  { href: '/bi', icon: '📊', label: 'BI & Análise' },
  { href: '/academia', icon: '🎓', label: 'Academia' },
  { href: '/projeto', icon: '📋', label: 'Projeto' },
  { href: '/extensao', icon: '🔌', label: 'Extensão CRC' },
  { href: '/studio', icon: '🛠️', label: 'Studio' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-white font-bold text-xl">⚔️ Excalibur</h1>
        <p className="text-gray-500 text-xs mt-1">Sistema Operacional</p>
      </div>

      <nav className="p-4 flex flex-col gap-1 flex-1">
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? 'bg-amber-500 text-gray-950 font-semibold'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              {icon} {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-500 text-xs">Excalibur v0.4.0</p>
        <p className="text-gray-400 text-sm font-medium">⚔️ Sistema Operacional</p>
      </div>
    </div>
  )
}
