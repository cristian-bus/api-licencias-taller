// Ubicación de este archivo: /api/test.js
// Este archivo es solo para verificar si las funciones de Vercel se están ejecutando.

module.exports = (req, res) => {
  // Respondemos con un estado 200 (OK) y un mensaje JSON simple.
  res.status(200).json({
    message: "El endpoint de prueba funciona correctamente!",
    timestamp: new Date().toISOString(),
  });
};
