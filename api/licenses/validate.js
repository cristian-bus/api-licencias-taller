// Importamos las herramientas de Upstash Redis y JWT
import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

// Lista de licencias válidas. En un caso real, esto también podría venir de una base de datos.
const VALID_LICENSES = {
  'TALLERPRO-ANUAL-ABCD-EFGH': { type: 'ANUAL' },
  'TALLERPRO-MENSUAL-1234-5678': { type: 'MENSUAL' },
};

export default async function handler(req, res) {
  // --- INICIO: Verificación de Variables de Entorno ---
  // Este bloque comprueba que las claves secretas estén configuradas en Vercel.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Error de configuración: Faltan las variables de entorno de Upstash Redis.');
    return res.status(500).json({ message: 'Error de configuración del servidor (BD). Revisa las variables de entorno.' });
  }
  if (!process.env.JWT_SECRET) {
    console.error('Error de configuración: Falta la variable de entorno JWT_SECRET.');
    return res.status(500).json({ message: 'Error de configuración del servidor (JWT). Revisa las variables de entorno.' });
  }
  // --- FIN: Verificación ---

  // Configura el cliente de Redis solo después de verificar que las variables existen.
  const redis = Redis.fromEnv();

  // --- INICIO: Bloque para manejar CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- FIN: Bloque para manejar CORS ---

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { licenseKey, uuid } = req.body;

  if (!licenseKey || !uuid) {
    return res.status(400).json({ message: 'Faltan la clave de licencia o el ID del dispositivo.' });
  }

  if (!VALID_LICENSES[licenseKey]) {
    return res.status(404).json({ message: 'La clave de licencia no es válida.' });
  }

  try {
    const assignedUuid = await redis.get(licenseKey);

    if (!assignedUuid) {
      const expirationInSeconds = VALID_LICENSES[licenseKey].type === 'ANUAL' ? 31536000 : 2592000;
      await redis.set(licenseKey, uuid, { ex: expirationInSeconds });
      console.log(`Licencia ${licenseKey} activada por primera vez en el dispositivo ${uuid}.`);
    } else if (assignedUuid !== uuid) {
      console.warn(`Intento de activación de la licencia ${licenseKey} en un nuevo dispositivo (${uuid}), pero ya está asignada a ${assignedUuid}.`);
      return res.status(409).json({ message: 'La licencia ya está en uso en otro dispositivo.' });
    }
    
    const licenseDetails = VALID_LICENSES[licenseKey];
    const expiration = licenseDetails.type === 'ANUAL' ? '365d' : '30d';
    const token = jwt.sign(
      { 
        licenseKey: licenseKey,
        type: licenseDetails.type,
        uuid: uuid
      },
      process.env.JWT_SECRET,
      { expiresIn: expiration }
    );

    return res.status(200).json({ message: 'Licencia validada con éxito.', token });

  } catch (error) {
    console.error('Error en la validación de la licencia con Upstash:', error);
    return res.status(500).json({ message: 'Error interno del servidor durante la validación.' });
  }
}
