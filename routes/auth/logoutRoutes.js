const express = require('express');
const RefreshToken = require('../../models/RefreshTokenchema');
const decompressBase64 = require('../../helpers/decompressBase64');

const router = express.Router();

// POST /api/v1/logout — invalida el refresh token y borra la cookie de sesión
router.post("/", async (req, res) => {
    try {
        if (req.cookies?.AuthToken) {
            const { valida } = await decompressBase64(req.cookies.AuthToken);
            if (typeof valida === 'string') {
                await RefreshToken.updateOne({ codeInterno: valida }, { $set: { state: false } });
            }
        }
    } catch (error) {
        console.error("Error en logout:", error.message);
    }

    res.clearCookie('AuthToken', { httpOnly: true, secure: true, sameSite: 'None', path: '/' });
    return res.status(200).json({ message: "Sesión cerrada" });
});

module.exports = router;
