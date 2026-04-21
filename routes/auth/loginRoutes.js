const express = require('express');
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const User = require('../../models/UserSchema');
const Profile = require('../../models/ProfileSchema');
const ENCRYPT_KEY = process.env.ENCRYPT_KEY;
const upsertRefreshToken = require('../../helpers/adminTokenRefresh');
const adminTokens = require('../../helpers/adminTokens');
const compressBase64 = require('../../helpers/copressBase64');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días

router.post("/", async (req, res) => {

    try{

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    const user = await User.findOne({
        $or: [{ username }, { email: username }]
    });

    if (!user) {
        return res.status(401).json({ error: "Invalid login credentials." });
    }

    if (user.state === false) {
        return res.status(403).json({ message: "El usuario no está activo. Se ha enviado un correo a " + user.email + " para la activación de su cuenta." });
    }

    // Compatibilidad: acepta contraseña en claro (nuevo) o cifrada con AES (legacy frontend)
    let plainPassword = password;
    if (ENCRYPT_KEY) {
        try {
            const decrypted = CryptoJS.AES.decrypt(password, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
            if (decrypted) plainPassword = decrypted;
        } catch (_) {
            // no era AES, usar password tal cual
        }
    }

    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: "Invalid login credentials." });
    }

    const refreshToken = await adminTokens(user._id, REFRESH_TOKEN_TTL, null, JWT_SECRET);
    const accessToken = await adminTokens(user._id, '30m', null, JWT_SECRET);
    const refres = await upsertRefreshToken(user._id, refreshToken);

    const datosSession = {
        valida: refres.codeInterno,
        token: accessToken
    };

    const compressedData = await compressBase64(datosSession);

    const perfil = await Profile.findOne({ userBy: user._id }).lean();

    const responsedata = {
        usuario: user.username,
        id: user._id,
        perfil
    };
    
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('AuthToken', compressedData, {
        httpOnly: true,
        secure: isProd,
        sameSite: "Lax",
    });

    return res.status(200).json(responsedata);

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }


});

module.exports = router;
