const express = require('express');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/UserSchema');
const Profile = require('../../models/ProfileSchema');
const generarCombinacion = require('../../libs/tokengenerator');
const upsertRefreshToken = require('../../helpers/adminTokenRefresh');
const adminTokens = require('../../helpers/adminTokens');
const compressBase64 = require('../../helpers/copressBase64');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

async function generateUniqueUsername(base) {
    const sanitized = base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
    let username = sanitized;
    while (await User.exists({ username })) {
        username = sanitized + Math.floor(1000 + Math.random() * 9000);
    }
    return username;
}

router.post('/', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Token de Google requerido.' });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name, picture, email_verified } = payload;

        if (!email_verified) {
            return res.status(401).json({ message: 'El correo de Google no está verificado.' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            const username = await generateUniqueUsername(given_name || email.split('@')[0]);
            const hashedPassword = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 10);
            const token = generarCombinacion().join('');

            user = await User.create({
                username,
                email,
                password: hashedPassword,
                terms: true,
                state: true,
                token,
            });

            await Profile.create({
                userBy: user._id,
                chanelName: username,
                firstName: given_name || '',
                lastName: family_name || '',
                email,
                profilePic: picture ? { medium: picture } : undefined,
            });
        } else if (!user.state) {
            return res.status(403).json({ message: 'La cuenta está desactivada.' });
        }

        const refreshToken = await adminTokens(user._id, REFRESH_TOKEN_TTL, null, JWT_SECRET);
        const accessToken = await adminTokens(user._id, '30m', null, JWT_SECRET);
        const refres = await upsertRefreshToken(user._id, refreshToken);

        const sessionData = { valida: refres.codeInterno, token: accessToken };
        const compressedData = await compressBase64(sessionData);

        res.cookie('AuthToken', compressedData, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            path: '/',
        });

        const perfil = await Profile.findOne({ userBy: user._id }).lean();

        return res.status(200).json({
            usuario: user.username,
            id: user._id,
            perfil,
        });

    } catch (error) {
        console.error('[GoogleAuth] Error:', error.message);
        return res.status(401).json({ message: 'Token de Google inválido o expirado.' });
    }
});

module.exports = router;
