import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  supabaseUrl: 'https://bumdjwymwrfxzmgmdgxr.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bWRqd3ltd3JmeHptZ21kZ3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjk2OTMsImV4cCI6MjA2Mjc0NTY5M30.gli5gUqcXJiiKJCbKuVs5jpI5YYRt5fXm1nyKVgKnqc',
};

// Crear y exportar el cliente de Supabase
export const supabase = createClient(
  supabaseConfig.supabaseUrl,
  supabaseConfig.supabaseKey
);
