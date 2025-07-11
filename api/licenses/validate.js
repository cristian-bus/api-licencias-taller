// Ubicación: /api/licenses/validate.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave-super-secreta-para-produccion-cambiar-esto';

const validLicenses = {
  'TALLERPRO-VALIDA-1234-5678': { used: false, domain: null, type: 'PRO_LIFETIME' },
  'TALLERPRO-ANUAL-ABCD-EFGH': { used: false, domain: null, type: 'PRO_YEARLY' },
'TALLERPRO-AB7G4-K9P2R-1S8T3': { used: false, domain: null, type: 'PRO_YEARLY' },
};

module.exports = (req, res) => {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejo de la petición Pre-vuelo
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lógica principal
  if (req.method === 'POST') {
    console.log('Petición POST recibida en validate.js');
    const { licenseKey } = req.body;
    const license = validLicenses[licenseKey];

    if (license) {
      const token = jwt.sign({ type: license.type }, JWT_SECRET, { expiresIn: '365d' });
      return res.status(200).json({ message: 'Licencia activada con éxito.', token });
    } else {
      return res.status(404).json({ message: 'La clave de licencia no es válida.' });
    }
  }

  res.setHeader('Allow', ['POST', 'OPTIONS']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};

