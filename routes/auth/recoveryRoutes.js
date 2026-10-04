const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const User = require('../../models/UserSchema');
const RefreshToken = require('../../models/RefreshTokenchema');
const { enviarCorreoRecuperacion, enviarCorreoConfirmacionPassword } = require('../../helpers/mailLibs');

const router = express.Router();
const ENCRYPT_KEY = process.env.ENCRYPT_KEY;
const MAX_INTENTOS = 5;

// El código se guarda como hash: quien lea la base de datos no puede usarlo
const hashCodigo = (code) => crypto.createHash('sha256').update(code).digest('hex');

// POST /api/v1/recovery — solicitar código de recuperación
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'El email es requerido.' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
        }

        if (user.state === false) {
            return res.status(403).json({ message: 'La cuenta no está activa.' });
        }

        const code = crypto.randomInt(100000, 1000000).toString(); // 6 dígitos
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await User.findByIdAndUpdate(user._id, {
            resetCode: hashCodigo(code),
            resetCodeExpiry: expiry,
            resetCodeAttempts: 0,
        });

        await enviarCorreoRecuperacion(user.email, user.username, code);

        return res.status(200).json({ message: 'Se ha enviado un código de recuperación a tu correo.' });

    } catch (error) {
        console.error('Error en recovery POST:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// PUT /api/v1/recovery — validar código y cambiar contraseña
router.put('/', async (req, res) => {
    try {
        const { email, code, password } = req.body;

        if (!email || !code || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        if (typeof email !== 'string' || typeof code !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
        }

        if (!user.resetCode || !user.resetCodeExpiry) {
            return res.status(400).json({ message: 'No hay un código de recuperación activo.' });
        }

        if (new Date() > user.resetCodeExpiry) {
            return res.status(401).json({ message: 'El código ha expirado. Solicita uno nuevo.' });
        }

        // Tras varios fallos el código deja de servir, aunque después se acierte
        if (user.resetCodeAttempts >= MAX_INTENTOS) {
            await User.findByIdAndUpdate(user._id, { resetCode: null, resetCodeExpiry: null });
            return res.status(401).json({ message: 'Demasiados intentos. Solicita un código nuevo.' });
        }

        if (user.resetCode !== hashCodigo(code)) {
            await User.updateOne({ _id: user._id }, { $inc: { resetCodeAttempts: 1 } });
            return res.status(401).json({ message: 'El código es incorrecto.' });
        }

        const decryptedNew = CryptoJS.AES.decrypt(password, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);

        if (!decryptedNew) {
            return res.status(400).json({ message: 'Error al procesar la contraseña.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNew = await bcrypt.hash(decryptedNew, salt);

        await User.findByIdAndUpdate(user._id, {
            password: hashedNew,
            resetCode: null,
            resetCodeExpiry: null,
            resetCodeAttempts: 0,
        });

        // Cierra las sesiones abiertas con la contraseña anterior
        await RefreshToken.updateOne({ user: user._id }, { $set: { state: false } });

        await enviarCorreoConfirmacionPassword(user.email, user.username);

        return res.status(200).json({ message: 'Contraseña restablecida correctamente.' });

    } catch (error) {
        console.error('Error en recovery PUT:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
