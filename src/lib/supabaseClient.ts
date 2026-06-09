import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tus variables de entorno.'
  );
}

const safeUrl = supabaseUrl && isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey);

