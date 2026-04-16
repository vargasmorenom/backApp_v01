const jwt = require('jsonwebtoken');
const decompressBase64 = require('../helpers/decompressBase64');
const RefreshToken = require('../models/RefreshTokenchema');
const upsertRefreshToken = require('../helpers/adminTokenRefresh');
const adminTokens = require('../helpers/adminTokens');
const compressBase64 = require('../helpers/copressBase64');

const JWT_SECRET = process.env.JWT_SECRET;

const validaToken = async (req, res, next) => {
    try {
        // 1. Validar existencia de cookie
        if (!req.cookies || !req.cookies.AuthToken) {
            return res.status(401).json({ auth: false, message: "No autorizado. No se encontró sesión." });
        }

        // 2. Descomprimir token
        const sessionData = await decompressBase64(req.cookies.AuthToken);
        const { token } = sessionData;

        if (!token) {
            return res.status(401).json({ auth: false, message: "Token no proporcionado" });
        }

        // 3. Verificar JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Adjuntar usuario a la petición para uso en controladores
        req.user = decoded;

        return next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            try {
                // A. Recuperar datos de sesión para el refresco
                const sessionData = await decompressBase64(req.cookies.AuthToken);
                const { valida } = sessionData;

                if (!valida) {
                    return res.status(401).json({ auth: false, message: "Token expirado y sin credencial de renovación." });
                }

                // B. Buscar y validar el Refresh Token en BD
                const storedToken = await RefreshToken.findOne({ codeInterno: valida });

                if (!storedToken || storedToken.state === false || storedToken.expiresAt < new Date()) {
                    return res.status(401).json({ auth: false, message: "La sesión ha expirado completamente. Inicia sesión de nuevo." });
                }

                // C. Verificar si al Refresh Token le quedan menos de 24 horas de vida
                const now = new Date();
                const timeDiff = storedToken.expiresAt.getTime() - now.getTime();
                const hoursLeft = timeDiff / (1000 * 60 * 60);
                
                let currentRefreshToken = storedToken.token;
                if (hoursLeft < 24) {
                    const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
                    currentRefreshToken = await adminTokens(storedToken.user, REFRESH_TOKEN_TTL, null, JWT_SECRET);
                }

                // D. Rotar el Refresh Token y generar nuevo Access Token
                const refres = await upsertRefreshToken(storedToken.user, currentRefreshToken);
                const newAccessToken = await adminTokens(storedToken.user, '30m', null, JWT_SECRET);

                // E. Actualizar la cookie en la respuesta
                const newSessionData = { valida: refres.codeInterno, token: newAccessToken };
                const compressedData = await compressBase64(newSessionData);

                res.cookie('AuthToken', compressedData, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: "Lax" });
                
                // Actualizar request actual
                req.cookies.AuthToken = compressedData;

                // F. Inyectar el nuevo usuario decodificado y continuar
                const newDecoded = jwt.verify(newAccessToken, JWT_SECRET);
                req.user = newDecoded;

                return next();

            } catch (refreshError) {
                console.error("Error al refrescar token automáticamente:", refreshError.message);
                return res.status(401).json({ auth: false, message: "Error al renovar la sesión." });
            }
        }

        console.error('Error de autenticación:', error.message);
        return res.status(401).json({
            auth: false,
            message: "Token inválido o error de autenticación"
        });
    }
};

module.exports = validaToken;
