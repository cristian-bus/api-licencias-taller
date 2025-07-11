/**
 * Valida una clave de licencia y calcula su fecha de expiración.
 * @param {string} licenseKey - La clave de licencia a validar.
 * @returns {object} Un objeto con el estado de la validación y detalles.
 */
function validateLicense(licenseKey) {
    if (typeof licenseKey !== 'string' || !licenseKey) {
        return { isValid: false, error: 'La clave de licencia no puede estar vacía.' };
    }

    const parts = licenseKey.trim().toUpperCase().split('-');
    
    if (parts.length !== 4) {
        return { isValid: false, error: 'Formato de clave inválido. Se esperaban 4 partes.' };
    }

    const [prefix, type, part1, part2] = parts;

    if (prefix !== 'TALLERPRO') {
        return { isValid: false, error: 'Prefijo de clave inválido.' };
    }

    const validTypes = ['7DIAS', '30DIAS', 'ANUAL', 'LIFETIME'];
    if (!validTypes.includes(type)) {
        return { isValid: false, error: `Tipo de licencia desconocido: ${type}` };
    }
    
    const alphanumericRegex = /^[A-Z0-9]{4}$/;
    if (!alphanumericRegex.test(part1) || !alphanumericRegex.test(part2)) {
        return { isValid: false, error: 'Las secciones aleatorias de la clave son inválidas.' };
    }

    // Si todo es válido, calcula la fecha de expiración
    let expirationDate = null;
    const today = new Date();

    switch (type) {
        case '7DIAS':
            expirationDate = new Date(today.setDate(today.getDate() + 7));
            break;
        case '30DIAS':
            expirationDate = new Date(today.setDate(today.getDate() + 30));
            break;
        case 'ANUAL':
            expirationDate = new Date(today.setFullYear(today.getFullYear() + 1));
            break;
        case 'LIFETIME':
            expirationDate = 'Nunca expira';
            break;
    }
    
    // Comprueba si la licencia ha expirado (solo si no es LIFETIME)
    const isExpired = type !== 'LIFETIME' && (new Date() > expirationDate);

    return {
        isValid: true,
        isExpired: isExpired,
        type: type,
        expirationDate: expirationDate instanceof Date ? expirationDate.toISOString() : expirationDate,
        message: 'La licencia es válida.'
    };
}