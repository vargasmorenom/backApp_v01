const express = require('express');
const bcrypt = require("bcrypt");
const cryptJs = require("crypto-js");
const User = require('../../models/UserSchema');
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
                return res.status(206).json({ message: `El nombre de usuario "${username}" ya existe.` });
            }
            if (existingUser.email === email) {
                return res.status(206).json({ message: `El correo electrónico "${email}" ya está registrado.` });
            }
        }

        let decryptedPassword;
        try {
            decryptedPassword = cryptJs.AES.decrypt(password, process.env.ENCRYPT_KEY).toString(cryptJs.enc.Utf8);
        } catch {
            return res.status(400).json({ message: "La contraseña no pudo ser desencriptada correctamente." });
        }

        const hashedPassword = await bcrypt.hash(decryptedPassword, 10);
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
