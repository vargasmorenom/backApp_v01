// Indica si el valor es un nombre de archivo simple, sin carpetas ni "..", para usarlo dentro de FILES_PATH
const esNombreArchivoSeguro = (nombre) => {
  return typeof nombre === 'string' && /^[\w.-]+$/.test(nombre) && !nombre.includes('..');
};

module.exports = esNombreArchivoSeguro;
