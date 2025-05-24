import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Reemplaza con tu URL y clave anónima de Supabase
    this.supabase = createClient('https://bumdjwymwrfxzmgmdgxr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bWRqd3ltd3JmeHptZ21kZ3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjk2OTMsImV4cCI6MjA2Mjc0NTY5M30.gli5gUqcXJiiKJCbKuVs5jpI5YYRt5fXm1nyKVgKnqc');
  }

  // Método para obtener datos de una tabla
  async getData() {
    const { data, error } = await this.supabase
      .from('your-table-name')
      .select('*');
    return { data, error };
  }

  

  // Puedes agregar más métodos para interactuar con Supabase aquí
}