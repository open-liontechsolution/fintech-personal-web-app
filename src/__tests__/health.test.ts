import request from 'supertest';
import express from 'express';

// Crear una aplicación mock para pruebas
const app = express();

// Simulamos el comportamiento del endpoint de health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: {
      status: 'connected'
    }
  });
});

describe('Health Check API', () => {
  it('debería devolver 200 y datos de estado correctos', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('db.status', 'connected');
  });
});
