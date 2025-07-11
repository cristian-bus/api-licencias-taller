function validateLicense(licenseKey) {
    const validKey = "TALLERPRO-7DIAS-G6B6-ZXST";
    if (licenseKey.trim().toUpperCase() === validKey) {
        // La clave es correcta, ahora vemos la expiración
        const type = "7DIAS";
        let expirationDate = null;
        const today = new Date();

        switch (type) {
            case '7DIAS':
                expirationDate = new Date(new Date().setDate(today.getDate() + 7));
                break;
            case '30DIAS':
                expirationDate = new Date(new Date().setDate(today.getDate() + 30));
                break;
            case 'ANUAL':
                expirationDate = new Date(new Date().setFullYear(today.getFullYear() + 1));
                break;
            case 'LIFETIME':
                expirationDate = 'Nunca expira';
                break;
        }
        const isExpired = type !== 'LIFETIME' && (new Date() > expirationDate);
        
        if (isExpired) {
            return { isValid: false, error: 'La licencia ha expirado.' };
        } else {
            return { isValid: true, message: 'Licencia válida.' };
        }

    } else {
        return { isValid: false, error: 'La clave de licencia es incorrecta.' };
    }