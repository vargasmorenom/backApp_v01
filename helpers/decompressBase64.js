const zlib = require('zlib');
const { promisify } = require('util');

const gunzip = promisify(zlib.gunzip);

const decompressBase64 = async (base64) => {
  try {
    const buffer = Buffer.from(base64, 'base64');
    const decompressed = await gunzip(buffer);
    return JSON.parse(decompressed.toString('utf-8'));
  } catch (error) {
    throw new Error('Error al descomprimir Base64');
  }
};

module.exports = decompressBase64;
