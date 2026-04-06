import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hluhlsnodndpskrkbjuw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdWhsc25vZG5kcHNrcmtianV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTA4NzAsImV4cCI6MjA5MDkyNjg3MH0.uPF7TAuG26pF7jA3HAeeK5TArdBjzAmWXqZlq1XJsXw'

export const supabase = createClient(supabaseUrl, supabaseKey)