import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Define las páginas que requieren o no autenticación
 */
export enum AuthRequirement {
  REQUIRED, // Usuario debe estar autenticado
  FORBIDDEN, // Usuario no debe estar autenticado (ej: login, register)
  OPTIONAL   // Se permite ambos estados (ej: landing page)
}

/**
 * Mapeo de rutas a sus requisitos de autenticación
 */
const PAGE_AUTH_REQUIREMENTS: Record<string, AuthRequirement> = {
  // Páginas que requieren autenticación
  '/dashboard': AuthRequirement.REQUIRED,
  '/profile': AuthRequirement.REQUIRED,
  '/transactions': AuthRequirement.REQUIRED,
  '/settings': AuthRequirement.REQUIRED,
  '/analytics': AuthRequirement.REQUIRED,
  '/accounts': AuthRequirement.REQUIRED,
  '/accounts/:id': AuthRequirement.REQUIRED,
  '/upload': AuthRequirement.REQUIRED,

  // Páginas que no permiten estar autenticado
  '/login': AuthRequirement.FORBIDDEN,
  '/register': AuthRequirement.FORBIDDEN, 
  '/forgot-password': AuthRequirement.FORBIDDEN,
  '/reset-password': AuthRequirement.FORBIDDEN,
  
  // Páginas que permiten ambos estados
  '/': AuthRequirement.OPTIONAL,
  '/email-verified': AuthRequirement.OPTIONAL,
  '/privacy-policy': AuthRequirement.OPTIONAL,
  '/terms-of-service': AuthRequirement.OPTIONAL
};

/**
 * Determina si un usuario está autenticado correctamente
 */
export const isAuthenticated = (req: Request): boolean => {
  try {
    const authToken = req.cookies.authToken;
    console.log(`[Auth Debug] Verificando token en cookies: ${authToken ? 'Presente' : 'Ausente'}`);
    
    if (!authToken) return false;
    
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    console.log(`[Auth Debug] Usuario autenticado: ${JSON.stringify(decoded)}`);
    return true;
  } catch (error: any) {
    // Token inválido o expirado
    console.log(`[Auth Debug] Error verificando token: ${error?.message || 'Error desconocido'}`);
    return false;
  }
};

/**
 * Middleware universal para manejar la autenticación en todas las rutas de vistas
 * Este middleware único se puede aplicar a todas las rutas frontend
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Determinar la ruta actual (sin query params)
  const currentPath = req.path;
  
  console.log(`[Auth Middleware] Ruta solicitada: ${currentPath}`);
  
  // Determinar requisito de auth para esta ruta
  const authRequirement = PAGE_AUTH_REQUIREMENTS[currentPath] ?? AuthRequirement.REQUIRED;
  console.log(`[Auth Middleware] Requisito de autenticación para ${currentPath}: ${AuthRequirement[authRequirement]}`);
  
  // Verificar el estado de autenticación actual
  const authenticated = isAuthenticated(req);
  console.log(`[Auth Middleware] Usuario autenticado: ${authenticated}`);
  
  // Limpiar token inválido si es necesario
  if (!authenticated && req.cookies.authToken) {
    console.log('[Auth Middleware] Limpiando cookie de token inválido');
    res.clearCookie('authToken');
  }

  // Actuar según los requisitos de la página y el estado de autenticación
  switch (authRequirement) {
    case AuthRequirement.REQUIRED:
      // La página requiere autenticación
      if (!authenticated) {
        console.log(`[Auth Middleware] Redirigiendo a /login desde ${currentPath} (requiere autenticación)`);
        return res.redirect('/login');
      }
      break;
      
    case AuthRequirement.FORBIDDEN:
      // La página no permite estar autenticado (ej: login)
      if (authenticated) {
        console.log(`[Auth Middleware] Redirigiendo a /dashboard desde ${currentPath} (no permite autenticación)`);
        return res.redirect('/dashboard');
      }
      break;
      
    case AuthRequirement.OPTIONAL:
      // La página permite ambos estados
      console.log(`[Auth Middleware] Acceso permitido a ${currentPath} (autenticación opcional)`);
      break;
  }
  
  // Establecer variables locales para las vistas
  res.locals.isAuthenticated = authenticated;
  res.locals.user = authenticated ? req.user : null;
  
  // Continuar con la solicitud
  console.log(`[Auth Middleware] Continuando a ${currentPath}`);
  next();
};

// Para compatibilidad con el código existente
export const requireViewAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (isAuthenticated(req)) {
    return next();
  }
  return res.redirect('/login');
};

export const redirectIfAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (isAuthenticated(req)) {
    return res.redirect('/dashboard');
  }
  next();
};
