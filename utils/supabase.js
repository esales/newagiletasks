
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  export const signInAnon = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) console.error('Erro ao fazer login anonimo:', error)
    else console.log('Login anonimo bem-sucedido:', data.user);

    return data.user;
  }
        