const jwt = require('jsonwebtoken');
const decompressBase64 = require('../../helpers/decompressBase64');

const JWT_SECRET = process.env.TZT;

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(cookie => {
        const [key, ...val] = cookie.trim().split('=');
        cookies[key.trim()] = decodeURIComponent(val.join('='));
    });
    return cookies;
}

async function authSocket(socket, next) {
    try {
        const cookies = parseCookies(socket.handshake.headers.cookie);

        if (!cookies.AuthToken) {
            console.warn('[authSocket] Conexión rechazada - sin cookie AuthToken. Socket:', socket.id);
            return next(new Error('No autorizado. No se encontró sesión.'));
        }

        const sessionData = await decompressBase64(cookies.AuthToken);
        const { token } = sessionData;

        if (!token) {
            return next(new Error('Token no proporcionado.'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.data.user = decoded;

        return next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Sesión expirada. Refresca tu sesión e intenta de nuevo.'));
        }
        return next(new Error('Token inválido o error de autenticación.'));
    }
}

module.exports = authSocket;
