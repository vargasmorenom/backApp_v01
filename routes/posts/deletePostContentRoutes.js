const express = require('express');
const Post = require('../../models/PostSchema');

const router = express.Router();

router.delete("/", async (req, res) => {
    try {

      const { postId, contentId } = req.query;

      // Validar que se recibieron los datos necesarios
      if (!postId || !contentId) {
        return res.status(400).json({ message: "Datos incompletos" });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post no encontrado" });
      }

      const originalLength = post.content.length;

      // Filtra el item cuyo id coincida sin importar la estructura (Facebook usa listas.id, otros usan id directo)
      post.content = post.content.filter(item => {
        const itemId = item?.listas?.id ?? item?.id;
        return String(itemId) !== String(contentId);
      });

      if (post.content.length === originalLength) {
        return res.status(400).json({ message: "Contenido no encontrado en el Post" });
      }

      await post.save();

      return res.status(200).json({
        message: "Contenido eliminado correctamente del Post",
      });

  
    } catch (error) {
      console.error("Error al crear el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;

  