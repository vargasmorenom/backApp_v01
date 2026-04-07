const express = require('express');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const User = require('../../models/UserSchema');

const router = express.Router();
const ENCRYPT_KEY = process.env.ENCRYPT_KEY;

router.put('/', async (req, res) => {
  try {
    const { userBy, passwordActual, password } = req.body;

    if (!userBy || !passwordActual || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    const decryptedActual = CryptoJS.AES.decrypt(passwordActual, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
    const decryptedNew = CryptoJS.AES.decrypt(password, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);

    if (!decryptedActual || !decryptedNew) {
      return res.status(400).json({ message: 'Error al procesar las contraseñas.' });
    }

    const user = await User.findById(userBy);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(decryptedActual, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNew = await bcrypt.hash(decryptedNew, salt);

    await User.findByIdAndUpdate(userBy, { password: hashedNew });

    return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
