const express = require('express');
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const User = require('../../models/UserSchema');
const ENCRYPT_KEY = process.env.ENCRYPT_KEY;
const generarCombinacion = require('../../libs/tokengenerator');
const { enviarCorreoVerificacion } = require('../../helpers/mailLibs');

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {
            username,
            phoneNumber,
            phoneCountry,
            phoneCodCountry,
            email,
            password,
            terms,
        } = req.body;

        if (!username || !email || !password || terms !== true) {
            return res.status(400).json({ message: "Faltan campos obligatorios o no se aceptaron los términos." });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(409).json({ message: `El nombre de usuario "${username}" ya existe.` });
            }
            if (existingUser.email === email) {
                return res.status(409).json({ message: `El correo electrónico "${email}" ya está registrado.` });
            }
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

        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const token = generarCombinacion().join("");

        const newUser = new User({
            username,
            phoneNumber,
            phoneCountry,
            phoneCodCountry,
            email,
            password: hashedPassword,
            terms,
            state: false,
            token,
        });

        await newUser.save();
        await enviarCorreoVerificacion(email, username, token);

        return res.status(201).json({
            message: "Usuario registrado correctamente. Revisa tu correo para activar tu cuenta.",
        });

    } catch (error) {
        console.error("Error en el registro:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
});

module.exports = router;
