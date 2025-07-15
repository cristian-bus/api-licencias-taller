// Importamos las herramientas de Upstash Redis y JWT
import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

// Configura el cliente de Redis. Leerá las variables de entorno automáticamente.
const redis = Redis.fromEnv();

// Lista de licencias válidas. En un caso real, esto también podría venir de una base de datos.
const VALID_LICENSES = {
  'TALLERPRO-ANUAL-ABCD-EFGH': { type: 'ANUAL' },
  'TALLERPRO-MENSUAL-1234-5678': { type: 'MENSUAL' },
  // Puedes agregar más licencias aquí
};

export default async function handler(req, res) {
  // --- Bloque para manejar CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder a la petición de sondeo del navegador
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- Fin del bloque CORS ---

  // Solo permitir peticiones POST
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
      // Primera activación: Guardamos el UUID
      await redis.set(licenseKey, uuid);
      console.log(`Licencia ${licenseKey} activada por primera vez en el dispositivo ${uuid}.`);
    } else if (assignedUuid !== uuid) {
      // La licencia ya está asignada a otro dispositivo
      console.warn(`Intento de activación de la licencia ${licenseKey} en un nuevo dispositivo (${uuid}), pero ya está asignada a ${assignedUuid}.`);
      return res.status(409).json({ message: 'La licencia ya está en uso en otro dispositivo.' });
    }
    
    // Si llegamos aquí, la licencia es válida para este dispositivo.
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
