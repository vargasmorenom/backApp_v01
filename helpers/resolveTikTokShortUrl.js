const axios = require('axios');

const MAX_SALTOS = 5;
const URL_FINAL = /tiktok\.com\/@[^/]+\/(video|photo)\/\d+/;

// Sigue las redirecciones de un enlace corto (vm./vt.tiktok.com) hasta llegar
// a la URL canónica /@usuario/(video|photo)/ID. Devuelve null si no hubo redirección.
async function resolveTikTokShortUrl(shortUrl) {
  let actual = shortUrl;

  try {
    for (let i = 0; i < MAX_SALTOS && !URL_FINAL.test(actual); i++) {
      const response = await axios.get(actual, {
        maxRedirects: 0, // No seguir redirecciones automáticamente
        validateStatus: () => true,
        headers: {
          'User-Agent': 'Mozilla/5.0' // TikTok puede requerirlo
        }
      });

      const location = response.headers?.location;
      if (response.status < 300 || response.status >= 400 || !location) break;

      // La cabecera Location puede venir relativa
      actual = new URL(location, actual).toString();
    }
  } catch (error) {
    console.error('Error al resolver la URL:', error.message);
  }

  return actual !== shortUrl ? actual : null;
}

module.exports = resolveTikTokShortUrl
