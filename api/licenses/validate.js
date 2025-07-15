// --- CÓDIGO DE DEPURACIÓN AVANZADA ---
// Propósito: Forzar una conexión manual y registrar más detalles para encontrar el problema.

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

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Verificación explícita de las variables de entorno
  if (!url || !token) {
    console.error('ERROR DE CONFIGURACIÓN: UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN no están definidas en Vercel.');
    return res.status(500).json({ 
        message: 'Error de Configuración del Servidor. Una o más variables de Upstash no fueron encontradas.' 
    });
  }

  // 2. Log de diagnóstico (seguro, no expone las claves completas)
  console.log(`Intentando conectar a Upstash...`);
  console.log(`URL leída (primeros 15 caracteres): ${url.substring(0, 15)}...`);
  console.log(`Token leído (primeros 5 caracteres): ${token.substring(0, 5)}...`);

  try {
    // 3. Conexión manual y explícita en lugar de Redis.fromEnv()
    const redis = new Redis({
      url: url,
      token: token,
    });

    // 4. Enviamos el comando PING para probar la conexión
    const response = await redis.ping();

    // Si el PING es exitoso, la conexión funciona.
    return res.status(200).json({ 
        success: true, 
        message: `¡Conexión con Upstash exitosa! Respuesta del servidor: ${response}.`
    });

  } catch (error) {
    // Si el PING falla, las credenciales son incorrectas o hay un problema de red.
    console.error('ERROR DEFINITIVO DE CONEXIÓN A UPSTASH:', error);
    return res.status(500).json({ 
        message: 'Fallo la conexión con la base de datos. El servidor no pudo autenticarse con Upstash usando las credenciales provistas.',
        errorName: error.name,
        errorMessage: error.message 
    });
  }
}
