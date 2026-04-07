const axios = require('axios');

async function resolveTikTokShortUrl(shortUrl) {
  try {
    const response = await axios.get(shortUrl, {
      maxRedirects: 0, // No seguir redirecciones automáticamente
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0' // TikTok puede requerirlo
      }
    });

    if (response.headers.location) {
    //  console.log('URL real:', response.headers.location);
      return response.headers.location;
    } else {
      console.log('No hubo redirección.');
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === 301 || error.response.status === 302) {
      return error.response.headers.location;
    }
    console.error('Error al resolver la URL:', error.message);
    return null;
  }
}

module.exports = resolveTikTokShortUrl
