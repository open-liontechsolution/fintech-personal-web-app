/**
 * Script unificado para la autenticación del cliente
 * 
 * Este script maneja:
 * 1. La sincronización entre JWT cookie y localStorage
 * 2. La gestión del token para llamadas API
 * 3. La funcionalidad de logout
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth unified script loaded');
  
  // CONFIGURACIÓN DEL LOGOUT
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      doLogout();
    });
  }
  
  /**
   * Función para cerrar sesión (accesible globalmente)
   */
  window.doLogout = function() {
    console.log('Cerrando sesión...');
    
    // Llamar al endpoint de logout para eliminar la cookie
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    })
    .finally(() => {
      // Limpiar localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redireccionar a login (el servidor ya gestionará las cookies)
      window.location.href = '/login';
    });
    
    return false;
  };
  
  /**
   * Sincronizar token para llamadas API
   * 
   * Este código garantiza que cuando se ha iniciado sesión con una cookie,
   * el token también esté disponible en localStorage para llamadas API
   */
  const syncTokenForApiCalls = async () => {
    try {
      console.log('Iniciando sincronización del token...');
      
      // Paso 1: Intentar obtener el token directamente desde el endpoint /api/auth/token
      // Este endpoint siempre devuelve 200 con campo authenticated=true/false
      const tokenResponse = await fetch('/api/auth/token');
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        console.log('Respuesta del servidor:', tokenData);
        
        if (tokenData && tokenData.authenticated === true && tokenData.token) {
          // El usuario está autenticado y tenemos un token válido
          localStorage.setItem('auth_token', tokenData.token);
          localStorage.setItem('token', tokenData.token); // Para compatibilidad con código existente
          
          console.log('Token obtenido y almacenado correctamente');
          
          // Guardar datos del usuario si están disponibles
          if (tokenData.user) {
            localStorage.setItem('user', JSON.stringify(tokenData.user));
            console.log('Datos del usuario sincronizados directamente desde token');
            return; // Sincronización exitosa
          }
          
          // Si no tenemos datos completos del usuario, intentar obtenerlos con /api/auth/me
          try {
            const userResponse = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${tokenData.token}`
              }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData && userData.user) {
                localStorage.setItem('user', JSON.stringify(userData.user));
                console.log('Datos del usuario sincronizados desde /api/auth/me');
              }
            }
          } catch (userError) {
            console.warn('No se pudieron obtener datos adicionales del usuario:', userError);
            // Continuamos aunque haya error, ya tenemos el token
          }
          
          return; // Sincronización exitosa con el token
        } else {
          // Si llegamos aquí es que no hay sesión activa válida
          console.log(`No hay sesión activa: ${tokenData.message || 'Razón desconocida'}`);
        }
      } else {
        console.error('Error al verificar autenticación:', tokenResponse.status);
      }
      
      // Limpiar localStorage si no hay sesión válida
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
    } catch (error) {
      console.error('Error sincronizando token:', error);
    }
  };
  
  // Ejecutar la sincronización al cargar la página
  syncTokenForApiCalls();
});
