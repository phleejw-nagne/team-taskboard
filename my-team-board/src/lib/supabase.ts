import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// export 키워드가 반드시 있어야 App.tsx에서 가져다 쓸 수 있습니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);