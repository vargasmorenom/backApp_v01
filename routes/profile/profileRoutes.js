const express = require('express');
const User = require('../../models/UserSchema');
const Profile = require('../../models/ProfileSchema');

const router = express.Router();

router.post("/", async (req, res) => {

      try {

      const {
        firstname,
        lastname,
        email,
        location,
        phoneNumber,
        chanelName,
        description,
        linksString,
        linksLength,
        links,
        socialMediaString,
        socialMediaLength,
        socialMedia,
        instantMessagesString,
        instantMessagesLength,
        instantMessages,
        likeNumber,
        likes,
        followingNumber,
        following,
        followersNumber,
        followers,
        profilepic,
        userBy
      } = req.body;
  
      // Validar campos obligatorios
      if (!chanelName || !userBy) {
        return res.status(400).json({ message: "Faltan campos obligatorios: chanelName, email o userBy" });
      }
  
      // Verificar si el usuario existe
      const user = await User.findById(userBy);
    
      if (!user) {
        return res.status(404).json({ message: "El usuario no existe" });
      }

      const profile = await Profile.findOne({userBy: userBy});
      
      if (profile) {
        return res.status(202).json({ message: "El usuario ya existe" });
      }
      
      
    //  Crear el perfil
      const nuevoPerfil = await Profile.create({
            firstname,
            lastname,
            email,
            location,
            phoneNumber,
            chanelName,
            description,
            linksString,
            linksLength,
            links,
            socialMediaString,
            socialMediaLength,
            socialMedia,
            instantMessagesString,
            instantMessagesLength,
            instantMessages,
            likeNumber,
            likes,
            followingNumber,
            following,
            followersNumber,
            followers,
            profilepic,
            userBy
      });
  
      return res.status(201).json({
        message: "Perfil creado correctamente"
      });
  
    } catch (error) {
      console.error("Error al crear el perfil:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;