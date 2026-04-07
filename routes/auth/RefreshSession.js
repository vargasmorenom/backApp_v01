const express = require('express');
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const User = require('../../models/UserSchema');
const jwt = require("jsonwebtoken");
const axios = require('axios');
const config = require('node-yaml');
const upsertRefreshToken = require('../../helpers/adminTokenRefresh');
const adminTokens = require('../../helpers/adminTokens');
const compressBase64 = require('../../helpers/copressBase64');


const router = express.Router();
const dta = config.readSync(__dirname + '/../../config.yaml');
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días

router.post("/", async (req, res, next) => {

    try{

    const { username, password } = req.body;

    
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
