// --- CÓDIGO FINAL Y FUNCIONAL ---
// Propósito: Validar licencias, asignar un dispositivo por licencia y generar un token de sesión.

import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

// Lista de licencias válidas que tu sistema reconocerá.
const VALID_LICENSES = {
  'TALLERPRO-ANUAL-ABCD-EFGH': { type: 'ANUAL' },
  'TALLERPRO-ANUAL-ABCD-1212': { type: 'PRUEBA' },
  'TALLERPRO-MENSUAL-1234-5678': { type: 'MENSUAL' },
  'TALLERPRO-GUSTAVO-RAJOY-2107': { type: 'MENSUAL' },
  'TALLERPRO-GUSTAVO-LEUIZAMON-2207': { type: 'MENSUAL' },
  'TALLERPRO-ELIAS-VEGA-2207': { type: 'MENSUAL' },
  'TALLERPRO-ANUAL-JUAN-PEREZ': { type: 'ANUAL' },
  'TALLERPRO-ANUAL-JUAN-CHO': { type: 'ANUAL' },
  // --- INICIO: NUEVA LICENCIA DE PRUEBA ---
  // Agregamos una nueva clave de licencia con el tipo 'PRUEBA'.
  // Puedes cambiar 'PRUEBA-7DIAS-GRATIS' por la clave que prefieras.
  'TALLERPRO-PRUEBA-7DIAS-GRATIS': { type: 'PRUEBA' },
  // --- FIN: NUEVA LICENCIA DE PRUEBA ---
};

export default async function handler(req, res) {
  // --- Bloque para manejar CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- Fin del bloque CORS ---

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

  // Verificamos que las variables de entorno existan antes de usarlas.
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;

  if (!url || !token || !jwtSecret) {
      console.error('ERROR DE CONFIGURACIÓN: Faltan una o más variables de entorno en Vercel.');
      return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }

  try {
    // Usamos el método de conexión explícito para máxima fiabilidad.
    const redis = new Redis({
      url: url,
      token: token,
    });

    const assignedUuid = await redis.get(licenseKey);

    if (!assignedUuid) {
      // Primera activación: Guardamos el UUID del dispositivo.
      await redis.set(licenseKey, uuid);
      console.log(`Licencia ${licenseKey} activada por primera vez en el dispositivo ${uuid}.`);
    } else if (assignedUuid !== uuid) {
      // La licencia ya está asignada a otro dispositivo.
      console.warn(`Intento de activación de la licencia ${licenseKey} en un nuevo dispositivo (${uuid}), pero ya está asignada a ${assignedUuid}.`);
      return res.status(409).json({ message: 'La licencia ya está en uso en otro dispositivo.' });
    }
    
    // Si llegamos aquí, la licencia es válida para este dispositivo.
    const licenseDetails = VALID_LICENSES[licenseKey];
    
    // --- INICIO: LÓGICA DE EXPIRACIÓN MEJORADA ---
    // Ahora, la duración depende del tipo de licencia.
    let expiration;
    switch (licenseDetails.type) {
        case 'ANUAL':
            expiration = '365d';
            break;
        case 'MENSUAL':
            expiration = '30d';
            break;
        case 'PRUEBA':
            expiration = '7d'; // ¡Aquí definimos la duración de 7 días!
            break;
        default:
            // Por seguridad, si el tipo no se reconoce, no se activa.
            return res.status(400).json({ message: 'Tipo de licencia desconocido.' });
    }
    // --- FIN: LÓGICA DE EXPIRACIÓN MEJORADA ---

    const sessionToken = jwt.sign(
      { 
        licenseKey: licenseKey,
        type: licenseDetails.type,
        uuid: uuid
      },
      jwtSecret,
      { expiresIn: expiration }
    );

    return res.status(200).json({ message: 'Licencia validada con éxito.', token: sessionToken });

  } catch (error) {
    console.error('Error durante la validación de la licencia con Upstash:', error);
    return res.status(500).json({ message: 'Error interno del servidor durante la validación.' });
  }
}
