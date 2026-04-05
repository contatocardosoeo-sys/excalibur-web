// ⚔️ Excalibur — Queries reutilizáveis Supabase
import { supabase } from '../app/lib/supabase'
import type { Lead, Paciente, Agendamento, Proposta } from '../types'

// Leads
export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateLeadEtapa(id: string, etapa: string) {
  const { error } = await supabase.from('leads').update({ etapa }).eq('id', id)
  if (error) throw error
}

// Pacientes
export async function getPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPaciente(
  p: Omit<Paciente, 'id' | 'created_at'>
): Promise<Paciente> {
  const { data, error } = await supabase
    .from('pacientes')
    .insert(p)
    .select()
    .single()
  if (error) throw error
  return data
}

// Agendamentos
export async function getAgendamentos(): Promise<Agendamento[]> {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .order('data', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Propostas
export async function getPropostas(): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from('propostas')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
