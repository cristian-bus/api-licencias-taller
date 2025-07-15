// --- CÓDIGO DE DEPURACIÓN AVANZADA ---
// Propósito: Mostrar las variables de entorno que Vercel está leyendo.

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
  const jwtSecret = process.env.JWT_SECRET;

  const responsePayload = {
    message: 'Resultado de la verificación de variables de entorno:',
    variables: {
      UPSTASH_REDIS_REST_URL_exists: !!url,
      UPSTASH_REDIS_REST_URL_value: `Inicia con: ${url ? url.substring(0, 20) : 'N/A'}...`,
      UPSTASH_REDIS_REST_TOKEN_exists: !!token,
      UPSTASH_REDIS_REST_TOKEN_value: `Inicia con: ${token ? token.substring(0, 8) : 'N/A'}...`,
      JWT_SECRET_exists: !!jwtSecret,
      JWT_SECRET_value: `Inicia con: ${jwtSecret ? jwtSecret.substring(0, 5) : 'N/A'}...`,
    }
  };

  // Si alguna variable falta, lo indicamos en la consola del servidor para un registro más claro.
  if (!url || !token || !jwtSecret) {
    console.error("Una o más variables de entorno no fueron encontradas:", responsePayload.variables);
    return res.status(500).json(responsePayload);
  }

  // Si todas existen, devolvemos la información para confirmación visual.
  return res.status(200).json(responsePayload);
}
