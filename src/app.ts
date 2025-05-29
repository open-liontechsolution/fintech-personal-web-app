import express from 'express';
import cors from 'cors';
import path from 'path';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import { setupSwagger } from './config/swagger';
import httpLogger from './middleware/httpLogger';
import logger from './config/logger';

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

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) },
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Views setup
app.set('view engine', 'ejs');
// Corregir la ruta para que coincida con donde se copian los archivos en Docker
app.set('views', path.join(__dirname, '../../src/views'));

// API routes
app.use('/api', apiRoutes);

// Setup Swagger documentation
setupSwagger(app);

// Frontend routes
app.get('/', (req, res) => {
  res.render('dashboard');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
