const express = require('express');
const content = require('../../models/ContentSchema');

const router = express.Router();

router.post("/", async (req, res) => {
    try {
      const {
        urlIn,
        contentId
      } = req.body;
     
      // Validar campos obligatorios
      if (!urlIn || !contentId) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }

      const contentDta = await content.findOne({_id:contentId});
      console.log(contentId);
      if (!contentDta) {
        return res.status(207).json({ message: "este contenido no existe"});
      }
   
      if (contentDta.url.includes(urlIn)) {
        return res.status(207).json({ message: "Ya tienes este contenido"});
      }
  
  
      // agregar contenido
      const addContent = await content.findByIdAndUpdate(
        contentId,
        {
            $inc:{numcontents: 1},
            $push:{url: urlIn}
        },
        {new: true}
        );
        return res.json(addContent);
    //   return res.status(201).json({
    //     message: "Content ingresado correctamente"
    //   });
  
    } catch (error) {
      console.error("Error al crear el Post:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
module.exports = router;