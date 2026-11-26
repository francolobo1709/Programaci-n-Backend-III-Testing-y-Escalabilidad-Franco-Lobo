import express from 'express';
import { HTTP_STATUS } from './constants/index.js';
import productsRouter from './routes/products.router.js';
import usersRouter from './routes/users.router.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({ ok: true, service: 'shipnow-api' });
});

app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

export default app;
