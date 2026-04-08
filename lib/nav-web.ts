// lib/nav-web.ts — Navegacao excalibur-web (plataforma clinicas)

export const NAV_WEB = [
  {
    grupo: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '📊' },
      { label: 'Funil Diario', href: '/funil', icon: '📋' },
      { label: 'CRM WhatsApp', href: '/crm-whatsapp', icon: '💬' },
      { label: 'Pacientes', href: '/pacientes', icon: '🦷' },
      { label: 'Agenda', href: '/agenda', icon: '📅' },
    ]
  },
  {
    grupo: 'Financeiro',
    items: [
      { label: 'Financeiro', href: '/financeiro', icon: '💰' },
      { label: 'Propostas', href: '/propostas', icon: '📋' },
    ]
  },
  {
    grupo: 'Inteligencia',
    items: [
      { label: 'BI & Metricas', href: '/bi', icon: '📈' },
      { label: 'Marketing', href: '/marketing', icon: '📣' },
    ]
  },
  {
    grupo: 'Configuracoes',
    items: [
      { label: 'Academia', href: '/academia', icon: '🎓' },
    ]
  },
]
