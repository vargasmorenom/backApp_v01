const express = require('express');
const User = require('../../models/UserSchema');
const Profile = require('../../models/ProfileSchema');

const router = express.Router();


router.put("/", async (req, res) => {
  try {
    // Definición de constantes
    const SOCIAL_NETWORKS = ['facebook', 'instagram', 'youtube', 'tiktok', 'x', 'twitter'];
    const MESSAGING_APPS = ['whatsapp', 'telegram'];
    
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

    // Procesamiento de redes sociales
    const processSocialLinks = (linksString, validPlatforms) => {
      if (!linksString) return [];
      
      return linksString.split(',')
        .map(link => link.trim())
        .filter(link => link.length > 0)
        .reduce((result, link) => {
          const platform = validPlatforms.find(p => link.includes(p));
          if (platform) {
            result.push({ t: platform, r: link });
          }
          return result;
        }, []);
    };

    // Procesar los diferentes tipos de enlaces
    
     let processedSocialMedia = [];
     let  socialMediaLength = '';
     let  socialMediap = '';
    if(socialMedia != '' && socialMedia.length != profile.socialMediaLength){
        processedSocialMedia = processSocialLinks(socialMedia, SOCIAL_NETWORKS);
        socialMediaLength = socialMedia.length;
        socialMediap = socialMedia;
        
    }else{
      socialMediap = profile.socialMediaString;
      socialMediaLength = profile.socialMediaLength;
      processedSocialMedia = profile.socialMedia;

    }
    
     let processedMessages = [];
     let instantMessagesLength = '';
     let instantMessagesp = '';
    if(instantMessages != '' && instantMessages.length != profile.instantMessagesLength){
        processedMessages = processSocialLinks(instantMessages, MESSAGING_APPS);
         instantMessagesLength = instantMessages.length;
         instantMessagesp = instantMessages;
        
    }else{
      processedMessages = profile.instantMessages;
      instantMessagesLength = profile.instantMessagesLength;
      instantMessagesp = profile.instantMessagesString;
    }
    
     let processedLinks = [];
     let linksLength = '';
     let linksp = '';
    if(links != ''  && links.length != profile.linksLength){
 
        processedLinks = links ? links.split(',').map(link => link.trim()) : [];
        linksLength = links.length;
        linksp = linksp;
    }else{
      linksp = profile.linksString;
      linksLength = profile.linksLength;
      processedLinks = profile.links;

    }
    
    //Crear el nuevo perfil
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
      linksString:linksp,
      linksLength:linksLength,
      links: processedLinks,
      socialMediaString:socialMediap,
      socialMediaLength: socialMediaLength,
      socialMedia: processedSocialMedia,
      instantMessagesString:instantMessagesp,
      instantMessagesLength: instantMessagesLength,
      instantMessages: processedMessages,
      userBy
    });

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