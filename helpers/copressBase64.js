const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

const compressBase64 = async (data) => {
  try {
    const json = JSON.stringify(data);
    const compressed = await gzip(json);
    return compressed.toString('base64');
  } catch (error) {
    throw new Error('Error al comprimir a Base64');
  }
};

module.exports = compressBase64;