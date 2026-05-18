const jwt = require('jsonwebtoken');
const decompressBase64 = require('../../helpers/decompressBase64');

const JWT_SECRET = process.env.JWT_SECRET;

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
        const authToken = socket.handshake.auth?.token;

        // Sin ninguna credencial: permitir conexión anónima (solo eventos públicos)
        if (!cookies.AuthToken && !authToken) {
            console.warn('[authSocket] Conexión anónima. Socket:', socket.id);
            socket.data.user = null;
            return next();
        }

        let token;
        if (cookies.AuthToken) {
            const sessionData = await decompressBase64(cookies.AuthToken);
            token = sessionData.token;
        } else {
            // Fallback: token directo desde handshake.auth (Chrome mobile)
            token = authToken;
        }

        if (!token) {
            socket.data.user = null;
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.data.user = decoded;

        return next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.warn('[authSocket] Token expirado. Socket:', socket.id);
            socket.data.user = null;
            return next();
        }
        console.warn('[authSocket] Token inválido. Socket:', socket.id, error.message);
        socket.data.user = null;
        return next();
    }
}

module.exports = authSocket;
