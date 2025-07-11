// Ubicación: /api/licenses/validate.js
const jwt = require('jsonwebtoken');

// --- Clave Secreta para firmar JWT ---
const JWT_SECRET = process.env.JWT_SECRET || 'clave-super-secreta-para-produccion-cambiar-esto';

// --- Base de Datos Falsa de Licencias ---
// Ahora puedes definir diferentes tipos de licencias.
const validLicenses = {
  // Licencias Permanentes
  'TALLERPRO-VALIDA-1234-5678': { type: 'PRO_LIFETIME' },
  
  // Licencias Anuales
  'TALLERPRO-ANUAL-ABCD-EFGH': { type: 'PRO_YEARLY' },

  // Licencias de Prueba (Trials)
  'TRIAL-7-DIAS-EJEMPLO-123': { type: 'TRIAL_7_DAYS' },
  'TRIAL-7-DIAS-EJEMPLO-567': { type: 'TRIAL_7_DAYS' },
  'TRIAL-30-DIAS-EJEMPLO-456': { type: 'TRIAL_30_DAYS' },
};

// Esta es la función serverless que Vercel ejecutará.
module.exports = (req, res) => {
  // --- Configuración Manual de CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejo de la Petición Pre-vuelo (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo aceptamos peticiones POST.
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { licenseKey, uuid, domain } = req.body;

  if (!licenseKey || !uuid || !domain) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }
  
  const license = validLicenses[licenseKey];

  if (!license) {
    return res.status(404).json({ message: 'La clave de licencia no es válida.' });
  }
  
  // --- LÓGICA DE EXPIRACIÓN DINÁMICA ---
  let expiration;
  switch (license.type) {
    case 'TRIAL_7_DAYS':
      expiration = '7d';
      break;
    case 'TRIAL_30_DAYS':
      expiration = '30d';
      break;
    case 'PRO_YEARLY':
      expiration = '365d';
      break;
    case 'PRO_LIFETIME':
    default:
      expiration = '10y'; // "Vitalicia" se establece a 10 años
      break;
  }

  const tokenPayload = { uuid, domain, type: license.type };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: expiration });

  // En una base de datos real, aquí marcarías la clave como usada.
  // Para este ejemplo, no lo hacemos para que puedas probar las claves varias veces.

  return res.status(200).json({
    message: 'Licencia activada con éxito.',
    token,
  });
};
