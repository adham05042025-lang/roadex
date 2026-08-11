import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aotuttyhdbcvgjowjbad.supabase.co'
const supabaseKey = 'sb_publishable_wj852PcCZ7NmBMLMq1cR-Q_5SoDJgeO'

export const supabase = createClient(supabaseUrl, supabaseKey)
