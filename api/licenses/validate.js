// --- CÓDIGO DE DEPURACIÓN TEMPORAL ---
// El propósito de este código es únicamente verificar si las variables de entorno están configuradas correctamente en Vercel.

export default async function handler(req, res) {
  // --- Bloque para manejar CORS (Esencial para la comunicación) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder a la petición de sondeo del navegador
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- Verificación de Variables de Entorno ---
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const jwtSecret = process.env.JWT_SECRET;

    if (!upstashUrl) {
      console.error('ERROR CRÍTICO: La variable UPSTASH_REDIS_REST_URL no está definida o no es accesible.');
      return res.status(500).json({ message: 'Error de configuración: UPSTASH_REDIS_REST_URL no encontrada.' });
    }

    if (!upstashToken) {
      console.error('ERROR CRÍTICO: La variable UPSTASH_REDIS_REST_TOKEN no está definida o no es accesible.');
      return res.status(500).json({ message: 'Error de configuración: UPSTASH_REDIS_REST_TOKEN no encontrada.' });
    }

    if (!jwtSecret) {
      console.error('ERROR CRÍTICO: La variable JWT_SECRET no está definida o no es accesible.');
      return res.status(500).json({ message: 'Error de configuración: JWT_SECRET no encontrada.' });
    }

    // Si todas las variables existen, devolvemos un mensaje de éxito.
    // Esto nos confirma que la configuración de Vercel es correcta.
    return res.status(200).json({ 
      success: true, 
      message: '¡Éxito! Todas las variables de entorno fueron encontradas. El servidor está configurado correctamente.' 
    });

  } catch (error) {
    console.error('Error inesperado en el servidor:', error);
    return res.status(500).json({ message: 'Ha ocurrido un error inesperado en el servidor.' });
  }
}
