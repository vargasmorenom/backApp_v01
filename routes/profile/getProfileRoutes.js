const express = require('express');
const Profile = require('../../models/ProfileSchema');

const router = express.Router();

router.get("/", async (req, res) => {
    try {
  
      
      const id = req.query.id;
  
      // Validar campos obligatorios
      if (!id) {
        return res.status(400).json({ message: "Faltan campos obligatorios: chanelName, email o userBy" });
      }
  
      // Verificar si el usuario existe
      const profile = await Profile.findOne({userBy : id});

      if (!profile || null) {
        return res.status(201).json({ message: "El usuario no existe" });
      }
  
  
      return res.status(200).json(profile);
  
    } catch (error) {
      console.error("Error al crear el perfil:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;