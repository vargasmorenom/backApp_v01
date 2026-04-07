const express = require('express');
const axios = require('axios');
const User = require('../../models/UserSchema');
const infoConexion = require('../../models/InfoConexionUser');
const macquete = require('../../models/ContentSchema');

const router = express.Router();



router.post("/", async (req, res) => { 
    try {
      const { token, username } = req.body;
  

  
      return res.status(200).json(resultado);
  
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

module.exports = router;