import express from 'express';
import cors from 'cors';
import path from 'path';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware/viewAuthMiddleware';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import uploadRoutes from './routes/uploadRoutes';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import { setupSwagger } from './config/swagger';
import httpLogger from './middleware/httpLogger';
import logger from './config/logger';
import mongoDbService from './services/mongoDbService';
import rabbitMqService from './services/rabbitMqService';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware

// Logging HTTP requests
app.use(httpLogger);

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Cookie parser middleware

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) },
  useTempFiles: false  // Usar memoria en lugar de archivos temporales
}));

// Static files
app.use(express.static(path.join(__dirname, '../../src/public')));
console.log(`[Configuración] Directorio de archivos estáticos: ${path.join(__dirname, '../../src/public')}`);


// Views setup
app.set('view engine', 'ejs');
// Corregir la ruta para que coincida con donde se copian los archivos en Docker
app.set('views', path.join(__dirname, '../../src/views'));
console.log(`[Configuración] Directorio de vistas: ${path.join(__dirname, '../../src/views')}`);


// API routes
app.use('/api', apiRoutes);

// Upload routes (with auth middleware for view routes)
app.use('/upload', authMiddleware, uploadRoutes);

// Setup Swagger documentation
setupSwagger(app);

// Aplicar el middleware de autenticación SOLAMENTE a las rutas de vistas, no a archivos estáticos

// Frontend routes
// Ruta principal - página de inicio
app.get('/', authMiddleware, (req, res) => {
  res.render('index', { title: 'Inicio' });
});

// Rutas de autenticación
app.get('/login', authMiddleware, (req, res) => {
  res.render('login', { title: 'Iniciar Sesión' });
});

app.get('/register', authMiddleware, (req, res) => {
  res.render('register', { title: 'Registro' });
});

// Rutas de correo electrónico
app.get('/email-verified', authMiddleware, (req, res) => {
  res.render('email-verified', { title: 'Email Verificado' });
});

// Rutas protegidas
app.get('/dashboard', authMiddleware, (req, res) => {
  res.render('dashboard', { title: 'Dashboard' });
});

app.get('/accounts', authMiddleware, (req, res) => {
  res.render('accounts', { title: 'Cuentas Bancarias' });
});

app.get('/profile', authMiddleware, (req, res) => {
  res.render('profile', { title: 'Mi Perfil' });
});

app.get('/settings', authMiddleware, (req, res) => {
  res.render('settings', { title: 'Configuración' });
});

app.get('/transactions', authMiddleware, (req, res) => {
  res.render('transactions', { title: 'Transacciones' });
});

app.get('/accounts/:id', authMiddleware, (req, res) => {
  res.render('account-details', { title: 'Detalles de Cuenta', accountId: req.params.id });
});

app.get('/analytics', authMiddleware, (req, res) => {
  res.render('analytics', { title: 'Análisis' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
