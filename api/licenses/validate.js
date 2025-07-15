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
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { licenseKey, uuid } = req.body;

  // Validaciones básicas de la entrada
  if (!licenseKey || !uuid) {
    return res.status(400).json({ message: 'Faltan la clave de licencia o el ID del dispositivo.' });
  }

  // 1. Verificar si la clave de licencia es válida en nuestra lista
  if (!VALID_LICENSES[licenseKey]) {
    return res.status(404).json({ message: 'La clave de licencia no es válida.' });
  }

  try {
    // 2. Consultar en Upstash si la licencia ya tiene un dispositivo asignado
    const assignedUuid = await redis.get(licenseKey);

    // 3. Lógica de asignación de dispositivo
    // Caso A: La licencia no tiene ningún dispositivo asignado
    if (!assignedUuid) {
      // "Casamos" la licencia con el UUID del dispositivo actual.
      await redis.set(licenseKey, uuid);
      
      console.log(`Licencia ${licenseKey} activada por primera vez en el dispositivo ${uuid}.`);

    // Caso B: La licencia ya tiene un UUID asignado. Verificamos si coincide.
    } else if (assignedUuid !== uuid) {
      // Si el UUID de la base de datos NO coincide con el que intenta activar, rechazamos.
      console.warn(`Intento de activación de la licencia ${licenseKey} en un nuevo dispositivo (${uuid}), pero ya está asignada a ${assignedUuid}.`);
      return res.status(409).json({ message: 'La licencia ya está en uso en otro dispositivo.' });
    }
    
    // Si llegamos aquí, es porque la licencia es válida y el UUID coincide (o era la primera activación).
    // Procedemos a crear el token de sesión.
    const licenseDetails = VALID_LICENSES[licenseKey];
    const expiration = licenseDetails.type === 'ANUAL' ? '365d' : '30d';
    const token = jwt.sign(
      { 
        licenseKey: licenseKey,
        type: licenseDetails.type,
        uuid: uuid
      },
      process.env.JWT_SECRET, // ¡IMPORTANTE! Debes configurar esta variable en Vercel
      { expiresIn: expiration }
    );

    return res.status(200).json({ message: 'Licencia validada con éxito.', token });

  } catch (error) {
    console.error('Error en la validación de la licencia con Upstash:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
