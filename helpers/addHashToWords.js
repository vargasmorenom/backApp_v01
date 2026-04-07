function addHashToWords(text) {
  if (typeof text !== 'string') {
    throw new Error('El argumento debe ser un string');
  }

  // Dividimos por espacios en blanco (uno o más)
  const words = text.trim().split(/\s+/);

  // Agregamos '#' al inicio de cada palabra
  const hashedWords = words.map(word => `#${word}`);

  // Unimos con espacio entre ellas
  return hashedWords.join(' ');
}
module.exports = addHashToWords;