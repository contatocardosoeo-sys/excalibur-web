// lib/nav-clinica.ts — Navegacao excalibur-web (Plataforma Clinicas)

export type NavItem = { label: string; href: string; icon: string }
export type NavGroup = { grupo: string; items: NavItem[] }

export const NAV_CLINICA: NavGroup[] = [
  {
    grupo: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '📊' },
      { label: 'CRM WhatsApp', href: '/crm-whatsapp', icon: '💬' },
      { label: 'Leads / CRM', href: '/crm', icon: '👥' },
    ],
  },
  {
    grupo: 'Vendas',
    items: [
      { label: 'Oportunidades', href: '/oportunidades', icon: '🎯' },
      { label: 'Propostas', href: '/propostas', icon: '📄' },
      { label: 'Atividades', href: '/atividades', icon: '📋' },
      { label: 'Time Comercial', href: '/time-comercial', icon: '👔' },
      { label: 'Comissoes', href: '/comissoes', icon: '💎' },
      { label: 'Metas & OKRs', href: '/metas', icon: '🏆' },
    ],
  },
  {
    grupo: 'Clinica',
    items: [
      { label: 'Pacientes', href: '/pacientes', icon: '🦷' },
      { label: 'Agenda', href: '/agenda', icon: '📅' },
      { label: 'Financeiro', href: '/financeiro', icon: '💰' },
    ],
  },
  {
    grupo: 'Inteligencia',
    items: [
      { label: 'BI & Analise', href: '/bi', icon: '📊' },
      { label: 'Marketing', href: '/marketing', icon: '📈' },
    ],
  },
  {
    grupo: 'Recursos',
    items: [
      { label: 'Academia', href: '/academia', icon: '🎓' },
      { label: 'Extensao CRC', href: '/extensao', icon: '🔌' },
    ],
  },
]
