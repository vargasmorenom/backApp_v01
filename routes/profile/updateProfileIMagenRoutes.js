const express = require('express');
const User = require('../../models/UserSchema');
const Profile = require('../../models/ProfileSchema');
const esUsuarioSesion = require('../../helpers/esUsuarioSesion');
const esNombreArchivoSeguro = require('../../helpers/esNombreArchivoSeguro');

const router = express.Router();

router.put("/", async (req, res) => {

  try {
    
     const { profilePic, userBy, usuario } = req.body;
 
    // Validación de campos obligatorios
    if (!profilePic || !userBy || !usuario) {
      return res.status(400).json({ 
        message: "Faltan campos obligatorios" 
      });
    }

    // Verificar si el usuario existe
    // Solo se puede editar el perfil del usuario de la sesión
    if (!esUsuarioSesion(req, userBy)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // profilePic solo admite nombres de archivo simples o URLs https: luego se usan para borrar archivos
    const TAMANOS = ['small', 'medium', 'large', 'xlarge'];
    const picValida = typeof profilePic === 'object' && !Array.isArray(profilePic)
      && Object.keys(profilePic).every(k => TAMANOS.includes(k))
      && Object.values(profilePic).every(v => esNombreArchivoSeguro(v) || (typeof v === 'string' && /^https:\/\/\S+$/.test(v)));
    if (!picValida) {
      return res.status(400).json({ message: "profilePic no es válido" });
    }

    const user = await User.findById(userBy);
    if (!user) {
      return res.status(404).json({ message: "El usuario no existe" });
    }

    // Verificar si el perfil ya existe
    const profile = await Profile.findOne({ userBy });
      
    if (!profile) {
      return res.status(409).json({ message: "El perfil no existe" });
    }

    
    //Crear el nuevo perfil
    const updatedProfile = await Profile.findOneAndUpdate(
        { userBy },
    {
      profilePic
    });

     let profileUpdated = null;
    if (updatedProfile) {
           profileUpdated = await Profile.findOne({ userBy });
      if (!profileUpdated) {
        return res.status(404).json({ message: "Perfil no encontrado después de la actualización" });
      }
      
    }

    return res.status(201).json({
      message: "Perfil  Actualizado",
      data: 'exito',
      perfilUpdated: profileUpdated
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