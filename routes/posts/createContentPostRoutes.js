const express = require('express');
const Post = require('../../models/PostSchema');

const router = express.Router();

router.post("/", async (req, res) => {
    try {
      const {
        name,
        description,
        typePost,
        imagen,
        tags,
        access,
        profileUser,
        profileimage,
        postedBy,
      } = req.body;
  
      // Validar campos obligatorios
      if (!name || !typePost || !access || !postedBy) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
      const postName = await Post.findOne({name:name});

      if (postName) {
        return res.status(207).json({ message: "Ya tienes un contenido con este nombre"});
      }
  
  
      // Crear el Post
      const nuevoPost = await Post.create({
        name,
        description,
        typePost,
        imagen,
        tags,
        access,
        profileUser,
        profileimage,
        postedBy,
      });
  
      return res.status(201).json({
        message: "Post creado correctamente"
      });
  
    } catch (error) {
      console.error("Error al crear el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;