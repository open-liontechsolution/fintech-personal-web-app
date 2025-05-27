/**
 * Main JavaScript file for Fintech Personal Web App
 */

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem('auth_token') !== null;
}

// Get current user from API
async function getCurrentUser() {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return null;
      }
      throw new Error('Error fetching user data');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Format currency
function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: currency 
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES').format(date);
}

// Handle API errors
function handleApiError(error) {
  console.error('API Error:', error);
  
  let errorMessage = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
  
  if (error.response && error.response.data && error.response.data.error) {
    errorMessage = error.response.data.error.message;
  }
  
  // You could display this in a toast or alert
  alert(errorMessage);
}

// Initialize tooltips and popovers if using Bootstrap
document.addEventListener('DOMContentLoaded', function() {
  // Check for protected routes
  const protectedRoutes = ['/dashboard', '/accounts', '/transactions', '/profile', '/settings'];
  const currentPath = window.location.pathname;
  
  if (protectedRoutes.includes(currentPath) && !isAuthenticated()) {
    window.location.href = '/login';
    return;
  }
  
  // Initialize Bootstrap tooltips if they exist
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  if (tooltipTriggerList.length > 0 && typeof bootstrap !== 'undefined') {
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Initialize Bootstrap popovers if they exist
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  if (popoverTriggerList.length > 0 && typeof bootstrap !== 'undefined') {
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  }
});
