
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { CONFIG } from './config.js'

const supabaseUrl = CONFIG.SUPABASE_URL
const supabaseKey = CONFIG.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
