const express = require('express');
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const User = require('../../models/UserSchema');
const axios = require('axios');
const upsertRefreshToken = require('../../helpers/adminTokenRefresh');
const adminTokens = require('../../helpers/adminTokens');
const compressBase64 = require('../../helpers/copressBase64');
const router = express.Router();
const ENCRYPT_KEY = process.env.ENCRYPT_KEY;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días

router.post("/", async (req, res) => {

    try{

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    const decrypted = await CryptoJS.AES.decrypt(password, ENCRYPT_KEY);

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);


    const user = await User.findOne({
        $or: [{ username }, { email: username }]
    });

    if (!user) {
        return res.status(206).json({ error: "Invalid login credentials." });
    }
     

    if (user.state === false) {
        return res.status(206).json({ message: "El usuario no está activo. Se ha enviado un correo a " + user.email + " para la activación de su cuenta." });
    }

    const isMatch = await bcrypt.compare(decryptedText, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: "Invalid login credentials." });
    }
    
    const refreshToken = await adminTokens(user._id,REFRESH_TOKEN_TTL,null,process.env.TZT);

    const accessToken = await adminTokens(user._id,'30m',null,process.env.TZT);

    const refres = await upsertRefreshToken(user._id, refreshToken);

    const datosSession = {
        valida : refres.codeInterno,
        token: accessToken
    }    
   
    const compressedData = await compressBase64(datosSession);

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const profile = await axios.get(`${baseUrl}/api/v1/getprofile?id=` + user._id);
    
    const responsedata = {
        usuario: user.username,
        id: user._id,
        perfil: profile.data
        
    };
    
    res.cookie('AuthToken', compressedData, {
        httpOnly: true, // Protege contra ataques XSS
        secure: true,  // Cambiar a `true` en producción si usas HTTPS
        sameSite: "Lax", // Ajustar según el caso (ver detalles abajo)
      //  domain: "localhost", // O el dominio donde quieres que sea visible
       // path: "localhost:8100/*"
    });

    return res.status(200).json(responsedata);

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }


});

module.exports = router;
