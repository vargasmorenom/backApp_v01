const express = require('express');
const Post = require('../../models/PostSchema');

const router = express.Router();

router.delete("/", async (req, res) => {
    try {
     
      // Asegurarse de que se reciban los datos necesarios
      const { postId,postedBy } = req.body;

      // Validar que se recibieron los datos necesarios
      if (!postId || !postedBy) {
        return res.status(400).json({ message: "Datos incompletos" });
      }

      // Verificar si el post existe y si el usuario es el propietario
      const deletePost = await Post.deleteOne({_id : postId, postedBy: postedBy});

      return res.status(200).json({
        message: "Contenido eliminado correctamente del Post",
      });

  
    } catch (error) {
      console.error("Error al eliminar el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;
