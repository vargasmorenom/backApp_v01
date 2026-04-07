// /home/mcvm/Documentos/node/listas-node-js/routes/libs/refreshTokenRoute.js

const express = require('express');
const router = express.Router();
const RefreshToken = require('../../models/RefreshTokenchema');
const upsertRefreshToken = require('../../helpers/adminTokenRefresh');
const adminTokens = require('../../helpers/adminTokens');
const decompressBase64 = require('../../helpers/decompressBase64');
const compressBase64 = require('../../helpers/copressBase64');

router.post("/", async (req, res) => {
    try {
        // 1. Verificar que exista la cookie de sesión
        if (!req.cookies || !req.cookies.AuthToken) {
            return res.status(401).json({ message: "No autorizado. No se encontró sesión." });
        }

        // 2. Descomprimir la cookie para obtener el 'codeInterno' (valida)
        const sessionData = await decompressBase64(req.cookies.AuthToken);
        const { valida } = sessionData; 

        if (!valida) {
            return res.status(401).json({ message: "Datos de sesión inválidos." });
        }

        // 3. Buscar el refresh token en la BD usando el codeInterno
        const storedToken = await RefreshToken.findOne({ codeInterno: valida });

        if (!storedToken) {
            // Si el token no existe, podría ser un intento de reuso o sesión inválida.
            return res.status(403).json({ message: "Token de refresco inválido o expirado." });
        }

        // 4. Verificar si el token ha expirado o está desactivado
        if (storedToken.state === false || storedToken.expiresAt < new Date()) {
            return res.status(403).json({ message: "La sesión ha expirado, por favor inicia sesión nuevamente." });
        }

        // 5. Rotación del Token (Sliding Session)
        // Llamamos a upsertRefreshToken para generar un nuevo 'codeInterno' y extender la expiración en BD.
        // Mantenemos el mismo JWT de refresco (storedToken.token) o podrías generar uno nuevo si quisieras.
        const refres = await upsertRefreshToken(storedToken.user, storedToken.token);

        // 6. Generar un nuevo Access Token (30 minutos)
        const newAccessToken = await adminTokens(storedToken.user, '30m', null, process.env.TZT);

        // 7. Actualizar la cookie con el nuevo Access Token y el nuevo codeInterno
        const newSessionData = {
            valida: refres.codeInterno,
            token: newAccessToken
        };

        const compressedData = await compressBase64(newSessionData);

        res.cookie('AuthToken', compressedData, {
            httpOnly: true,
            secure: true, // Cambiar a true si usas HTTPS
            sameSite: "Lax"
        });

        return res.status(200).json({ 
            message: "Token refrescado correctamente",
            token: newAccessToken // Se envía también en el body por si el frontend lo necesita en memoria
        });

    } catch (error) {
        console.error("Error al refrescar el token:", error);
        return res.status(500).json({ message: "Error interno del servidor al refrescar sesión." });
    }
});

module.exports = router;
