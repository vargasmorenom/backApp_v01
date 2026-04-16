const axios = require('axios');

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

/**
 * Middleware Express que valida el token reCAPTCHA v2.
 * Espera recaptchaToken en req.body o req.query.
 * Rechaza con 400 si el token falta o es inválido.
 */
async function verifyRecaptcha(req, res, next) {
    if (!RECAPTCHA_SECRET) {
        console.error('[reCAPTCHA] RECAPTCHA_SECRET no está configurado. Petición bloqueada.');
        return res.status(503).json({ error: 'Servicio no disponible temporalmente.' });
    }

    const token = req.body?.recaptchaToken || req.query?.recaptchaToken;

    if (!token) {
        return res.status(400).json({ error: 'reCAPTCHA requerido.' });
    }

    try {
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            { params: { secret: RECAPTCHA_SECRET, response: token } }
        );

        if (!response.data.success) {
            return res.status(400).json({ error: 'reCAPTCHA inválido o expirado.' });
        }

        return next();

    } catch (err) {
        console.error('[reCAPTCHA] Error al verificar:', err.message);
        return res.status(500).json({ error: 'Error al verificar reCAPTCHA.' });
    }
}

module.exports = verifyRecaptcha;
