const express = require('express');
const User = require('../../models/UserSchema');
const Profile = require('../../models/ProfileSchema');

const router = express.Router();


router.put("/", async (req, res) => {
  try {
    // Definición de constantes
    const SOCIAL_NETWORKS = ['facebook', 'instagram', 'youtube', 'tiktok', 'x', 'twitter'];
    const MESSAGING_APPS = ['whatsapp', 'telegram', 'signal', 'line', 'wechat', 'snapchat', 'viber', 'skype', 'discord'];
    
    // Extracción de datos del cuerpo de la solicitud
    const {
      firstName,
      lastName,
      email,
      location,
      phoneNumber,
      chanelName,
      description,
      links,
      socialMedia,
      instantMessages,
      userBy
    } = req.body;



    // Validación de campos obligatorios
    if (!chanelName || !userBy) {
      return res.status(400).json({ 
        message: "Faltan campos obligatorios: chanelName y userBy" 
      });
    }

    // Verificar si el usuario existe
    const user = await User.findById(userBy);
    if (!user) {
      return res.status(404).json({ message: "El usuario no existe" });
    }

    // Verificar si el perfil ya existe
    const profile = await Profile.findOne({ userBy });

    if (!profile) {
      return res.status(409).json({ message: "El perfil no existe" });
    }

    // Validar que el email no esté en uso por otra cuenta o perfil
    if (email && email !== user.email) {
      const [emailInUser, emailInProfile] = await Promise.all([
        User.findOne({ email, _id: { $ne: userBy } }),
        Profile.findOne({ email, userBy: { $ne: userBy } }),
      ]);
      if (emailInUser || emailInProfile) {
        return res.status(409).json({ message: "El email ya está siendo usado por otra cuenta" });
      }
    }

    const parseToObjects = (str, validPlatforms) => {
      if (!str) return [];
      return str.split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .reduce((acc, link) => {
          const platform = validPlatforms.find(p => link.toLowerCase().includes(p));
          if (platform) acc.push({ t: platform, r: link });
          return acc;
        }, []);
    };

    const parseToStrings = (str) => {
      if (!str) return [];
      return str.split(',').map(s => s.trim()).filter(Boolean);
    };

    await Profile.findOneAndUpdate(
      { userBy },
      {
        firstName,
        lastName,
        email,
        location,
        phoneNumber,
        chanelName,
        description,
        links: parseToStrings(links),
        socialMedia: parseToObjects(socialMedia, SOCIAL_NETWORKS),
        instantMessages: parseToObjects(instantMessages, MESSAGING_APPS),
        userBy,
      }
    );

    return res.status(201).json({
      message: "Perfil  Actualizado",
      data: 'exito'
    });

  } catch (error) {
    console.error("Error al Actualizar el perfil:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
module.exports = router;