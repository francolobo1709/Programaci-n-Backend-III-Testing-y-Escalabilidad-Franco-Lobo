import app from './app.js';
import { connectDatabase } from './config/db.config.js';
import { envConfig } from './config/env.config.js';

const startServer = async () => {
  await connectDatabase();

  app.listen(envConfig.port, () => {
    console.log(`[SERVER] ShipNow API escuchando en http://localhost:${envConfig.port}`);
  });
};

startServer();
