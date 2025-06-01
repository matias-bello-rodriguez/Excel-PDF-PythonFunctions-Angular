// Prueba de solución para NavigatorLockAcquireTimeoutError en Supabase
// Este script simula una situación donde se crea un cliente Supabase
// y se intenta resolver el error NavigatorLockAcquireTimeoutError

// Importación simulada
const { createClient } = require('@supabase/supabase-js');

// Configuración simulada
const supabaseUrl = 'https://ejemplo.supabase.co';
const supabaseKey = 'clave-ejemplo';

// Función para limpiar almacenamiento
function clearAuthStorage() {
  console.log('Limpiando almacenamiento de autenticación...');
  try {
    // Limpiar localStorage
    localStorage.removeItem('app-kinetta-auth');
    localStorage.removeItem('supabase.auth.token');
    
    // Limpiar todas las claves relacionadas con supabase
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('-auth-token') ||
          key.includes('kinetta') ||
          key.includes('auth')
      )) {
        console.log('Eliminando clave:', key);
        localStorage.removeItem(key);
        // Reiniciar el índice para evitar problemas al modificar la colección
        i--;
      }
    }
    
    // Intentar eliminar las cookies relacionadas con supabase
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && (
          name.includes('supabase') || 
          name.includes('sb-') || 
          name.includes('auth') ||
          name.includes('kinetta')
      )) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  } catch (error) {
    console.error('Error al limpiar almacenamiento:', error);
  }
}

// Función para inicializar cliente Supabase con manejo de errores
async function initializeSupabaseClient() {
  try {
    console.log('Inicializando cliente Supabase...');
    
    // Comprobar si hay tokens problemáticos previos
    const hasProblematicTokens = localStorage.getItem('app-kinetta-auth') || 
                                localStorage.getItem('supabase.auth.token');
    
    // Si hay tokens que podrían ser problemáticos, limpiarlos primero
    if (hasProblematicTokens) {
      console.log('Tokens previos encontrados, limpiando antes de inicializar...');
      clearAuthStorage();
    }
    
    // Crear un id único para el storage para evitar conflictos
    const uniqueStorageKey = 'app-kinetta-auth-' + Date.now();
    
    // Crear cliente con opciones mejoradas
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: uniqueStorageKey,
          flowType: 'pkce', // Usar PKCE para mayor seguridad
          storage: {
            getItem: (key) => {
              try {
                return localStorage.getItem(key);
              } catch (error) {
                console.error('Error al obtener item:', error);
                return null;
              }
            },
            setItem: (key, value) => {
              try {
                localStorage.setItem(key, value);
              } catch (error) {
                console.error('Error al guardar item:', error);
              }
            },
            removeItem: (key) => {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                console.error('Error al eliminar item:', error);
              }
            }
          }
        },
        global: {
          fetch: async (url, options) => {
            try {
              return await fetch(url, options);
            } catch (error) {
              console.error('Error en fetch:', error);
              throw error;
            }
          }
        }
      }
    );
    
    return supabase;
  } catch (error) {
    console.error('Error al inicializar Supabase:', error);
    clearAuthStorage();
    throw error;
  }
}

// Función de prueba para simular un inicio de sesión con manejo de errores
async function testSignIn(email, password) {
  let supabase;
  
  try {
    // Inicializar cliente
    supabase = await initializeSupabaseClient();
    
    // Simular inicio de sesión
    console.log('Intentando iniciar sesión para:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      throw error;
    }
    
    console.log('Inicio de sesión exitoso:', data.user);
    return data.user;
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    
    // Manejo de errores específicos
    if (error.message && (
        error.message.includes('lock') || 
        error.message.includes('timeout') || 
        error.message.includes('Navigator') ||
        error.message.includes('acquire')
    )) {
      console.log('Error de bloqueo/navegador detectado, limpiando almacenamiento...');
      clearAuthStorage();
      
      // Esperar un momento antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reintentar inicialización
      supabase = await initializeSupabaseClient();
      
      // Reintentar inicio de sesión
      try {
        console.log('Reintentando inicio de sesión después de error de bloqueo...');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          throw error;
        }
        
        console.log('Reintento de inicio de sesión exitoso:', data.user);
        return data.user;
      } catch (retryError) {
        console.error('Error en reintento de inicio de sesión:', retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
}

// Función principal de prueba
async function main() {
  try {
    const user = await testSignIn('usuario@ejemplo.com', 'contraseña123');
    console.log('Prueba completada con éxito, usuario:', user);
  } catch (error) {
    console.error('Error en prueba:', error);
  }
}

// Ejecutar prueba
main();
