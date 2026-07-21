import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uafvtbobfpuypekjitkj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3fE5c3Z9LtWhQ6xa76a3yg_e7m_-ctD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
