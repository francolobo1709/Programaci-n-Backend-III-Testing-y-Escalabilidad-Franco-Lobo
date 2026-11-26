import dotenv from 'dotenv';
import { NODE_ENVIRONMENTS } from '../constants/index.js';

dotenv.config();

const REQUIRED_ENV_VARS = Object.freeze(['PORT', 'MONGODB_URI', 'NODE_ENV']);

for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName] || String(process.env[varName]).trim() === '') {
    throw new Error(
      `[ENV CONFIG ERROR] Falta la variable de entorno obligatoria: ${varName}. Revisa tu archivo .env o .env.example.`
    );
  }
}

const parsedPort = Number(process.env.PORT);
if (Number.isNaN(parsedPort) || parsedPort <= 0) {
  throw new Error(
    `[ENV CONFIG ERROR] PORT debe ser un número válido mayor que 0. Valor recibido: "${process.env.PORT}".`
  );
}

const allowedEnvs = Object.values(NODE_ENVIRONMENTS);
const normalizedNodeEnv = String(process.env.NODE_ENV).trim();
if (!allowedEnvs.includes(normalizedNodeEnv)) {
  throw new Error(
    `[ENV CONFIG ERROR] NODE_ENV inválido ("${normalizedNodeEnv}"). Valores permitidos: ${allowedEnvs.join(', ')}.`
  );
}

export const envConfig = Object.freeze({
  port: parsedPort,
  mongoUri: String(process.env.MONGODB_URI).trim(),
  nodeEnv: normalizedNodeEnv,
});

export default envConfig;
