// --- CÓDIGO DE DEPURACIÓN FINAL ---
// Propósito: Probar exclusivamente la conexión con la base de datos de Upstash.

import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  // --- Bloque para manejar CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- Fin del bloque CORS ---

  // Verificamos que las variables de entorno existan para dar un error más claro si faltan.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('ERROR DE CONFIGURACIÓN: Una o ambas variables de Upstash no están definidas en Vercel.');
    return res.status(500).json({ 
        message: 'Error de Configuración del Servidor. Revisa que UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN existan en las Environment Variables de tu proyecto en Vercel.' 
    });
  }

  try {
    // Intentamos crear el cliente y enviar un comando PING.
    const redis = Redis.fromEnv();
    const response = await redis.ping();

    // Si el PING es exitoso, la conexión funciona.
    return res.status(200).json({ 
        success: true, 
        message: `¡Conexión con Upstash exitosa! Respuesta del servidor: ${response}. Ahora puedes restaurar el código final de validate.js.`
    });

  } catch (error) {
    // Si el PING falla, significa que las credenciales son incorrectas.
    console.error('ERROR DE CONEXIÓN A UPSTASH:', error);
    return res.status(500).json({ 
        message: 'Fallo la conexión con la base de datos. Por favor, verifica que los valores de UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN en Vercel sean correctos y vuelve a desplegar.',
        error: error.message 
    });
  }
}
