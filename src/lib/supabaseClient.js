import { createClient } from '@supabase/supabase-js';

// La configuración de Supabase debe leerse del entorno.
// Usaremos variables de entorno de Vite o fallbacks genéricos para prevenir errores si no existen temporalmente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
